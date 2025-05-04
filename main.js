// Initialize necessary variables
let playlist = [];
let currentTrack = 0;
let audioPlayer = null;
let loading = false;
let volumeControl = document.getElementById('volumeControl');

// File input event listener
document.getElementById('fileInput').addEventListener('change', (event) => {
    const files = Array.from(event.target.files).filter(f => f.type.startsWith('audio/'));
    playlist = [];

    files.forEach((file) => {
        // Read ID3 tags for audio files
        window.jsmediatags.read(file, {
            onSuccess: (tag) => {
                const trackNum = parseInt((tag.tags.track || '').toString().split('/')[0]) || 0;
                playlist.push({
                    file,
                    trackNum,
                    artist: tag.tags.artist || 'Unknown Artist',
                    title: tag.tags.title || 'Unknown Title',
                    album: tag.tags.album || 'Unknown Album',
                    picture: tag.tags.picture || null
                });
            },
            onError: () => {
                playlist.push({ file, trackNum: 0, artist: 'Unknown Artist', title: file.name });
            }
        });
    });

    // Sort playlist by track number or filename if track number is missing
    playlist.sort((a, b) => a.trackNum - b.trackNum || a.file.name.localeCompare(b.file.name));
    loadTrack(currentTrack);
});

// Function to load track
function loadTrack(index) {
    if (loading || !playlist[index]) return;
    loading = true;

    const { file, artist, title, album, picture } = playlist[index];

    // Display track info
    document.getElementById('track-info').textContent = `${artist} - ${title}`;

    // Show album art if available in ID3 tags
    if (picture) {
        const base64 = btoa(String.fromCharCode(...new Uint8Array(picture.data)));
        const imgURL = `data:${picture.format};base64,${base64}`;
        document.getElementById('albumArt').src = imgURL;
        document.getElementById('albumArt').style.display = 'block';
    } else {
        document.getElementById('albumArt').style.display = 'none';
    }

    // Create a URL for the audio file and load it into the player
    const url = URL.createObjectURL(file);

    // If there's a previous player, unload it
    if (audioPlayer) {
        audioPlayer.unload();
    }

    // Initialize new audio player with Howler.js
    audioPlayer = new Howl({
        src: [url],
        html5: true,
        onend: () => {
            currentTrack = (currentTrack + 1) % playlist.length;
            loadTrack(currentTrack);
        }
    });

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

// Rewind button functionality
document.getElementById('rewind').addEventListener('click', () => {
    if (audioPlayer) {
        let currentTime = audioPlayer.seek();
        audioPlayer.seek(Math.max(currentTime - 10, 0));
    }
});

// Forward button functionality
document.getElementById('forward').addEventListener('click', () => {
    if (audioPlayer) {
        let currentTime = audioPlayer.seek();
        audioPlayer.seek(Math.min(currentTime + 10, audioPlayer.duration()));
    }
});

// Volume control functionality
volumeControl.addEventListener('input', () => {
    if (audioPlayer) {
        audioPlayer.volume(volumeControl.value / 100);
    }
});
