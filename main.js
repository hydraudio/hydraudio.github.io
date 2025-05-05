
// ✅ DOM fully loaded
console.log("✅ DOM fully loaded");

const fileInput = document.getElementById('fileInput');
const albumArt = document.getElementById('albumArt');
const trackInfo = document.getElementById('trackInfo');
const playBtn = document.getElementById('playPauseBtn');
const volumeControl = document.getElementById('volumeControl');

let playlist = [];
let currentTrack = 0;
let audioPlayer = null;

// 📁 File input event
fileInput.addEventListener('change', async (event) => {
  console.log("📁 File selected");
  const files = Array.from(event.target.files).filter(file => file.type.startsWith('audio/'));
  playlist = [];

  for (let file of files) {
    await new Promise((resolve) => {
      jsmediatags.read(file, {
        onSuccess: (tag) => {
          const tags = tag.tags;
          const trackNum = parseInt((tags.track || '').toString().split('/')[0]) || 0;
          playlist.push({
            file,
            title: tags.title || file.name,
            artist: tags.artist || 'Unknown Artist',
            album: tags.album || 'Unknown Album',
            picture: tags.picture || null,
            trackNum
          });
          resolve();
        },
        onError: () => {
          playlist.push({
            file,
            title: file.name,
            artist: 'Unknown Artist',
            album: 'Unknown Album',
            picture: null,
            trackNum: 0
          });
          resolve();
        }
      });
    });
  }

  playlist.sort((a, b) => a.trackNum - b.trackNum || a.file.name.localeCompare(b.file.name));
  console.log("🎶 Playlist ready:", playlist.map(t => t.title));
  currentTrack = 0;
  loadTrack(currentTrack);
});

function loadTrack(index) {
  if (!playlist[index]) return;

  const { file, title, artist, picture } = playlist[index];
  console.log("🎵 Loading track:", title);

  // Update track info
  if (trackInfo) {
    trackInfo.textContent = `${artist} - ${title}`;
  }

  // Update album art
  if (albumArt && picture) {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(picture.data)));
    albumArt.src = `data:${picture.format};base64,${base64}`;
    albumArt.style.display = 'block';
  } else if (albumArt) {
    albumArt.style.display = 'none';
  }

  // Unload previous Howl
  if (audioPlayer) {
    audioPlayer.unload();
  }

  const url = URL.createObjectURL(file);

  audioPlayer = new Howl({
    src: [url],
    html5: true,
    onend: () => {
      currentTrack = (currentTrack + 1) % playlist.length;
      loadTrack(currentTrack);
    }
  });

  audioPlayer.play();
}

// ▶ Play/Pause
playBtn?.addEventListener('click', () => {
  if (!audioPlayer) return;
  if (audioPlayer.playing()) {
    audioPlayer.pause();
  } else {
    audioPlayer.play();
  }
});

// 🔊 Volume
volumeControl?.addEventListener('input', () => {
  if (audioPlayer) {
    audioPlayer.volume(volumeControl.value / 100);
  }
});
