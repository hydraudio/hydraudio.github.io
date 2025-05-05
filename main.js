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

  playlist = await Promise.all(files.map(file => {
    return new Promise(resolve => {
      window.jsmediatags.read(file, {
        onSuccess: tag => {
          const trackNum = parseInt((tag.tags.track || '').toString().split('/')[0]) || 0;
          resolve({
            file,
            url: URL.createObjectURL(file),
            title: tag.tags.title || file.name,
            artist: tag.tags.artist || "Unknown Artist",
            album: tag.tags.album || "Unknown Album",
            picture: tag.tags.picture || null,
            trackNum
          });
        },
        onError: () => {
          resolve({
            file,
            url: URL.createObjectURL(file),
            title: file.name,
            artist: "Unknown Artist",
            album: "Unknown Album",
            picture: null,
            trackNum: 0
          });
        }
      });
    });
  }));

  // Sort playlist
  playlist.sort((a, b) => a.trackNum - b.trackNum || a.title.localeCompare(b.title));
  console.log("🎶 Sorted playlist:", playlist.map(p => p.title));
  playTrack(0);
});

function playTrack(index) {
  if (!playlist[index]) return;
  currentIndex = index;

  const track = playlist[index];
  console.log("🎵 Loading track:", track.title);

  // Cleanup old player
  if (audioPlayer) {
    audioPlayer.unload();
  }

  // Create Howler audio
  audioPlayer = new Howl({
    src: [track.url],
    html5: true,
    onend: () => {
      let nextIndex = (currentIndex + 1) % playlist.length;
      playTrack(nextIndex);
    }
  });

  // Display track info
  trackInfo.textContent = `${track.artist} - ${track.title}`;

  // Display album art
  if (track.picture) {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(track.picture.data)));
    albumArt.src = `data:${track.picture.format};base64,${base64}`;
    albumArt.style.display = 'block';
  } else {
    albumArt.style.display = 'none';
  }

  // Play it
  audioPlayer.play();
}

// Play/Pause control
playPauseBtn.addEventListener('click', () => {
  if (audioPlayer) {
    if (audioPlayer.playing()) {
      audioPlayer.pause();
    } else {
      audioPlayer.play();
    }
  }
});

// Volume control
volumeControl.addEventListener('input', () => {
  if (audioPlayer) {
    audioPlayer.volume(volumeControl.value / 100);
  }
});
