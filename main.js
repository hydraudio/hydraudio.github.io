document.addEventListener('DOMContentLoaded', () => {
  console.log("✅ DOM fully loaded");

  let playlist = [];
  let currentTrackIndex = 0;
  let audioPlayer = null;

  const fileInput = document.getElementById('fileInput');
  const albumArtElement = document.getElementById('albumArt');
  const trackInfo = document.getElementById('track-info');
  const volumeControl = document.getElementById('volumeControl');

  fileInput.addEventListener('change', (event) => {
    console.log("📁 File selected");
    const files = Array.from(event.target.files).filter(f => f.type.startsWith('audio/'));
    playlist = [];

    files.forEach((file) => {
      jsmediatags.read(file, {
        onSuccess: (tag) => {
          const trackNum = parseInt((tag.tags.track || '0').split('/')[0]);
          playlist.push({
            file,
            trackNum,
            artist: tag.tags.artist || 'Unknown Artist',
            title: tag.tags.title || 'Unknown Title',
            album: tag.tags.album || 'Unknown Album',
            picture: tag.tags.picture || null
          });
          if (playlist.length === files.length) {
            playlist.sort((a, b) => a.trackNum - b.trackNum || a.file.name.localeCompare(b.file.name));
            loadTrack(currentTrackIndex);
          }
        },
        onError: () => {
          playlist.push({
            file,
            trackNum: 0,
            artist: 'Unknown Artist',
            title: file.name,
            album: '',
            picture: null
          });
        }
      });
    });
  });

  function loadTrack(index) {
    const track = playlist[index];
    if (!track) return;

    console.log("🎵 Loading track:", track.title);

    const { file, artist, title, album, picture } = track;
    trackInfo.textContent = `${artist} - ${title}`;

    if (picture) {
      const base64 = btoa(String.fromCharCode(...new Uint8Array(picture.data)));
      albumArtElement.src = `data:${picture.format};base64,${base64}`;
      albumArtElement.style.display = 'block';
    } else {
      albumArtElement.style.display = 'none';
    }

    if (audioPlayer) {
      audioPlayer.unload();
    }

    const url = URL.createObjectURL(file);
    audioPlayer = new Howl({
      src: [url],
      html5: true,
      onend: () => {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        loadTrack(currentTrackIndex);
      }
    });

    audioPlayer.play();
  }

  document.getElementById('play').addEventListener('click', () => {
    if (audioPlayer) {
      if (audioPlayer.playing()) {
        audioPlayer.pause();
      } else {
        audioPlayer.play();
      }
    }
  });

  document.getElementById('next').addEventListener('click', () => {
    if (playlist.length > 0) {
      currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
      loadTrack(currentTrackIndex);
    }
  });

  document.getElementById('prev').addEventListener('click', () => {
    if (playlist.length > 0) {
      currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
      loadTrack(currentTrackIndex);
    }
  });

  document.getElementById('rewind').addEventListener('click', () => {
    if (audioPlayer) {
      audioPlayer.seek(Math.max(audioPlayer.seek() - 10, 0));
    }
  });

  document.getElementById('forward').addEventListener('click', () => {
    if (audioPlayer) {
      audioPlayer.seek(Math.min(audioPlayer.seek() + 10, audioPlayer.duration()));
    }
  });

  volumeControl.addEventListener('input', () => {
    if (audioPlayer) {
      audioPlayer.volume(volumeControl.value / 100);
    }
  });
});
