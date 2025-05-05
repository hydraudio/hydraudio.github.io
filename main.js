
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
            const trackNum = parseInt((tag.tags.track || '0').toString().split('/')[0]) || 0;
            playlist.push({
              file,
              trackNum,
              artist: tag.tags.artist || 'UNKNOWN ARTIST',
              title: tag.tags.title || file.name,
              picture: tag.tags.picture || null
            });
            resolve();
          },
          onError: () => {
            playlist.push({
              file,
              trackNum: 0,
              artist: 'UNKNOWN ARTIST',
              title: file.name,
              picture: null
            });
            resolve();
          }
        });
      });
    }

    playlist.sort((a, b) => a.trackNum - b.trackNum || a.title.localeCompare(b.title));
    console.log('🎶 Playlist ready: ', playlist.map(p => p.title));

    currentTrack = 0;
    loadTrack(currentTrack); // Always call with one argument
  });

  function loadTrack(index) {
    if (!playlist[index]) return;

    const { file, artist, title, picture } = playlist[index];
    console.log(`🎵 Loading track: ${title}`);

    trackInfo.textContent = `${artist.toUpperCase()} - ${title.toUpperCase()}`;

    if (picture) {
      const base64 = btoa(String.fromCharCode(...new Uint8Array(picture.data)));
      albumArt.src = `data:${picture.format};base64,${base64}`;
    } else {
      albumArt.src = '';
    }

    const objectURL = URL.createObjectURL(file);
    if (audio) audio.unload?.();

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
    if (audio?.playing()) {
      audio.pause();
    } else {
      audio?.play();
    }
  });

  document.getElementById('prev')?.addEventListener('click', () => {
    currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrack);
  });

  document.getElementById('next')?.addEventListener('click', () => {
    currentTrack = (currentTrack + 1) % playlist.length;
    loadTrack(currentTrack);
  });

  document.getElementById('rewind')?.addEventListener('click', () => {
    if (audio) {
      const t = audio.seek();
      audio.seek(Math.max(0, t - 10));
    }
  });

  document.getElementById('forward')?.addEventListener('click', () => {
    if (audio) {
      const t = audio.seek();
      audio.seek(Math.min(audio.duration(), t + 10));
    }
  });

  volumeControl?.addEventListener('input', () => {
    if (audio) {
      audio.volume(volumeControl.value / 100);
    }
  });
});
