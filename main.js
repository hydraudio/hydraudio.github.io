document.addEventListener('DOMContentLoaded', () => {
  console.log("✅ DOM fully loaded");

  const fileInput = document.getElementById('fileInput');
  const title = document.getElementById('title');
  const albumArt = document.getElementById('albumArt');
  const trackInfo = document.getElementById('track-info');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const volumeSlider = document.getElementById('volumeControl');
  const ui = document.getElementById('ui');

  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const rewindBtn = document.getElementById('rewind');
  const forwardBtn = document.getElementById('forward');

  let playlist = [];
  let currentTrack = 0;
  let audio = null;

  fileInput.addEventListener('change', async (event) => {
    console.log("📁 File selected");
    const files = Array.from(event.target.files).filter(f => f.type.startsWith('audio/'));
    const promises = files.map(file => new Promise((resolve) => {
      window.jsmediatags.read(file, {
        onSuccess: ({ tags }) => {
          const track = {
            file,
            title: tags.title || file.name,
            artist: tags.artist || 'UNKNOWN',
            album: tags.album || '',
            picture: tags.picture || null,
            trackNum: parseInt((tags.track || '0').split('/')[0]) || 0
          };
          resolve(track);
        },
        onError: () => {
          resolve({ file, title: file.name, artist: 'UNKNOWN', album: '', picture: null, trackNum: 0 });
        }
      });
    }));

    playlist = await Promise.all(promises);
    playlist.sort((a, b) => a.trackNum - b.trackNum || a.file.name.localeCompare(b.file.name));
    console.log("🎶 Playlist ready: ", playlist.map(p => p.title));
    currentTrack = 0;
    loadTrack(currentTrack);
  });

  function loadTrack(index) {
    if (!playlist[index]) return;

    const { file, artist, title: songTitle, picture } = playlist[index];
    console.log(`🎵 Loading track: ${songTitle}`);

    trackInfo.textContent = `${artist.toUpperCase()} - ${songTitle.toUpperCase()}`;

    if (picture) {
      const base64 = btoa(String.fromCharCode(...new Uint8Array(picture.data)));
      albumArt.src = `data:${picture.format};base64,${base64}`;
    } else {
      albumArt.src = '';
    }

    const objectURL = URL.createObjectURL(file);
    if (audio) audio.unload();

    audio = new Howl({
      src: [objectURL],
      html5: true,
      onplay: () => {
        document.getElementById('container').classList.add('active');
      },
onend: () => {
    currentTrack = (currentTrack + 1) % playlist.length;
    setTimeout(() => loadTrack(currentTrack), 200); // Delay to prevent call stack overflow
}

        audio.play();
      }
    });

    audio.play();
  }

  playPauseBtn.addEventListener('click', () => {
    if (audio) {
      if (audio.playing()) {
        audio.pause();
      } else {
        audio.play();
      }
    }
  });

  volumeSlider.addEventListener('input', () => {
    if (audio) {
      audio.volume(volumeSlider.value / 100);
    }
  });

  prevBtn.addEventListener('click', () => {
    currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrack);
  });

  nextBtn.addEventListener('click', () => {
    currentTrack = (currentTrack + 1) % playlist.length;
    loadTrack(currentTrack);
  });

  rewindBtn.addEventListener('click', () => {
    if (audio) audio.seek(Math.max(audio.seek() - 10, 0));
  });

  forwardBtn.addEventListener('click', () => {
    if (audio) audio.seek(Math.min(audio.seek() + 10, audio.duration()));
  });
});
