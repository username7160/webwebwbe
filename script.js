const dialogueLines = [
  "SYSTEM_LOG // INITIATING CONNECTION..",
  "............. BWAAAA LOOK AT YOUR FACEEE!!! I GOTCHAAA!!",
  "anyways... first time, huh?",
  "welcome to my website─₊˚⊹         i'm bromm.",
  "feel free to snoop around.     i document my interests and other thoughts on this domain.",
  "whatever, go my scrarab! ",
];

const scarabGifUrl = "https://media.tenor.com/Ewye-1A-5t4AAAAM/scarab-beetle.gif";
const speed = 40;

let currentLine = 0;
let currentChar = 0;
let isTyping = false;
let typingTimer = null;

const textElement = document.getElementById("dialogue-text");
const continueBtn = document.getElementById("continue-btn");
const startBtn = document.getElementById("start-btn");
const containerMain = document.querySelector(".container-main");
const brommImage = document.querySelector(".bromm-image");
const staticOverlay = document.querySelector(".static-overlay");
const mainContent = document.getElementById("main-site-content");

// --- 1. FIRST-TIME VISITOR CHECK ---
if (localStorage.getItem("hasVisited")) {
  // Returning visitor: bypass sequence and show main content immediately
  document.body.classList.add("skip-intro");
  if (containerMain) containerMain.style.display = "none";
  if (mainContent) mainContent.classList.add("visible");
}

// --- SOUND SETUP ---
const introSound = document.getElementById("intro-sound");
const talkBlipRemoteSrc = document.getElementById("talk-blip").src;

// Small pool of <audio> elements so overlapping blips don't cut each other off.
const BLIP_POOL_SIZE = 6;
let blipPool = [];
let blipPoolIndex = 0;

async function setupBlipPool() {
  try {
    // Fetch the remote file once, convert to a local blob URL so repeated
    // rapid playback doesn't re-hit the network (fixes choppy audio).
    const res = await fetch(talkBlipRemoteSrc);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    blipPool = Array.from({ length: BLIP_POOL_SIZE }, () => {
      const a = new Audio(blobUrl);
      a.volume = 0.5; // adjust overall blip volume here
      a.preload = "auto";
      return a;
    });
  } catch (err) {
    console.warn("Talk blip failed to preload, falling back to remote src", err);
    // Fallback: pool plays directly from the remote URL if blob fetch fails
    blipPool = Array.from({ length: BLIP_POOL_SIZE }, () => {
      const a = new Audio(talkBlipRemoteSrc);
      a.volume = 0.5;
      return a;
    });
  }
}
setupBlipPool();

function playBlip() {
  if (blipPool.length === 0) return; // pool not ready yet
  const blip = blipPool[blipPoolIndex];
  blipPoolIndex = (blipPoolIndex + 1) % blipPool.length;

  blip.currentTime = 0;
  blip.playbackRate = 0.9 + Math.random() * 0.2; // slight pitch variation, AC-style
  blip.play().catch((err) => {
    console.warn("Talk blip failed to play", err);
  });
}

function playIntroSound() {
  if (!introSound) return;
  introSound.currentTime = 0;
  introSound.volume = 0.6; // adjust intro sound volume here
  introSound.play().catch((err) => {
    console.warn("Intro sound not loaded yet (placeholder src?)", err);
  });
}

function appendScarabGif() {
  if (currentLine === dialogueLines.length - 1 && !document.getElementById("scarab-gif")) {
    const gif = document.createElement("img");
    gif.id = "scarab-gif";
    gif.src = scarabGifUrl;
    gif.className = "inline-scarab-gif";
    textElement.appendChild(gif);
  }
}

function typeText() {
  if (currentChar < dialogueLines[currentLine].length) {
    isTyping = true;
    textElement.classList.remove("finished");
    const char = dialogueLines[currentLine].charAt(currentChar);
    textElement.textContent += char;

    // Skip the voice blip on the first line (SYSTEM_LOG) since it's a computer
    // readout, not bromm speaking.
    if (char.trim() !== "" && currentLine > 0) {
      playBlip();
    }

    currentChar++;
    typingTimer = setTimeout(typeText, speed);
  } else {
    isTyping = false;
    textElement.classList.add("finished");
    appendScarabGif();
  }
}

function startLine() {
  textElement.classList.remove("finished");
  textElement.textContent = "";
  currentChar = 0;
  typeText();
}

function finishLineInstantly() {
  clearTimeout(typingTimer);
  textElement.textContent = dialogueLines[currentLine];
  isTyping = false;
  textElement.classList.add("finished");
  appendScarabGif();
}

function endSequence() {
  textElement.classList.remove("finished");
  textElement.textContent = ">>> SIGNAL TERMINATED";
  textElement.style.color = "#ff0000";
  continueBtn.disabled = true;

  if (brommImage) brommImage.classList.add("fade-out");
  if (staticOverlay) staticOverlay.classList.add("fade-out");

  setTimeout(() => {
    containerMain.classList.add("fade-away");

    setTimeout(() => {
      containerMain.style.display = "none";
      if (mainContent) mainContent.classList.add("visible");
    }, 1500);
  }, 2000);
}

startBtn.addEventListener("click", () => {
  // Save visit status so the intro won't play on next load
  localStorage.setItem("hasVisited", "true");

  startBtn.classList.add("hidden");
  document.body.classList.add("started");
  containerMain.classList.add("started");
  continueBtn.disabled = false;

  playIntroSound();
  typeText();
});

continueBtn.addEventListener("click", () => {
  if (isTyping) {
    finishLineInstantly();
    return;
  }

  currentLine++;
  if (currentLine < dialogueLines.length) {
    startLine();
  } else {
    endSequence();
  }
});

// --- COPY TO CLIPBOARD (e.g. the "discord" button) ---
const copyToast = document.getElementById("copy-toast");
let toastHideTimer = null;

function showCopyToast(message) {
  if (!copyToast) return;
  copyToast.textContent = message;
  copyToast.classList.add("visible");

  clearTimeout(toastHideTimer);
  toastHideTimer = setTimeout(() => {
    copyToast.classList.remove("visible");
  }, 1800);
}

function copyTextFallback(text) {
  // Fallback for browsers/contexts without navigator.clipboard
  // (e.g. plain http:// or older browsers)
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand("copy");
  } catch (err) {
    console.warn("Fallback copy failed", err);
  }
  document.body.removeChild(textarea);
}

document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const value = btn.dataset.copyValue || "";

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(value)
        .then(() => showCopyToast("copied to clipboard!"))
        .catch(() => {
          copyTextFallback(value);
          showCopyToast("copied to clipboard!");
        });
    } else {
      copyTextFallback(value);
      showCopyToast("copied to clipboard!");
    }
  });
});

// --- VIEW COUNTER ---
// Uses CountAPI (https://countapi.xyz), a free shared hit-counter service —
// no signup required. Increments on every page load and returns the new
// total. NAMESPACE/KEY together form a unique counter; change NAMESPACE if
// you ever suspect a collision with someone else's counter.
const viewsEl = document.getElementById("views-count");
const COUNTAPI_NAMESPACE = "bugshakercentral-yuinoid-style";
const COUNTAPI_KEY = "site-views";

async function updateViewCount() {
  if (!viewsEl) return;
  try {
    const res = await fetch(
      `https://api.countapi.xyz/hit/${COUNTAPI_NAMESPACE}/${COUNTAPI_KEY}`
    );
    const data = await res.json();
    viewsEl.textContent = Number(data.value).toLocaleString();
  } catch (err) {
    console.warn("View counter unavailable", err);
    viewsEl.textContent = "n/a";
  }
}
updateViewCount();

// --- LAST UPDATED ---
// Pulled automatically from the latest GitHub commit touching this file,
// so you never have to edit this date by hand. Update GITHUB_REPO if your
// site's actual repo differs from the one your audio/tile assets live in.
const lastUpdateEl = document.getElementById("last-update-text");
const GITHUB_REPO = "username7160/webwebwbe";
const GITHUB_FILE_PATH = "index.html";

async function updateLastModified() {
  if (!lastUpdateEl) return;
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/commits?path=${GITHUB_FILE_PATH}&page=1&per_page=1`
    );
    const data = await res.json();
    if (Array.isArray(data) && data[0]) {
      const date = new Date(data[0].commit.committer.date);
      lastUpdateEl.textContent = date.toISOString().slice(0, 10).replace(/-/g, "/");
    } else {
      lastUpdateEl.textContent = "n/a";
    }
  } catch (err) {
    console.warn("Last-updated lookup failed", err);
    lastUpdateEl.textContent = "n/a";
  }
}
updateLastModified();

// --- MUSIC PLAYER ---
// Placeholder tracks — replace src with your real files. Following the same
// raw.githubusercontent.com pattern as your intro/talk-blip audio.
const playlist = [
  { title: "Bôa - Duvet", src: "https://dn721901.ca.archive.org/0/items/12.-boa-duvet-acoustic/01.%20B%C3%B4a%20-%20Duvet.mp3" },
  { title: "track_02", src: "https://raw.githubusercontent.com/username7160/webwebwbe/main/music/track2.mp3" },
];

let currentTrack = 0;

const playerAudio = document.getElementById("player-audio");
const playerTitle = document.getElementById("player-track-title");
const playerPlayPause = document.getElementById("player-playpause");
const playerPrev = document.getElementById("player-prev");
const playerNext = document.getElementById("player-next");
const playerProgressBar = document.getElementById("player-progress-bar");
const playerTime = document.getElementById("player-time");
const playerVolDown = document.getElementById("player-vol-down");
const playerVolUp = document.getElementById("player-vol-up");
const playerVolumeDisplay = document.getElementById("player-volume");

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

// ASCII block progress bar — ▒ = played, ░ = unplayed
const PROGRESS_BAR_LENGTH = 20;

function renderProgressBar(ratio) {
  const clamped = Math.min(Math.max(ratio, 0), 1);
  const playedCount = Math.round(clamped * PROGRESS_BAR_LENGTH);
  const unplayedCount = PROGRESS_BAR_LENGTH - playedCount;
  return "▒".repeat(playedCount) + "░".repeat(unplayedCount);
}

// Volume — starts at 25%, each button press steps by 12.5%
const VOLUME_STEP = 0.125;
let currentVolume = 0.25;

function setVolume(vol) {
  currentVolume = Math.min(Math.max(vol, 0), 1);
  if (playerAudio) playerAudio.volume = currentVolume;
  if (playerVolumeDisplay) {
    playerVolumeDisplay.textContent = `${Math.round(currentVolume * 100)}%`;
  }
}

function loadTrack(index, autoplay) {
  if (!playerAudio || playlist.length === 0) return;
  currentTrack = (index + playlist.length) % playlist.length;
  const track = playlist[currentTrack];

  playerAudio.src = track.src;
  if (playerTitle) playerTitle.textContent = track.title;
  if (playerProgressBar) playerProgressBar.textContent = renderProgressBar(0);
  if (playerTime) playerTime.textContent = "0:00 / 0:00";
  if (playerPlayPause) playerPlayPause.textContent = "▶";

  if (autoplay) {
    playerAudio.play().catch((err) => {
      console.warn("Player playback blocked or failed", err);
    });
  }
}

if (playerAudio && playlist.length > 0) {
  setVolume(currentVolume);
  loadTrack(0, false);

  playerPlayPause.addEventListener("click", () => {
    if (playerAudio.paused) {
      playerAudio.play().catch((err) => console.warn("Playback failed", err));
    } else {
      playerAudio.pause();
    }
  });

  playerAudio.addEventListener("play", () => {
    playerPlayPause.textContent = "⏸";
  });

  playerAudio.addEventListener("pause", () => {
    playerPlayPause.textContent = "▶";
  });

  playerPrev.addEventListener("click", () => loadTrack(currentTrack - 1, true));
  playerNext.addEventListener("click", () => loadTrack(currentTrack + 1, true));
  playerAudio.addEventListener("ended", () => loadTrack(currentTrack + 1, true));

  playerVolDown.addEventListener("click", () => setVolume(currentVolume - VOLUME_STEP));
  playerVolUp.addEventListener("click", () => setVolume(currentVolume + VOLUME_STEP));

  playerAudio.addEventListener("timeupdate", () => {
    const ratio = playerAudio.duration
      ? playerAudio.currentTime / playerAudio.duration
      : 0;
    if (playerProgressBar) playerProgressBar.textContent = renderProgressBar(ratio);
    if (playerTime) {
      playerTime.textContent = `${formatTime(playerAudio.currentTime)} / ${formatTime(
        playerAudio.duration
      )}`;
    }
  });

  playerProgressBar.addEventListener("click", (e) => {
    if (!playerAudio.duration) return;
    const rect = playerProgressBar.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    playerAudio.currentTime = ratio * playerAudio.duration;
  });

  playerAudio.addEventListener("error", () => {
    if (playerTitle) {
      playerTitle.textContent = `${playlist[currentTrack].title} (file not found — placeholder)`;
    }
  });
}