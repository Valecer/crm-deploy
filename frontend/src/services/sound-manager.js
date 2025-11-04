/**
 * Sound Manager Service
 * Handles sound playback for notifications with browser autoplay policy handling
 */

// Store audio instances for different sound types
const audioInstances = new Map();
let audioUnlocked = false;
let lastSoundPlayTime = 0;
const MIN_SOUND_INTERVAL = 2000; // Minimum 2 seconds between sounds

/**
 * Generate a simple beep sound using Web Audio API as fallback
 * @returns {Promise<AudioBuffer>} Audio buffer containing beep sound
 */
function generateBeepSound(frequency = 800, duration = 200) {
  return new Promise((resolve) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const numSamples = Math.floor(sampleRate * duration / 1000);
    const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Generate a simple sine wave with fade in/out
      const fadeIn = Math.min(1, i / (sampleRate * 0.01));
      const fadeOut = Math.min(1, (numSamples - i) / (sampleRate * 0.01));
      const fade = fadeIn * fadeOut;
      data[i] = Math.sin(2 * Math.PI * frequency * t) * fade * 0.3;
    }

    resolve(buffer);
  });
}

/**
 * Load audio file or create fallback beep
 * @param {string} soundType - Sound type ('message' or 'ticket')
 * @returns {Promise<HTMLAudioElement|AudioBuffer>} Audio element or buffer
 */
async function loadAudio(soundType) {
  // Check if already loaded
  if (audioInstances.has(soundType)) {
    return audioInstances.get(soundType);
  }

  let audio;

  // Try to load sound file
  const soundFiles = {
    message: '/sounds/notification-message.mp3',
    ticket: '/sounds/notification-ticket.mp3',
  };

  const soundPath = soundFiles[soundType] || soundFiles.message;

  try {
    // Try loading from file
    audio = new Audio(soundPath);
    
    // Handle load errors
    audio.addEventListener('error', async () => {
      console.warn(`Failed to load sound file ${soundPath}, using fallback beep`);
      // Create fallback beep
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = await generateBeepSound(soundType === 'message' ? 800 : 600, 200);
      audioInstances.set(soundType, { buffer, audioContext, isBuffer: true });
    });

    // Preload audio
    audio.preload = 'auto';
    audio.load();

    // Wait for audio to be ready
    await new Promise((resolve, reject) => {
      audio.addEventListener('canplaythrough', resolve, { once: true });
      audio.addEventListener('error', reject, { once: true });
    });

    audioInstances.set(soundType, audio);
    return audio;
  } catch (error) {
    console.warn(`Failed to load sound file ${soundPath}, using fallback beep:`, error);
    // Create fallback beep
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const buffer = await generateBeepSound(soundType === 'message' ? 800 : 600, 200);
    const beepAudio = { buffer, audioContext, isBuffer: true };
    audioInstances.set(soundType, beepAudio);
    return beepAudio;
  }
}

/**
 * Unlock audio by playing a silent sound on user interaction
 * This is required due to browser autoplay policies
 */
export function unlockAudio() {
  if (audioUnlocked) return Promise.resolve();

  return new Promise((resolve) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const buffer = audioContext.createBuffer(1, 1, 22050);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
    
    audioUnlocked = true;
    resolve();
  });
}

/**
 * Play notification sound
 * @param {string} soundType - Sound type ('message' or 'ticket')
 * @param {number} volume - Volume level (0-100)
 * @returns {Promise<void>}
 */
export async function playSound(soundType = 'message', volume = 80) {
  // Prevent sound spam
  const now = Date.now();
  if (now - lastSoundPlayTime < MIN_SOUND_INTERVAL) {
    return;
  }
  lastSoundPlayTime = now;

  // Check if audio is unlocked (required for autoplay)
  if (!audioUnlocked) {
    // Try to unlock audio silently
    try {
      await unlockAudio();
    } catch (error) {
      console.warn('Failed to unlock audio:', error);
      // Continue anyway, might work in some browsers
    }
  }

  try {
    const audio = await loadAudio(soundType);

    if (audio.isBuffer) {
      // Play beep from buffer
      const { buffer, audioContext } = audio;
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      
      source.buffer = buffer;
      gainNode.gain.value = volume / 100;
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      source.start(0);
    } else {
      // Play audio file
      audio.volume = Math.max(0, Math.min(1, volume / 100));
      
      // Reset audio to beginning if already playing
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
      
      try {
        await audio.play();
      } catch (error) {
        // Audio play failed, likely due to autoplay policy
        console.warn('Failed to play sound:', error);
        // Show visual notification fallback could go here
      }
    }
  } catch (error) {
    console.error('Error playing sound:', error);
  }
}

/**
 * Set volume for all sounds
 * @param {number} volume - Volume level (0-100)
 */
export function setVolume(volume) {
  const clampedVolume = Math.max(0, Math.min(100, volume));
  
  // Update volume for all loaded audio instances
  audioInstances.forEach((audio) => {
    if (!audio.isBuffer && audio.volume !== undefined) {
      audio.volume = clampedVolume / 100;
    }
  });
}

/**
 * Preload all notification sounds
 */
export async function preloadSounds() {
  try {
    await Promise.all([
      loadAudio('message'),
      loadAudio('ticket'),
    ]);
  } catch (error) {
    console.warn('Error preloading sounds:', error);
  }
}

/**
 * Initialize sound manager
 * Attempts to unlock audio on first user interaction
 */
export function initializeSoundManager() {
  // Unlock audio on any user interaction
  const unlockEvents = ['click', 'keydown', 'touchstart'];
  
  const unlockHandler = async () => {
    await unlockAudio();
    unlockEvents.forEach(event => {
      document.removeEventListener(event, unlockHandler);
    });
  };

  unlockEvents.forEach(event => {
    document.addEventListener(event, unlockHandler, { once: true });
  });
}

