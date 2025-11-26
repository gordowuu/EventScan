// Firebase Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyC9_9d9rKxiKgk9VvybWWXSniL4pYC0AmM",
  authDomain: "eventsnap-backend.firebaseapp.com",
  projectId: "eventsnap-backend",
  storageBucket: "eventsnap-backend.firebasestorage.app",
  messagingSenderId: "804076361371",
  appId: "1:804076361371:web:6ff59e4129f408369b583e",
  measurementId: "G-C6B8MPB0H6"
};

// Image processing configuration
export const IMAGE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB max
  COMPRESSION_QUALITY: 0.85,
  MAX_DIMENSION: 2048
};

// Particles.js configuration
export const PARTICLES_CONFIG = {
  particles: {
    number: {
      value: 80,
      density: { enable: true, value_area: 800 }
    },
    color: { value: '#8b5cf6' },
    shape: { type: 'circle' },
    opacity: { value: 0.5, random: true },
    size: { value: 3, random: true },
    line_linked: {
      enable: true,
      distance: 150,
      color: '#8b5cf6',
      opacity: 0.4,
      width: 1
    },
    move: {
      enable: true,
      speed: 2,
      direction: 'none',
      random: false,
      straight: false,
      out_mode: 'out',
      bounce: false
    }
  },
  interactivity: {
    detect_on: 'canvas',
    events: {
      onhover: { enable: true, mode: 'repulse' },
      onclick: { enable: true, mode: 'push' },
      resize: true
    }
  },
  retina_detect: true
};

// Mobile-optimized particles config (fewer particles)
export const PARTICLES_CONFIG_MOBILE = {
  ...PARTICLES_CONFIG,
  particles: {
    ...PARTICLES_CONFIG.particles,
    number: {
      value: 30,
      density: { enable: true, value_area: 800 }
    }
  }
};
