let playlist = [];
let currentTrackIndex = 0;
let audioPlayer = null;

const fileInput = document.getElementById('fileInput');
const albumArt = document.getElementById('albumArt');
const trackInfo = document.getElementById('track-info');
const volumeControl = document.getElementById('volumeControl');

// Acceptable audio types
const acceptedTypes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/aac', 'audio/x-aac', 'audio/x-m4a', 'audio/flac', 'audio/ogg'];

fileInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files).filter(file => acceptedTypes.includes(file.type));
  console.log("Files detected:", files.length);

  playlist = await Promise.all(files.map(async (file) => {
    const tags = await readID3(file);
    return { file, ...tags };
  }));

  playlist.sort((a, b) => a.trackNum - b.trackNum || a.file.name.localeCompare(b.file.name));
  currentTrackIndex = 0;

  console.log("Playlist built:", playlist.map(t => `${t.trackNum} - ${t.title}`));
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
      onError: () => {
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
  if (!track) return;

  console.log("▶ Loading:", track.title, "by", track.artist);
  trackInfo.textContent = `${track.artist} - ${track.title}`;

  if (track.picture) {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(track.picture.data)));
    albumArt.src = `data:${track.picture.format};base64,${base64}`;
    albumArt.style.display = 'block';
  } else {
    albumArt.style.display = 'none';
  }

  const url = URL.createObjectURL(track.file);

  if (audioPlayer) {
    audioPlayer.unload();
  }

  audioPlayer = new Howl({
    src: [url],
    html5: true,
    volume: volumeControl.value / 100,
    onend: () => {
      currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
      loadAndPlayTrack(currentTrackIndex);
    },
    onloaderror: (_, err) => console.error("Load error:", err),
    onplayerror: (_, err) => {
      console.error("Play error:", err);
      audioPlayer.once('unlock', () => audioPlayer.play());
    }
  });

  audioPlayer.play();
}

// Controls
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
  currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
  loadAndPlayTrack(currentTrackIndex);
});

document.getElementById('prev').addEventListener('click', () => {
  currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
  loadAndPlayTrack(currentTrackIndex);
});

document.getElementById('rewind').addEventListener('click', () => {
  if (audioPlayer) audioPlayer.seek(Math.max(audioPlayer.seek() - 10, 0));
});

document.getElementById('forward').addEventListener('click', () => {
  if (audioPlayer) audioPlayer.seek(Math.min(audioPlayer.seek() + 10, audioPlayer.duration()));
});

volumeControl.addEventListener('input', () => {
  if (audioPlayer) {
    const vol = volumeControl.value / 100;
    audioPlayer.volume(vol);
  }
});
