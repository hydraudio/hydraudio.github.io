// Global variables and flags
let playlist = [], current = 0;
let audioCtx, source, analyser;
let yandhiVideo = null;
let initialized = false;
let loading = false;
const audio = document.getElementById('audio');
const trackInfo = document.getElementById('track-info');
const disc = new THREE.Mesh(
  new THREE.CircleGeometry(1, 64),
  new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide })
);

// Setup WebGL renderer and 3D scene
const canvas = document.getElementById('discCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(300, 300);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000);
camera.position.z = 2;

scene.add(disc);
const light = new THREE.PointLight(0xffffff, 1);
light.position.set(2, 2, 2);
scene.add(light);

// Audio playback functionality
function resumeAudio() {
  if (!initialized) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    source = audioCtx.createMediaElementSource(audio);
    analyser = audioCtx.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    initialized = true;
  }
  audioCtx.resume();
}

function loadTrack(index) {
  // Prevent recursive loading
  if (loading || !playlist[index]) return;
  loading = true;

  const entry = playlist[index];
  const { file, artist, title, album, picture } = entry;
  trackInfo.textContent = `${artist || 'Unknown Artist'} - ${title || file.name}`;

  const url = URL.createObjectURL(file);
  audio.src = url;
  audio.load();
  
  audio.onloadeddata = () => {
    loading = false;
  };

  audio.play().catch(() => {});
  resumeAudio();

  // Handle Yandhi mode with video texture
  if (album.toLowerCase().includes("yandhi")) {
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
  } else {
    if (yandhiVideo) {
      yandhiVideo.pause();
      yandhiVideo = null;
    }
    
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
}

// Track input handling
document.getElementById('fileInput').addEventListener('change', async (event) => {
  const files = Array.from(event.target.files).filter(f => f.type.startsWith('audio/'));
  playlist = [];

  for (let file of files) {
    await new Promise(resolve => {
      window.jsmediatags.read(file, {
        onSuccess: tag => {
          const trackNum = parseInt((tag.tags.track || '').toString().split('/')[0]) || 0;
          playlist.push({
            file,
            trackNum,
            name: file.name,
            artist: tag.tags.artist || '',
            title: tag.tags.title || '',
            album: tag.tags.album || '',
            picture: tag.tags.picture || null
          });
          resolve();
        },
        onError: () => {
          playlist.push({ file, trackNum: 0, name: file.name });
          resolve();
        }
      });
    });
  }

  playlist.sort((a, b) => a.trackNum - b.trackNum || a.name.localeCompare(b.name));
  current = 0;

  // Delay track loading to ensure the playlist is populated
  if (playlist.length > 0) {
    setTimeout(() => loadTrack(current), 100);
  }
});

// Control buttons functionality
document.getElementById('play').addEventListener('click', () => {
  if (!audio.src && playlist.length > 0) {
    loadTrack(current);
  } else if (audio.paused) {
    resumeAudio();
    audio.play();
  } else {
    audio.pause();
    disc.rotation.z = 0; // Reset rotation if paused
  }
});

document.getElementById('next').addEventListener('click', () => {
  if (playlist.length > 0) {
    current = (current + 1) % playlist.length;
    loadTrack(current);
  }
});

document.getElementById('prev').addEventListener('click', () => {
  if (playlist.length > 0) {
    current = (current - 1 + playlist.length) % playlist.length;
    loadTrack(current);
  }
});

document.getElementById('rewind').addEventListener('click', () => {
  audio.currentTime = Math.max(audio.currentTime - 10, 0);
});

document.getElementById('forward').addEventListener('click', () => {
  audio.currentTime = Math.min(audio.currentTime + 10, audio.duration);
});

audio.addEventListener('ended', () => {
  if (playlist.length > 0) {
    current = (current + 1) % playlist.length;
    loadTrack(current);
  }
});

// Frequency visualizer setup
const visualCanvas = document.createElement('canvas');
visualCanvas.width = 600;
visualCanvas.height = 60;
visualCanvas.style.marginTop = '2rem';
document.getElementById('container').appendChild(visualCanvas);
const vCtx = visualCanvas.getContext('2d');

function drawViz() {
  requestAnimationFrame(drawViz);
  if (!initialized) return;
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

drawViz();
