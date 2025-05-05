document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM fully loaded");

  const fileInput = document.getElementById("fileInput");
  const albumArt = document.getElementById("albumArt");
  const trackInfo = document.getElementById("trackInfo");
  const playPauseBtn = document.getElementById("playPause");
  const volumeControl = document.getElementById("volumeControl");
  const controls = document.getElementById("controls");
  const title = document.getElementById("title");

  let playlist = [];
  let currentTrack = 0;
  let audioPlayer = null;
  let hasAnimated = false;

  fileInput.addEventListener("change", async (event) => {
    console.log("📁 File selected");
    const files = Array.from(event.target.files).filter(f => f.type.startsWith("audio/"));
    playlist = [];

    for (let file of files) {
      await new Promise(resolve => {
        window.jsmediatags.read(file, {
          onSuccess: tag => {
            const trackNum = parseInt((tag.tags.track || '').split('/')[0]) || 0;
            playlist.push({
              file,
              name: file.name,
              artist: tag.tags.artist || "UNKNOWN ARTIST",
              title: tag.tags.title || file.name,
              album: tag.tags.album || "",
              trackNum,
              picture: tag.tags.picture || null
            });
            resolve();
          },
          onError: () => {
            playlist.push({
              file,
              name: file.name,
              artist: "UNKNOWN ARTIST",
              title: file.name,
              album: "",
              trackNum: 0,
              picture: null
            });
            resolve();
          }
        });
      });
    }

    playlist.sort((a, b) => a.trackNum - b.trackNum || a.name.localeCompare(b.name));
    console.log("🎶 Playlist ready:", playlist.map(p => p.title));
    loadTrack(currentTrack);
  });

  function loadTrack(index) {
    const track = playlist[index];
    if (!track) return;

    console.log("🎵 Loading track:", track.title);
    trackInfo.textContent = `${track.artist.toUpperCase()} - ${track.title.toUpperCase()}`;

    if (track.picture) {
      const base64 = btoa(String.fromCharCode(...new Uint8Array(track.picture.data)));
      const src = `data:${track.picture.format};base64,${base64}`;
      albumArt.src = src;
      albumArt.style.display = "block";
    } else {
      albumArt.style.display = "none";
    }

    if (audioPlayer) audioPlayer.unload();
    const url = URL.createObjectURL(track.file);
    audioPlayer = new Howl({
      src: [url],
      html5: true,
      onend: () => {
        currentTrack = (currentTrack + 1) % playlist.length;
        loadTrack(currentTrack);
      }
    });

    if (!hasAnimated) {
      hasAnimated = true;
      title.classList.add("animate-up");
      controls.classList.remove("hidden");
    }

    audioPlayer.play();
  }

  playPauseBtn.addEventListener("click", () => {
    if (audioPlayer) {
      if (audioPlayer.playing()) {
        audioPlayer.pause();
      } else {
        audioPlayer.play();
      }
    }
  });

  document.getElementById("next").addEventListener("click", () => {
    currentTrack = (currentTrack + 1) % playlist.length;
    loadTrack(currentTrack);
  });

  document.getElementById("prev").addEventListener("click", () => {
    currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrack);
  });

  document.getElementById("rewind").addEventListener("click", () => {
    if (audioPlayer) {
      audioPlayer.seek(Math.max(audioPlayer.seek() - 10, 0));
    }
  });

  document.getElementById("forward").addEventListener("click", () => {
    if (audioPlayer) {
      audioPlayer.seek(Math.min(audioPlayer.seek() + 10, audioPlayer.duration()));
    }
  });

  volumeControl.addEventListener("input", () => {
    if (audioPlayer) {
      audioPlayer.volume(volumeControl.value / 100);
    }
  });
});
