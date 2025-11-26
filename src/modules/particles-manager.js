/**
 * Particles Manager Module
 * Handles particles.js with performance optimizations
 */

import { PARTICLES_CONFIG, PARTICLES_CONFIG_MOBILE } from './config.js';

let particlesInstance = null;
let isParticlesPaused = false;

/**
 * Check if particles should be enabled based on user preferences and device
 * @returns {Promise<boolean>}
 */
async function shouldEnableParticles() {
  // Check if animations are force-enabled by the app (overrides reduced motion)
  const animationsForced = document.body.classList.contains('animations-enabled');

  // Check for reduced motion preference (only if not forced)
  if (!animationsForced && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    console.log('[Particles] Disabled: User prefers reduced motion');
    return false;
  }

  // If animations are forced, allow particles
  if (animationsForced) {
    console.log('[Particles] Enabled: Animations force-enabled for this site');
  }

  // Check battery status (if available)
  if ('getBattery' in navigator) {
    try {
      const battery = await navigator.getBattery();
      if (battery.level < 0.2 && !battery.charging) {
        console.log('[Particles] Disabled: Low battery');
        return false;
      }
    } catch (e) {
      // Battery API not available, continue
    }
  }

  return true;
}

/**
 * Initialize particles.js with performance optimizations
 */
export async function initParticles() {
  // Check if we should enable particles
  const shouldEnable = await shouldEnableParticles();
  if (!shouldEnable) {
    hideParticlesContainer();
    return;
  }

  // Dynamically import particles.js
  try {
    // particles.js attaches to window.particlesJS
    await import('../lib/particles.min.js');

    if (typeof window.particlesJS === 'undefined') {
      console.error('[Particles] particles.js not loaded correctly');
      return;
    }

    // Use mobile config for smaller screens
    const isMobile = window.innerWidth < 768;
    const config = isMobile ? PARTICLES_CONFIG_MOBILE : PARTICLES_CONFIG;

    window.particlesJS('particles-js', config);
    particlesInstance = window.pJSDom?.[0]?.pJS;

    console.log('[Particles] Initialized successfully', isMobile ? '(mobile config)' : '(desktop config)');

    // Set up visibility change listener for pause/resume
    setupVisibilityListener();

  } catch (error) {
    console.error('[Particles] Failed to initialize:', error);
  }
}

/**
 * Set up visibility change listener to pause particles when tab is hidden
 */
function setupVisibilityListener() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pauseParticles();
    } else {
      resumeParticles();
    }
  });

  // Also pause when window loses focus (for performance)
  window.addEventListener('blur', () => {
    pauseParticles();
  });

  window.addEventListener('focus', () => {
    resumeParticles();
  });
}

/**
 * Pause particles animation
 */
export function pauseParticles() {
  if (particlesInstance && !isParticlesPaused) {
    try {
      // Stop the animation frame
      if (particlesInstance.fn?.vendors?.draw) {
        cancelAnimationFrame(particlesInstance.fn.requestAnimFrame);
      }
      isParticlesPaused = true;
      console.log('[Particles] Paused');
    } catch (e) {
      console.warn('[Particles] Could not pause:', e);
    }
  }
}

/**
 * Resume particles animation
 */
export function resumeParticles() {
  if (particlesInstance && isParticlesPaused) {
    try {
      // Restart the animation
      if (particlesInstance.fn?.vendors?.draw) {
        particlesInstance.fn.vendors.draw();
      }
      isParticlesPaused = false;
      console.log('[Particles] Resumed');
    } catch (e) {
      console.warn('[Particles] Could not resume:', e);
    }
  }
}

/**
 * Destroy particles instance
 */
export function destroyParticles() {
  if (particlesInstance) {
    try {
      particlesInstance.fn.vendors.destroypJS();
      particlesInstance = null;
      isParticlesPaused = false;
      console.log('[Particles] Destroyed');
    } catch (e) {
      console.warn('[Particles] Could not destroy:', e);
    }
  }
}

/**
 * Hide particles container
 */
function hideParticlesContainer() {
  const container = document.getElementById('particles-js');
  if (container) {
    container.style.display = 'none';
  }
}

/**
 * Check if particles are currently active
 * @returns {boolean}
 */
export function isParticlesActive() {
  return particlesInstance !== null && !isParticlesPaused;
}
