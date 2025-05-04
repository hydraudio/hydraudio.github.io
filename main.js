let playlist = [], currentTrack = 0;
let audio = document.getElementById('audio');
let trackInfo = document.getElementById('track-info');
let loading = false;

// Load the playlist from the selected files
document.getElementById('fileInput').addEventListener('change', (event) => {
  const files = Array.from(event.target.files).filter(f => f.type.startsWith('audio/'));
  playlist = [];

  files.forEach((file) => {
    playlist.push({
      file,
      artist: file.name.split('-')[0] || 'Unknown Artist', // Artist from the file name
      title: file.name.split('-')[1] || 'Untitled', // Title from the file name
    });
  });

  playlist.sort((a, b) => a.title.localeCompare(b.title));
  currentTrack = 0;
  if (playlist.length > 0) loadTrack(currentTrack);
});

// Load track and handle track info
function loadTrack(index) {
  if (loading || !playlist[index]) return;
  loading = true;

  const { file, artist, title } = playlist[index];
  trackInfo.textContent = `${artist} - ${title}`;

  const url = URL.createObjectURL(file);
  audio.src = url;
  audio.load();
  audio.play().catch(err => console.error('Error playing audio', err));

  loading = false;
}

// Audio control buttons
document.getElementById('play').addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
});

document.getElementById('next').addEventListener('click', () => {
  if (playlist.length > 0) {
    currentTrack = (currentTrack + 1) % playlist.length;
    loadTrack(currentTrack);
  }
});

document.getElementById('prev').addEventListener('click', () => {
  if (playlist.length > 0) {
    currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrack);
  }
});

document.getElementById('rewind').addEventListener('click', () => {
  audio.currentTime = Math.max(audio.currentTime - 10, 0);
});

document.getElementById('forward').addEventListener('click', () => {
  audio.currentTime = Math.min(audio.currentTime + 10, audio.duration);
});

// When track ends, load the next track
audio.addEventListener('ended', () => {
  if (playlist.length > 0) {
    currentTrack = (currentTrack + 1) % playlist.length;
    loadTrack(currentTrack);
  }
});

// Simple frequency visualizer for the audio
const visualCanvas = document.createElement('canvas');
visualCanvas.width = 600;
visualCanvas.height = 60;
visualCanvas.style.marginTop = '2rem';
document.getElementById('container').appendChild(visualCanvas);
const vCtx = visualCanvas.getContext('2d');
let analyser;

function initializeAudioContext() {
  if (!analyser) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
  }
}

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);
  if (!analyser) return;
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
  vCtx.clearRect(0, 0, visualCanvas.width, visualCanvas.height);
  const barWidth = visualCanvas.width / dataArray.length;
  for (let i = 0; i < dataArray.length; i++) {
    const barHeight = dataArray[i] / 2;
    vCtx.fillStyle = `rgb(${barHeight + 100}, 0, ${255 - barHeight})`;
    vCtx.fillRect(i * barWidth, visualCanvas.height - barHeight, barWidth - 1, barHeight);
  }
}

drawVisualizer();
initializeAudioContext();
