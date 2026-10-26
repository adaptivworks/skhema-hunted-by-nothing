const tracks = [
  { name: 'ONE PLACE',              display: 'ONE PLACE',              file: 'Hunted by nothing/01 One place.mp3',            duration: '1:27', ytId: 'mUEOipHmBjY', ytStart: 3, ytRate: 0.8 },
  { name: 'HUNTED BY NOTHING',      display: 'HUNTED\u2002BY\u2002\u2002\u2002NOTHING',  file: 'Hunted by nothing/02 Hunted by nothing.mp3',    duration: '3:48', ytId: 'mUEOipHmBjY', ytStart: 460 },
  { name: 'SEMANTICS',              display: 'SEMANTICS',              file: 'Hunted by nothing/03 Semantics.mp3',             duration: '2:43', ytId: 'QI2IlA3ztIo', ytStart: 179 },
  { name: 'TAD',                    display: 'TAD',                    file: 'Hunted by nothing/04 Tad.mp3',                   duration: '1:05', ytId: '4rBPgGWW0VA', ytStart: 106 },
  { name: 'THICK OF IT',            display: 'THICK\u2002OF\u2002\u2002\u2002IT',        file: 'Hunted by nothing/05 Thick Of It.mp3',           duration: '3:15', ytId: 'OacVy8_nJi0', ytStart: 7 },
  { name: 'HOLDING THE LINE',       display: 'HOLDING\u2002THE\u2002\u2002\u2002LINE',   file: 'Hunted by nothing/06 Holding the line.mp3',      duration: '2:10', ytId: '4rBPgGWW0VA', ytStart: 12 },
];

const audio = document.getElementById('audio');
const barFill = document.querySelector('.player__bar-fill');
const bar = document.querySelector('.player__bar');
const trackEls = document.querySelectorAll('.player__track');
const cursor = document.querySelector('.player__cursor');
const bgVideo = document.querySelector('.player__bg-video');
const toggleYtBtn = document.querySelector('.player__toggle-youtube');
const playerContainer = document.querySelector('.player');

let currentIndex = -1; // no track selected on load
let isPlaying = false;
let isYtActive = false; // YouTube toggle state
let hoveredIndex = -1;

let ytPlayer;

// The YouTube API looks for this globally named function
window.onYouTubeIframeAPIReady = function() {
  // We don't load a video initially until a button is clicked
  ytPlayer = new YT.Player('yt-bg-player', {
    playerVars: {
      autoplay: 0,
      controls: 0,
      showinfo: 0,
      modestbranding: 1,
      loop: 1,
      fs: 0,
      autohide: 0
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  });
};

function onPlayerReady(event) {
  event.target.mute();
  // We can set playback rate here if desired
  // event.target.setPlaybackRate(0.5); 
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    ytPlayer.playVideo();
  }
  if (event.data === YT.PlayerState.PLAYING && currentIndex !== -1) {
    const rate = tracks[currentIndex].ytRate || 1.0;
    event.target.setPlaybackRate(rate);
  }
}

// Toggle logic (Master Switch)
if (toggleYtBtn) {
  toggleYtBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // prevent play/pause toggle from firing
    isYtActive = !isYtActive;

    if (isYtActive) {
      playerContainer.classList.add('player--youtube-active');
      if (bgVideo) bgVideo.pause();
      
      // If a track is already selected, load its specific video
      if (currentIndex !== -1 && ytPlayer && ytPlayer.loadVideoById) {
        const t = tracks[currentIndex];
        ytPlayer.loadVideoById({
          videoId: t.ytId,
          startSeconds: t.ytStart
        });
        if (isPlaying) {
          ytPlayer.playVideo();
        }
      }
    } else {
      playerContainer.classList.remove('player--youtube-active');
      if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo();
      // If audio is playing, resume local video
      if (isPlaying && bgVideo) {
         bgVideo.play();
      }
    }
  });
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*_`"\'.:;/\\|';
const SCRAMBLE_INTERVAL = 94; // ms between scramble ticks (further 30% slower)
let scrambleTimer = null;

function scrambleTick() {
  trackEls.forEach((el, i) => {
    if (i === currentIndex || i === hoveredIndex) return; // skip active and hovered track
    const nameEl = el.querySelector('.player__track-name');
    const original = tracks[i].display;
    let scrambled = '';
    for (let c = 0; c < original.length; c++) {
      const ch = original[c];
      if (ch === ' ' || ch === '\u2002') {
        scrambled += ch; // preserve spaces
      } else {
        scrambled += CHARS[Math.floor(Math.random() * CHARS.length)];
      }
    }
    nameEl.textContent = scrambled;
  });
}

function startScramble() {
  if (scrambleTimer) return;
  scrambleTimer = setInterval(scrambleTick, SCRAMBLE_INTERVAL);
  scrambleTick(); // immediate first tick
}

function stopScramble() {
  if (scrambleTimer) {
    clearInterval(scrambleTimer);
    scrambleTimer = null;
  }
  // Restore all track names to their real display text
  trackEls.forEach((el, i) => {
    el.querySelector('.player__track-name').textContent = tracks[i].display;
  });
}

// Lock tracklist width to prevent layout jiggle during scramble
const tracklist = document.querySelector('.player__tracklist');
if (tracklist) {
  tracklist.style.width = tracklist.offsetWidth + 'px';
}

// Start scramble on load
startScramble();

function loadTrack(index) {
  currentIndex = index;
  audio.src = tracks[index].file;
  updateActiveTrack();
  
  // Sync YouTube Video
  if (isYtActive && ytPlayer && ytPlayer.loadVideoById) {
    const t = tracks[index];
    ytPlayer.loadVideoById({
      videoId: t.ytId,
      startSeconds: t.ytStart
    });
    // It will be played by the `play()` function which follows shortly after `loadTrack()`
  }
}

function updateActiveTrack() {
  trackEls.forEach((el, i) => {
    const isActive = i === currentIndex;
    el.classList.toggle('player__track--active', isActive);
    
    const marker = el.querySelector('.player__track-marker');
    if (marker) {
      marker.textContent = isActive ? '+' : '';
    }
    
    // Restore active track's real name immediately
    if (isActive) {
      el.querySelector('.player__track-name').textContent = tracks[i].display;
    } else {
      // If inactive, ensure its duration is reset to the static original value
      const durationEl = el.querySelector('.player__track-duration');
      if (durationEl) {
        durationEl.textContent = tracks[i].duration;
      }
    }
  });
}

function play() {
  audio.play();
  isPlaying = true;
  if (!isYtActive && bgVideo) {
      bgVideo.play();
  } else if (isYtActive && ytPlayer && ytPlayer.playVideo) {
      ytPlayer.playVideo();
  }
  updateCursorState();
}

function pause() {
  audio.pause();
  isPlaying = false;
  if (bgVideo) bgVideo.pause();
  if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo();
  updateCursorState();
}

function togglePlay() {
  if (isPlaying) {
    pause();
  } else {
    play();
  }
}

// Custom cursor
function updateCursorState() {
  if (!cursor) return;
  if (isPlaying) {
    cursor.classList.remove('player__cursor--paused');
  } else {
    cursor.classList.add('player__cursor--paused');
  }
}

document.addEventListener('mousemove', (e) => {
  if (!cursor) return;
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});

// Hide custom cursor when hovering track titles, show default arrow, reveal track name
trackEls.forEach((el) => {
  el.addEventListener('mouseenter', () => {
    if (cursor) cursor.classList.add('player__cursor--hidden');
    document.body.classList.add('cursor-default');
    const idx = parseInt(el.dataset.index, 10);
    hoveredIndex = idx;
    el.querySelector('.player__track-name').textContent = tracks[idx].display;
  });
  el.addEventListener('mouseleave', () => {
    if (cursor) cursor.classList.remove('player__cursor--hidden');
    document.body.classList.remove('cursor-default');
    hoveredIndex = -1;
  });
});

// Click anywhere (except tracks/bar) to toggle play
document.querySelector('.player').addEventListener('click', (e) => {
  if (e.target.closest('.player__track') || e.target.closest('.player__bar')) return;

  if (!audio.src || audio.src === window.location.href) {
    loadTrack(0);
    play();
  } else {
    togglePlay();
  }
});

// Click on track to play
trackEls.forEach((el) => {
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    const index = parseInt(el.dataset.index, 10);
    loadTrack(index);
    play();
  });
});

// Formatting helper for time M:SS
function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Update progress bar & active track countdown
audio.addEventListener('timeupdate', () => {
  if (audio.duration) {
    const pct = (audio.currentTime / audio.duration) * 100;
    barFill.style.width = pct + '%';

    // Update the live countdown on the active track only
    if (currentIndex !== -1) {
      const activeTrackEl = trackEls[currentIndex];
      const durationEl = activeTrackEl.querySelector('.player__track-duration');
      if (durationEl) {
        const remaining = Math.max(0, audio.duration - audio.currentTime);
        durationEl.textContent = formatTime(remaining);
      }
    }
  }
});

// Click on bar to seek
bar.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!audio.duration) return;
  const rect = bar.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  audio.currentTime = pct * audio.duration;
});

// Auto-advance to next track
audio.addEventListener('ended', () => {
  if (currentIndex < tracks.length - 1) {
    loadTrack(currentIndex + 1);
    play();
  } else {
    loadTrack(0);
    barFill.style.width = '0%';
    isPlaying = false;
    updateCursorState();
  }
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (!audio.src || audio.src === window.location.href) {
      loadTrack(0);
      play();
    } else {
      togglePlay();
    }
  }
  if (e.code === 'ArrowRight') {
    e.preventDefault();
    if (currentIndex < tracks.length - 1) {
      loadTrack(currentIndex + 1);
      play();
    }
  }
  if (e.code === 'ArrowLeft') {
    e.preventDefault();
    if (currentIndex > 0) {
      loadTrack(currentIndex - 1);
      play();
    }
  }
});

// Slow background video
if (bgVideo) {
  bgVideo.playbackRate = 0.42;
}

// No track pre-loaded; all tracks scramble on load
