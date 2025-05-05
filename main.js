let playlist = [];
let currentTrack = 0;
let audioPlayer = null;

// DOM elements
const fileInput = document.getElementById('fileInput');
const albumArt = document.getElementById('albumArt');
const trackInfo = document.getElementById('track-info');
const volumeSlider = document.getElementById('volumeControl');

// Handle file input
fileInput.addEventListener('change', (event) => {
  const files = Array.from(event.target.files).filter(f => f.type.startsWith('audio/'));

  if (!files.length) return;

  playlist = [];
  let processed = 0;

  console.log("📦 Files detected:", files.length);

  files.forEach(file => {
    jsmediatags.read(file, {
      onSuccess: tag => {
        const trackNum = parseInt((tag.tags.track || '').toString().split('/')[0]) || 0;
        playlist.push({
          file,
          trackNum,
          artist: tag.tags.artist || 'Unknown Artist',
          title: tag.tags.title || file.name,
          album: tag.tags.album || '',
          picture: tag.tags.picture || null
        });
        checkDone();
      },
      onError: () => {
        playlist.push({ file, trackNum: 0, artist: 'Unknown Artist', title: file.name, album: '', picture: null });
        checkDone();
      }
    });
  });

  function checkDone() {
    processed++;
    if (processed === files.length) {
      playlist.sort((a, b) => a.trackNum - b.trackNum || a.file.name.localeCompare(b.file.name));
      console.log("✅ Playlist built:", playlist.map(t => t.title));
      loadAndPlayTrack(currentTrack);
    }
  }
});

// Load and play track
function loadAndPlayTrack(index) {
  if (!playlist[index]) {
    console.warn("❌ Track index out of bounds:", index);
    return;
  }

  const { file, artist, title, picture } = playlist[index];
  console.log(`▶ Loading: ${title} by ${artist}`);

  trackInfo.textContent = `${artist} - ${title}`;

  if (picture) {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(picture.data)));
    albumArt.src = `data:${picture.format};base64,${base64}`;
    albumArt.style.display = 'block';
  } else {
    albumArt.style.display = 'none';
  }

  const url = URL.createObjectURL(file);

  if (audioPlayer) {
    audioPlayer.unload();
  }

  audioPlayer = new Howl({
    src: [url],
    html5: true,
    onend: () => {
      currentTrack = (currentTrack + 1) % playlist.length;
      loadAndPlayTrack(currentTrack);
    }
  });

  audioPlayer.play();
}

// Button controls
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
  currentTrack = (currentTrack + 1) % playlist.length;
  loadAndPlayTrack(currentTrack);
});

document.getElementById('prev').addEventListener('click', () => {
  currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
  loadAndPlayTrack(currentTrack);
});

document.getElementById('rewind').addEventListener('click', () => {
  if (audioPlayer) {
    const time = Math.max(audioPlayer.seek() - 10, 0);
    audioPlayer.seek(time);
  }
});

document.getElementById('forward').addEventListener('click', () => {
  if (audioPlayer) {
    const time = Math.min(audioPlayer.seek() + 10, audioPlayer.duration());
    audioPlayer.seek(time);
  }
});

volumeSlider.addEventListener('input', () => {
  if (audioPlayer) {
    audioPlayer.volume(volumeSlider.value / 100);
  }
});
