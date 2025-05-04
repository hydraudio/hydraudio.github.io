// Global Variables
let playlist = [], currentTrack = 0;
let audio = document.getElementById('audio');
let trackInfo = document.getElementById('track-info');
let yandhiVideo = null;
let audioCtx, analyser, source;

// WebGL Renderer and Disc setup
const canvas = document.getElementById('discCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(300, 300);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000);
camera.position.z = 2;
const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
scene.add(disc);
const light = new THREE.PointLight(0xffffff, 1);
light.position.set(2, 2, 2);
scene.add(light);

// Initialize Audio Context
function initializeAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
  }
  audioCtx.resume();
}

// Disc rotation animation (when playing audio)
function animateDisc() {
  requestAnimationFrame(animateDisc);
  if (!audio.paused && audio.src) {
    disc.rotation.z += 0.01; // Rotate disc when audio is playing
  }
  renderer.render(scene, camera);
}
animateDisc();

// Handle File Input and Read Tracks
document.getElementById('fileInput').addEventListener('change', (event) => {
  const files = Array.from(event.target.files).filter(f => f.type.startsWith('audio/'));
  playlist = [];

  // Read metadata from each file
  files.forEach((file) => {
    window.jsmediatags.read(file, {
      onSuccess: (tag) => {
        playlist.push({
          file,
          artist: tag.tags.artist || 'Unknown Artist',
          title: tag.tags.title || 'Untitled',
          album: tag.tags.album || 'Unknown Album',
          picture: tag.tags.picture || null
        });
      },
      onError: () => {
        playlist.push({ file, artist: 'Unknown Artist', title: file.name });
      }
    });
  });

  // Sort tracks by name (or track number if available)
  playlist.sort((a, b) => a.title.localeCompare(b.title));

  currentTrack = 0;
  if (playlist.length > 0) {
    loadTrack(currentTrack);  // Load the first track
  }
});

// Function to load the track
function loadTrack(index) {
  if (!playlist[index]) return;

  const { file, artist, title, album, picture } = playlist[index];
  trackInfo.textContent = `${artist} - ${title}`;

  const url = URL.createObjectURL(file);
  audio.src = url;
  audio.load();

  // Handle Yandhi mode and album cover
  if (album.toLowerCase().includes('yandhi')) {
    enableYandhiMode();
  } else {
    disableYandhiMode();
    loadAlbumCover(picture, artist, title);
  }

  audio.play().catch((err) => console.error('Playback failed', err));
  initializeAudioContext();
}

// Enable Yandhi Mode (with video texture)
function enableYandhiMode() {
  if (!yandhiVideo) {
    yandhiVideo = document.createElement('video');
    yandhiVideo.src = 'images/yandhi.webm';
    yandhiVideo.loop = true;
    yandhiVideo.muted = true;
    yandhiVideo.playsInline = true;
    yandhiVideo.autoplay = true;

    yandhiVideo.play();

    const videoTexture = new THREE.VideoTexture(yandhiVideo);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBFormat;
    disc.material.map = videoTexture;
    disc.material.needsUpdate = true;
  } else {
    yandhiVideo.play();
  }
}

// Disable Yandhi Mode (stop video)
function disableYandhiMode() {
  if (yandhiVideo) {
    yandhiVideo.pause();
    yandhiVideo = null;
  }
}

// Load album cover from ID3 or fallback
function loadAlbumCover(picture, artist, title) {
  if (picture) {
    const { data, format } = picture;
    const base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
    const imgURL = `data:${format};base64,${base64}`;
    new THREE.TextureLoader().load(imgURL, tex => {
      disc.material.map = tex;
      disc.material.needsUpdate = true;
    });
  } else {
    const query = encodeURIComponent(`${artist} ${title} album cover`);
    const fallback = `https://source.bing.com/images/search?q=${query}&FORM=HDRSC2&first=1`;
    new THREE.TextureLoader().load(fallback, tex => {
      disc.material.map = tex;
      disc.material.needsUpdate = true;
    });
  }
}

// Control Buttons (Play, Pause, Next, Previous, etc.)
document.getElementById('play').addEventListener('click', () => {
  if (audio.paused) {
    initializeAudioContext();
    audio.play();
  } else {
    audio.pause();
    disc.rotation.z = 0; // Stop spinning
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

// Frequency Visualizer for Audio
const visualCanvas = document.createElement('canvas');
visualCanvas.width = 600;
visualCanvas.height = 60;
visualCanvas.style.marginTop = '2rem';
document.getElementById('container').appendChild(visualCanvas);
const vCtx = visualCanvas.getContext('2d');

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);
  if (!audioCtx) return;
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
