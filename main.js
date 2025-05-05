console.log("✅ DOM fully loaded");

let playlist = [];
let currentTrack = 0;
let audioPlayer = null;
let loading = false;

const fileInput = document.getElementById("fileInput");
const albumArt = document.getElementById("albumArt");
const trackInfo = document.getElementById("trackInfo");
const playPauseBtn = document.getElementById("playPauseBtn");
const volumeControl = document.getElementById("volumeControl");

fileInput.addEventListener("change", async (event) => {
  console.log("📁 File selected");
  const files = Array.from(event.target.files).filter(f => f.type.startsWith('audio/'));
  playlist = [];

  for (const file of files) {
    await new Promise((resolve) => {
      jsmediatags.read(file, {
        onSuccess: (tag) => {
          const tags = tag.tags;
          const trackNum = parseInt((tags.track || "").toString().split("/")[0]) || 0;
          playlist.push({
            file,
            trackNum,
            title: tags.title || file.name,
            artist: tags.artist || "Unknown Artist",
            album: tags.album || "Unknown Album",
            picture: tags.picture || null
          });
          resolve();
        },
        onError: () => {
          playlist.push({
            file,
            trackNum: 0,
            title: file.name,
            artist: "Unknown Artist",
            album: "Unknown Album",
            picture: null
          });
          resolve();
        }
      });
    });
  }

  playlist.sort((a, b) => a.trackNum - b.trackNum || a.title.localeCompare(b.title));
  console.log("🎶 Playlist ready:", playlist.map(t => t.title));
  currentTrack = 0;
  loadTrack(currentTrack);
});

function loadTrack(index) {
  if (!playlist[index]) return;
  loading = true;
  const { file, title, artist, picture } = playlist[index];
  console.log("🎵 Loading track:", title);

  trackInfo.textContent = `${artist} - ${title}`;

  if (picture) {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(picture.data)));
    const imgUrl = `data:${picture.format};base64,${base64}`;
    albumArt.src = imgUrl;
    albumArt.style.display = "block";
  } else {
    albumArt.style.display = "none";
  }

  const objectURL = URL.createObjectURL(file);
  if (audioPlayer) audioPlayer.unload();

  audioPlayer = new Howl({
    src: [objectURL],
    html5: true,
    volume: volumeControl.value / 100,
    onend: () => {
      currentTrack = (currentTrack + 1) % playlist.length;
      loadTrack(currentTrack);
    }
  });

  audioPlayer.play();
  loading = false;
}

playPauseBtn.addEventListener("click", () => {
  if (!audioPlayer) return;
  if (audioPlayer.playing()) {
    audioPlayer.pause();
  } else {
    audioPlayer.play();
  }
});

document.getElementById("next").addEventListener("click", () => {
  if (playlist.length > 0) {
    currentTrack = (currentTrack + 1) % playlist.length;
    loadTrack(currentTrack);
  }
});

document.getElementById("prev").addEventListener("click", () => {
  if (playlist.length > 0) {
    currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrack);
  }
});

document.getElementById("rewind").addEventListener("click", () => {
  if (audioPlayer) {
    let time = audioPlayer.seek();
    audioPlayer.seek(Math.max(0, time - 10));
  }
});

document.getElementById("forward").addEventListener("click", () => {
  if (audioPlayer) {
    let time = audioPlayer.seek();
    audioPlayer.seek(Math.min(audioPlayer.duration(), time + 10));
  }
});

volumeControl.addEventListener("input", () => {
  if (audioPlayer) {
    audioPlayer.volume(volumeControl.value / 100);
  }
});
