let playlist = [];
let currentTrackIndex = 0;
let audioPlayer = null;

// DOM elements
const fileInput = document.getElementById('fileInput');
const albumArt = document.getElementById('albumArt');
const trackInfo = document.getElementById('track-info');
const volumeControl = document.getElementById('volumeControl');

document.getElementById('play').addEventListener('click', () => {
  if (audioPlayer) {
    if (audioPlayer.playing()) {
      console.log("Pausing playback");
      audioPlayer.pause();
    } else {
      console.log("Resuming playback");
      audioPlayer.play();
    }
  } else {
    console.warn("No audio player initialized");
  }
});

document.getElementById('next').addEventListener('click', () => {
  if (playlist.length > 0) {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    console.log("Next track:", currentTrackIndex);
    loadAndPlayTrack(currentTrackIndex);
  }
});

document.getElementById('prev').addEventListener('click', () => {
  if (playlist.length > 0) {
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    console.log("Previous track:", currentTrackIndex);
    loadAndPlayTrack(currentTrackIndex);
  }
});

document.getElementById('rewind').addEventListener('click', () => {
  if (audioPlayer) {
    const newTime = Math.max(audioPlayer.seek() - 10, 0);
    console.log("Rewinding to:", newTime);
    audioPlayer.seek(newTime);
  }
});

document.getElementById('forward').addEventListener('click', () => {
  if (audioPlayer) {
    const newTime = Math.min(audioPlayer.seek() + 10, audioPlayer.duration());
    console.log("Forwarding to:", newTime);
    audioPlayer.seek(newTime);
  }
});

volumeControl.addEventListener('input', () => {
  if (audioPlayer) {
    const vol = volumeControl.value / 100;
    console.log("Setting volume to:", vol);
    audioPlayer.volume(vol);
  }
});

fileInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files).filter(f => f.type.startsWith('audio/'));
  console.log("Selected files:", files.length);
  playlist = [];

  for (const file of files) {
    const tags = await readID3(file);
    console.log("Loaded tags:", tags);
    playlist.push({ file, ...tags });
  }

  playlist.sort((a, b) => a.trackNum - b.trackNum || a.file.name.localeCompare(b.file.name));
  currentTrackIndex = 0;

  console.log("Sorted playlist:", playlist.map(t => t.title || t.file.name));
  loadAndPlayTrack(currentTrackIndex);
});

async function readID3(file) {
  return new Promise(resolve => {
    jsmediatags.read(file, {
      onSuccess: (tag) => {
        const tags = tag.tags;
        const trackNum = parseInt((tags.track || '0').toString().split('/')[0]) || 0;
        resolve({
          artist: tags.artist || 'Unknown Artist',
          title: tags.title || file.name,
          album: tags.album || '',
          trackNum,
          picture: tags.picture || null
        });
      },
      onError: (error) => {
        console.warn("Failed to read tags for:", file.name, error);
        resolve({
          artist: 'Unknown Artist',
          title: file.name,
          album: '',
          trackNum: 0,
          picture: null
        });
      }
    });
  });
}

function loadAndPlayTrack(index) {
  const track = playlist[index];
  if (!track) {
    console.warn("No track found at index:", index);
    return;
  }

  console.log("▶ Loading track:", track.title, "by", track.artist);

  trackInfo.textContent = `${track.artist} - ${track.title}`;

  if (track.picture) {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(track.picture.data)));
    albumArt.src = `data:${track.picture.format};base64,${base64}`;
    albumArt.style.display = 'block';
    console.log("Showing album art for:", track.title);
  } else {
    albumArt.style.display = 'none';
    console.log("No album art for:", track.title);
  }

  const url = URL.createObjectURL(track.file);
  console.log("Track URL:", url);

  if (audioPlayer) {
    audioPlayer.unload();
    console.log("Unloaded previous audio player");
  }

  audioPlayer = new Howl({
    src: [url],
    html5: true,
    onend: () => {
      console.log("Track ended. Moving to next.");
      currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
      loadAndPlayTrack(currentTrackIndex);
    },
    onloaderror: (id, err) => {
      console.error("Howler failed to load audio:", err);
    },
    onplayerror: (id, err) => {
      console.error("Howler failed to play audio:", err);
      audioPlayer.once('unlock', () => {
        console.log("Trying to play after unlock...");
        audioPlayer.play();
      });
    }
  });

  setTimeout(() => {
    console.log("Calling play...");
    audioPlayer.play();
  }, 100); // delay for autoplay policy safety
}
