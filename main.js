let playlist = [], currentTrack = 0;
let audioPlayer = null;
let trackInfo = document.getElementById('track-info');
let albumArt = document.getElementById('albumArt'); // Album art image
let volumeControl = document.getElementById('volumeControl'); // Volume slider
let loading = false;

// Handle file input and create a playlist
document.getElementById('fileInput').addEventListener('change', (event) => {
  const files = Array.from(event.target.files).filter(f => f.type.startsWith('audio/'));
  playlist = [];

  // Read ID3 tags and create a playlist array
  files.forEach((file) => {
    window.jsmediatags.read(file, {
      onSuccess: (tag) => {
        const trackNum = parseInt((tag.tags.track || '').toString().split('/')[0]) || 0; // Track number from ID3
        playlist.push({
          file,
          trackNum,
          name: file.name,
          artist: tag.tags.artist || 'Unknown Artist',
          title: tag.tags.title || 'Unknown Title',
          album: tag.tags.album || 'Unknown Album',
          picture: tag.tags.picture || null
        });
      },
      onError: (error) => {
        console.error('Error reading ID3 tags', error);
        playlist.push({ file, trackNum: 0, name: file.name }); // No metadata, fallback to filename
      }
    });
  });

  // Sort playlist first by track number, then by filename
  playlist.sort((a, b) => a.trackNum - b.trackNum || a.name.localeCompare(b.name));
  currentTrack = 0;

  if (playlist.length > 0) loadTrack(currentTrack); // Automatically load the first track
});

// Function to load and play a track
function loadTrack(index) {
  if (loading || !playlist[index]) return;
  loading = true;

  const { file, artist, title, album, picture } = playlist[index];
  
  // Set track info
  trackInfo.textContent = `${artist} - ${title}`;

  // Display album art if available
  if (picture) {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(picture.data)));
    const imgURL = `data:${picture.format};base64,${base64}`;
    albumArt.src = imgURL;
    albumArt.style.display = 'block'; // Show album art
  } else {
    albumArt.style.display = 'none'; // Hide if no album art
  }

  // Create URL for the file and load it
  const url = URL.createObjectURL(file);
  audio.src = url;
  audio.load();

  // Create a new Howl instance for the audio file (Howler.js)
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
  loading = false;
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
    currentTrack = (currentTrack + 1) % playlist.length; // Loop back to start
    loadTrack(currentTrack);
  }
});

// Previous button functionality
document.getElementById('prev').addEventListener('click', () => {
  if (playlist.length > 0) {
    currentTrack = (currentTrack - 1 + playlist.length) % playlist.length; // Loop backwards
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

// Volume control functionality
volumeControl.addEventListener('input', () => {
  if (audioPlayer) {
    audioPlayer.volume(volumeControl.value / 100); // Volume is between 0 and 1, slider is 0 to 100
  }
});

// When the track ends, automatically go to the next one
audio.addEventListener('ended', () => {
  if (playlist.length > 0) {
    currentTrack = (currentTrack + 1) % playlist.length;
    loadTrack(currentTrack);
  }
});

// Handle album art spinning (using CSS transform)
function animateAlbumArt() {
  if (albumArt && audioPlayer && audioPlayer.playing()) {
    albumArt.style.transform = `rotate(${(audioPlayer.seek() * 10) % 360}deg)`; // Rotates based on the track's progress
  }
  requestAnimationFrame(animateAlbumArt);
}

// Start the spinning animation
animateAlbumArt();
