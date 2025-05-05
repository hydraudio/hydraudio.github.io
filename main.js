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
      audioPlayer.pause();
    } else {
      audioPlayer.play();
    }
  }
});

document.getElementById('next').addEventListener('click', () => {
  if (playlist.length > 0) {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadAndPlayTrack(currentTrackIndex);
  }
});

document.getElementById('prev').addEventListener('click', () => {
  if (playlist.length > 0) {
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadAndPlayTrack(currentTrackIndex);
  }
});

document.getElementById('rewind').addEventListener('click', () => {
  if (audioPlayer) {
    const newTime = Math.max(audioPlayer.seek() - 10, 0);
    audioPlayer.seek(newTime);
  }
});

document.getElementById('forward').addEventListener('click', () => {
  if (audioPlayer) {
    const newTime = Math.min(audioPlayer.seek() + 10, audioPlayer.duration());
    audioPlayer.seek(newTime);
  }
});

volumeControl.addEventListener('input', () => {
  if (audioPlayer) {
    audioPlayer.volume(volumeControl.value / 100);
  }
});

fileInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files).filter(f => f.type.startsWith('audio/'));
  const results = [];

  for (const file of files) {
    const tags = await readID3(file);
    results.push({
      file,
      ...tags
    });
  }

  playlist = results.sort((a, b) => a.trackNum - b.trackNum || a.file.name.localeCompare(b.file.name));
  currentTrackIndex = 0;
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
    onend: () => {
      currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
      loadAndPlayTrack(currentTrackIndex);
    }
  });

  audioPlayer.play();
}
