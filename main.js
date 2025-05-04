let playlist = [], currentTrack = 0;
let audio = document.getElementById('audio');
let trackInfo = document.getElementById('track-info');

// Handle file input and create a playlist
document.getElementById('fileInput').addEventListener('change', (event) => {
  const files = Array.from(event.target.files).filter(f => f.type.startsWith('audio/'));
  playlist = [];

  files.forEach((file) => {
    playlist.push({
      file,
      name: file.name
    });
  });

  playlist.sort((a, b) => a.name.localeCompare(b.name)); // Sort tracks by name
  currentTrack = 0;

  if (playlist.length > 0) loadTrack(currentTrack); // Load the first track automatically
});

// Load the track and update the track info
function loadTrack(index) {
  if (!playlist[index]) return;

  const { file, name } = playlist[index];
  trackInfo.textContent = `Playing: ${name}`;

  const url = URL.createObjectURL(file);
  audio.src = url;
  audio.load();
  audio.play().catch(err => console.error('Error playing audio:', err));
}

// Play/Pause button
document.getElementById('play').addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
});

// Next button
document.getElementById('next').addEventListener('click', () => {
  if (playlist.length > 0) {
    currentTrack = (currentTrack + 1) % playlist.length;
    loadTrack(currentTrack);
  }
});

// Previous button
document.getElementById('prev').addEventListener('click', () => {
  if (playlist.length > 0) {
    currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrack);
  }
});

// Rewind 10 seconds
document.getElementById('rewind').addEventListener('click', () => {
  audio.currentTime = Math.max(audio.currentTime - 10, 0);
});

// Forward 10 seconds
document.getElementById('forward').addEventListener('click', () => {
  audio.currentTime = Math.min(audio.currentTime + 10, audio.duration);
});

// When the track ends, load the next one
audio.addEventListener('ended', () => {
  if (playlist.length > 0) {
    currentTrack = (currentTrack + 1) % playlist.length;
    loadTrack(currentTrack);
  }
});
