console.log("✅ DOM fully loaded");

let playlist = [];
let currentIndex = 0;
let audioPlayer = null;

const fileInput = document.getElementById('fileInput');
const trackInfo = document.getElementById('trackInfo');
const albumArt = document.getElementById('albumArt');
const playPauseBtn = document.getElementById('playPauseBtn');
const volumeControl = document.getElementById('volumeControl');

fileInput.addEventListener('change', async (event) => {
  console.log("📁 File selected");

  const files = Array.from(event.target.files).filter(f => f.type.startsWith('audio/'));

  // Build playlist with metadata BEFORE calling loadTrack()
  playlist = await Promise.all(files.map(file => {
    return new Promise(resolve => {
      window.jsmediatags.read(file, {
        onSuccess: tag => {
          const trackNum = parseInt((tag.tags.track || '').toString().split('/')[0]) || 0;
          resolve({
            file,
            url: URL.createObjectURL(file),
            title: tag.tags.title || file.name,
            artist: tag.tags.artist || 'Unknown Artist',
            album: tag.tags.album || 'Unknown Album',
            picture: tag.tags.picture || null,
            trackNum
          });
        },
        onError: () => {
          resolve({
            file,
            url: URL.createObjectURL(file),
            title: file.name,
            artist: 'Unknown Artist',
            album: 'Unknown Album',
            picture: null,
            trackNum: 0
          });
        }
      });
    });
  }));

  // Sort playlist by track number or file name
  playlist.sort((a, b) => a.trackNum - b.trackNum || a.title.localeCompare(b.title));

  console.log("🎶 Playlist ready:", playlist.map(t => t.title));

  // Start playing the first track
  loadTrack(0);
});

function loadTrack(index) {
  const track = playlist[index];
  if (!track) return;

  console.log("🎵 Loading track:", track.title);

  // Clean up previous player
  if (audioPlayer) {
    audioPlayer.unload();
  }

  // Update UI
  trackInfo.textContent = `${track.artist} - ${track.title}`;

  if (track.picture) {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(track.picture.data)));
    albumArt.src = `data:${track.picture.format};base64,${base64}`;
    albumArt.style.display = 'block';
  } else {
    albumArt.style.display = 'none';
  }

  // Create Howler player
  audioPlayer = new Howl({
    src: [track.url],
    html5: true,
    volume: volumeControl.value / 100,
    onend: () => {
      currentIndex = (currentIndex + 1) % playlist.length;
      loadTrack(currentIndex);
    }
  });

  audioPlayer.play();
}

playPauseBtn.addEventListener('click', () => {
  if (audioPlayer) {
    if (audioPlayer.playing()) {
      audioPlayer.pause();
    } else {
      audioPlayer.play();
    }
  }
});

volumeControl.addEventListener('input', () => {
  if (audioPlayer) {
    audioPlayer.volume(volumeControl.value / 100);
  }
});
