// ✅ DOM references
const fileInput = document.getElementById('fileInput');
const albumArt = document.getElementById('albumArt');
const trackInfo = document.getElementById('trackInfo');
const playPauseBtn = document.getElementById('playPauseBtn');
const volumeControl = document.getElementById('volumeControl');

// ✅ Audio state
let playlist = [];
let currentTrack = 0;
let audioPlayer = null;

// ✅ Handle file selection
fileInput.addEventListener('change', (event) => {
  console.log('📁 File selected');
  const files = Array.from(event.target.files).filter(f => f.type.startsWith('audio/'));
  playlist = [];
  let processed = 0;

  files.forEach(file => {
    jsmediatags.read(file, {
      onSuccess: (tag) => {
        const trackNum = parseInt((tag.tags.track || '').toString().split('/')[0]) || 0;
        playlist.push({
          file,
          trackNum,
          artist: tag.tags.artist || 'Unknown Artist',
          title: tag.tags.title || file.name,
          album: tag.tags.album || '',
          picture: tag.tags.picture || null
        });
        processed++;
        if (processed === files.length) {
          finalizePlaylist();
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
        processed++;
        if (processed === files.length) {
          finalizePlaylist();
        }
      }
    });
  });
});

function finalizePlaylist() {
  playlist.sort((a, b) => a.trackNum - b.trackNum || a.file.name.localeCompare(b.file.name));
  console.log('✅ Playlist ready:', playlist.map(p => p.title));
  loadTrack(currentTrack);
}

function loadTrack(index) {
  const entry = playlist[index];
  if (!entry) return;

  console.log(`🎵 Loading track: ${entry.title} by ${entry.artist}`);

  // Cleanup
  if (audioPlayer) {
    audioPlayer.unload();
  }

  const url = URL.createObjectURL(entry.file);
  trackInfo.textContent = `${entry.artist} - ${entry.title}`;

  // Album art
  if (entry.picture) {
    const { data, format } = entry.picture;
    const base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
    albumArt.src = `data:${format};base64,${base64}`;
    albumArt.style.display = 'block';
  } else {
    albumArt.style.display = 'none';
  }

  // Init Howler
  audioPlayer = new Howl({
    src: [url],
    html5: true,
    volume: volumeControl.value / 100,
    onend: () => {
      currentTrack = (currentTrack + 1) % playlist.length;
      loadTrack(currentTrack);
    }
  });

  audioPlayer.play();
}

// ✅ Playback controls
playPauseBtn.addEventListener('click', () => {
  if (!audioPlayer) return;
  if (audioPlayer.playing()) {
    audioPlayer.pause();
  } else {
    audioPlayer.play();
  }
});

volumeControl.addEventListener('input', () => {
  if (audioPlayer) {
    audioPlayer.volume(volumeControl.value / 100);
  }
});
