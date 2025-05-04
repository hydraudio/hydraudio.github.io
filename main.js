// Create a playlist and track control variables
let playlist = [], currentTrack = 0;
let trackInfo = document.getElementById('track-info');
let audioPlayer = null;

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

// Function to load a track and update track information
function loadTrack(index) {
  if (!playlist[index]) return;

  const { file, name } = playlist[index];
  trackInfo.textContent = `Playing: ${name}`;

  const url = URL.createObjectURL(file);

  // Create a new Howl instance for the audio file
  audioPlayer = new Howl({
    src: [url],
    html5: true,  // Enable HTML5 audio for larger files
    onend: () => {
      currentTrack = (currentTrack + 1) % playlist.length;
      loadTrack(currentTrack); // Automatically play next track
    },
    onplayerror: () => {
      console.error('Error playing audio');
    }
  });

  // Play the track
  audioPlayer.play();
}

// Play/Pause button functionality
document.getElementById('play').addEventListener('click', () => {
  if (audioPlayer) {
    if (audioPlayer.playing()) {
      audioPlayer.pause();
    } else {
      audioPlayer.play();
    }
  }
});

// Next button functionality
document.getElementById('next').addEventListener('click', () => {
  if (playlist.length > 0) {
    currentTrack = (currentTrack + 1) % playlist.length;
    loadTrack(currentTrack);
  }
});

// Previous button functionality
document.getElementById('prev').addEventListener('click', () => {
  if (playlist.length > 0) {
    currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrack);
  }
});

// Rewind 10 seconds functionality
document.getElementById('rewind').addEventListener('click', () => {
  if (audioPlayer) {
    let currentTime = audioPlayer.seek();
    audioPlayer.seek(Math.max(currentTime - 10, 0)); // Rewind by 10 seconds
  }
});

// Forward 10 seconds functionality
document.getElementById('forward').addEventListener('click', () => {
  if (audioPlayer) {
    let currentTime = audioPlayer.seek();
    audioPlayer.seek(Math.min(currentTime + 10, audioPlayer.duration())); // Forward by 10 seconds
  }
});
