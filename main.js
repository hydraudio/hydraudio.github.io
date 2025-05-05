// ✅ DOM fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ DOM fully loaded');

  const fileInput = document.getElementById('fileInput');
  const albumArt = document.getElementById('albumArt');
  const trackInfo = document.getElementById('trackInfo');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const volumeControl = document.getElementById('volumeControl');
  const container = document.getElementById('container');

  let playlist = [];
  let currentTrack = 0;
  let audio = null;

  fileInput.addEventListener('change', async (event) => {
    console.log('📁 File selected');
    const files = Array.from(event.target.files).filter(f => f.type.startsWith('audio/'));
    playlist = [];

    for (const file of files) {
      await new Promise((resolve) => {
        window.jsmediatags.read(file, {
          onSuccess: (tag) => {
            const trackNum = parseInt((tag.tags.track || '').split('/')[0]) || 0;
            playlist.push({
              file,
              trackNum,
              title: tag.tags.title || file.name,
              artist: tag.tags.artist || 'UNKNOWN',
              picture: tag.tags.picture || null
            });
            resolve();
          },
          onError: () => {
            playlist.push({ file, trackNum: 0, title: file.name, artist: 'UNKNOWN', picture: null });
            resolve();
          }
        });
      });
    }

    // Sort by track number, fallback to filename
    playlist.sort((a, b) => a.trackNum - b.trackNum || a.title.localeCompare(b.title));
    console.log('🎶 Playlist ready:', playlist.map(p => `"${p.title}"`));

    currentTrack = 0;
    loadTrack(currentTrack);
  });

  function loadTrack(index) {
    if (!playlist[index]) return;
    const { file, artist, title, picture } = playlist[index];

    console.log(`🎵 Loading track: ${title}`);
    if (trackInfo) {
      trackInfo.textContent = `${artist.toUpperCase()} - ${title.toUpperCase()}`;
    }

    if (picture && albumArt) {
      const base64 = btoa(String.fromCharCode(...new Uint8Array(picture.data)));
      albumArt.src = `data:${picture.format};base64,${base64}`;
      albumArt.style.display = 'block';
    } else if (albumArt) {
      albumArt.src = '';
      albumArt.style.display = 'none';
    }

    const objectURL = URL.createObjectURL(file);
    if (audio) audio.unload();

    audio = new Howl({
      src: [objectURL],
      html5: true,
      onplay: () => {
        container.classList.add('active');
      },
      onend: () => {
        currentTrack = (currentTrack + 1) % playlist.length;
        loadTrack(currentTrack);
      }
    });

    audio.play();
  }

  playPauseBtn?.addEventListener('click', () => {
    if (audio) {
      if (audio.playing()) {
        audio.pause();
      } else {
        audio.play();
      }
    }
  });

  volumeControl?.addEventListener('input', () => {
    if (audio) {
      audio.volume(volumeControl.value / 100);
    }
  });
});
