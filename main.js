<input type="file" id="fileInput" multiple />
<img id="albumArt" style="width: 150px; height: 150px;" />
<div id="trackInfo"></div>
<button id="playPauseBtn">Play/Pause</button>
<input type="range" id="volumeControl" min="0" max="100" value="100" />

<script type="module">
  import * as id3 from 'https://unpkg.com/id3js@^2/lib/id3.js';
  import { Howl } from 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/howler.min.js';

  const fileInput = document.getElementById('fileInput');
  const albumArtElement = document.getElementById('albumArt');
  const trackInfo = document.getElementById('trackInfo');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const volumeControl = document.getElementById('volumeControl');

  let audioPlayer = null;
  let currentTrack = 0;
  let playlist = [];

  fileInput.addEventListener('change', async (event) => {
    const files = Array.from(event.target.files).filter(f => f.type.startsWith('audio/'));
    playlist = await Promise.all(files.map(file => {
      return new Promise((resolve) => {
        id3.fromFile(file).then(tags => {
          const trackNum = parseInt(tags.track || '0');
          resolve({ file, trackNum, tags });
        });
      });
    }));

    playlist.sort((a, b) => a.trackNum - b.trackNum);

    loadTrack(currentTrack);
  });

  function loadTrack(index) {
    if (!playlist[index]) return;

    const { file, tags } = playlist[index];
    const url = URL.createObjectURL(file);

    trackInfo.textContent = `${tags.artist || 'Unknown Artist'} - ${tags.title || 'Unknown Title'}`;

    if (tags.images && tags.images.length > 0) {
      const imageData = tags.images[0].data;
      const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageData)));
      albumArtElement.src = `data:${tags.images[0].mime};base64,${base64Image}`;
      albumArtElement.style.display = 'block';
    } else {
      albumArtElement.style.display = 'none';
    }

    if (audioPlayer) {
      audioPlayer.unload();
    }

    audioPlayer = new Howl({
      src: [url],
      html5: true,
      onend: () => {
        currentTrack = (currentTrack + 1) % playlist.length;
        loadTrack(currentTrack);
      }
    });

    audioPlayer.play();
  }

  playPauseBtn.addEventListener('click', () => {
    if (audioPlayer.playing()) {
      audioPlayer.pause();
    } else {
      audioPlayer.play();
    }
  });

  volumeControl.addEventListener('input', () => {
    if (audioPlayer) {
      audioPlayer.volume(volumeControl.value / 100);
    }
  });
</script>
