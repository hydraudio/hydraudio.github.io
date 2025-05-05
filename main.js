import { Howl } from 'https://cdn.jsdelivr.net/npm/howler@2.2.3/+esm';
import jsmediatags from 'https://cdn.jsdelivr.net/npm/jsmediatags@3.9.7/+esm';

console.log("✅ DOM fully loaded");

const fileInput = document.getElementById('fileInput');
const albumArtElement = document.getElementById('albumArt');
const trackInfo = document.getElementById('trackInfo');
const playPauseBtn = document.getElementById('playPauseBtn');
const volumeControl = document.getElementById('volumeControl');

let playlist = [];
let currentTrack = 0;
let audioPlayer = null;

// File selection handler
fileInput.addEventListener('change', () => {
  console.log("📁 File selected");
  const files = Array.from(fileInput.files).filter(f => f.type.startsWith('audio/'));
  playlist = [];

  let pending = files.length;

  files.forEach((file, i) => {
    jsmediatags.read(file, {
      onSuccess: tag => {
        const tags = tag.tags;
        const trackNum = parseInt((tags.track || '').split('/')[0]) || i;
        playlist.push({
          file,
          trackNum,
          artist: tags.artist || 'Unknown Artist',
          title: tags.title || file.name,
          album: tags.album || '',
          picture: tags.picture || null
        });

        if (--pending === 0) {
          playlist.sort((a, b) => a.trackNum - b.trackNum || a.file.name.localeCompare(b.file.name));
          console.log("🎶 Playlist ready: ", playlist.map(t => t.title));
          loadTrack(currentTrack);
        }
      },
      onError: () => {
        playlist.push({
          file,
          trackNum: i,
          artist: 'Unknown Artist',
          title: file.name,
          album: '',
          picture: null
        });

        if (--pending === 0) {
          playlist.sort((a, b) => a.trackNum - b.trackNum || a.file.name.localeCompare(b.file.name));
          console.log("🎶 Playlist ready: ", playlist.map(t => t.title));
          loadTrack(currentTrack);
        }
      }
    });
  });
});

function loadTrack(index) {
  if (!playlist[index]) return;

  const { file, title, artist, picture } = playlist[index];
  console.log("🎵 Loading track:", title);

  trackInfo.textContent = `${artist} - ${title}`;

  if (picture) {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(picture.data)));
    const mime = picture.format || 'image/jpeg';
    albumArtElement.src = `data:${mime};base64,${base64}`;
    albumArtElement.style.display = 'block';
  } else {
    albumArtElement.style.display = 'none';
  }

  const url = URL.createObjectURL(file);

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

// Controls
playPauseBtn.addEventListener('click', () => {
  if (!audioPlayer) return;
  audioPlayer.playing() ? audioPlayer.pause() : audioPlayer.play();
});

volumeControl.addEventListener('input', () => {
  if (audioPlayer) {
    audioPlayer.volume(volumeControl.value / 100);
  }
});
