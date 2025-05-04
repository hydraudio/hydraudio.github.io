let playlist = [], currentTrack = 0;
let audio = document.getElementById('audio');
let trackInfo = document.getElementById('track-info');
let albumArt = document.getElementById('albumArt'); // Assuming there's an image element for the album art
let loading = false;
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

// Load the track and update the track info
function loadTrack(index) {
  if (loading || !playlist[index]) return;
  loading = true;

  const { file, name } = playlist[index];

  // ID3 tag reading (using jsmediatags library)
  window.jsmediatags.read(file, {
    onSuccess: (tag) => {
      const artist = tag.tags.artist || 'Unknown Artist';
      const title = tag.tags.title || 'Unknown Title';
      const album = tag.tags.album || 'Unknown Album';
      const picture = tag.tags.picture || null;

      trackInfo.textContent = `${artist} - ${title}`;

      // Display album art (if available from ID3)
      if (picture) {
        const base64 = btoa(String.fromCharCode(...new Uint8Array(picture.data)));
        const imgURL = `data:${picture.format};base64,${base64}`;
        albumArt.src = imgURL;
        albumArt.style.display = 'block'; // Show album art
      } else {
        albumArt.style.display = 'none'; // Hide if no album art
      }
    },
    onError: (error) => {
      console.error('ID3 Error:', error);
      trackInfo.textContent = 'Error reading track info';
    }
  });

  const url = URL.createObjectURL(file);
  audio.src = url;
  audio.load();

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
  loading = false;
}

// Play/Pause button
document.getElementById('play').addEventListener('click', () => {
  // Ensure no interruption of playback
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

// Handle album art spinning
function animateAlbumArt() {
  if (albumArt && audioPlayer && audioPlayer.playing()) {
    albumArt.style.transform = `rotate(${(audioPlayer.seek() * 10) % 360}deg)`; // Rotates based on the track's progress
  }
  requestAnimationFrame(animateAlbumArt);
}

// Start the spinning animation
animateAlbumArt();

// When the track ends, automatically go to the next one
audio.addEventListener('ended', () => {
  if (playlist.length > 0) {
    currentTrack = (currentTrack + 1) % playlist.length;
    loadTrack(currentTrack);
  }
});
