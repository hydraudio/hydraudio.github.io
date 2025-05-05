let playlist = [];
let current = 0;
let player = null;

const fileInput = document.getElementById('fileInput');
const trackInfo = document.getElementById('track-info');
const albumArt = document.getElementById('albumArt');
const volumeSlider = document.getElementById('volumeControl');

fileInput.addEventListener('change', async (event) => {
  const files = Array.from(event.target.files).filter(f => f.type.startsWith('audio/'));

  playlist = [];

  for (const file of files) {
    try {
      const metadata = await musicMetadata.parseBlob(file);
      const track = parseInt(metadata.common.track.no) || 0;
      const artist = metadata.common.artist || 'Unknown Artist';
      const title = metadata.common.title || file.name;
      const album = metadata.common.album || 'Unknown Album';

      let pictureUrl = '';
      if (metadata.common.picture && metadata.common.picture[0]) {
        const byteArray = metadata.common.picture[0].data;
        const mime = metadata.common.picture[0].format;
        const base64 = btoa(String.fromCharCode(...new Uint8Array(byteArray)));
        pictureUrl = `data:${mime};base64,${base64}`;
      }

      playlist.push({ file, track, artist, title, album, pictureUrl });

    } catch (err) {
      playlist.push({ file, track: 0, artist: 'Unknown', title: file.name, album: '', pictureUrl: '' });
    }
  }

  playlist.sort((a, b) => a.track - b.track || a.title.localeCompare(b.title));
  current = 0;
  loadTrack(current);
});

function loadTrack(index) {
  if (!playlist[index]) return;
  const { file, artist, title, pictureUrl } = playlist[index];

  trackInfo.textContent = `${artist} - ${title}`;
  albumArt.src = pictureUrl || '';
  albumArt.style.display = pictureUrl ? 'block' : 'none';

  if (player) player.unload();

  const url = URL.createObjectURL(file);

  player = new Howl({
    src: [url],
    html5: true,
    volume: volumeSlider.value / 100,
    onend: () => {
      current = (current + 1) % playlist.length;
      loadTrack(current);
    }
  });

  player.play();
}

// Buttons
document.getElementById('play').addEventListener('click', () => {
  if (player?.playing()) player.pause();
  else player?.play();
});

document.getElementById('next').addEventListener('click', () => {
  current = (current + 1) % playlist.length;
  loadTrack(current);
});

document.getElementById('prev').addEventListener('click', () => {
  current = (current - 1 + playlist.length) % playlist.length;
  loadTrack(current);
});

document.getElementById('rewind').addEventListener('click', () => {
  if (player) {
    const t = player.seek();
    player.seek(Math.max(t - 10, 0));
  }
});

document.getElementById('forward').addEventListener('click', () => {
  if (player) {
    const t = player.seek();
    player.seek(Math.min(t + 10, player.duration()));
  }
});

volumeSlider.addEventListener('input', () => {
  if (player) {
    player.volume(volumeSlider.value / 100);
  }
});
