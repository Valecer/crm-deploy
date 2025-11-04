/**
 * Animation Controller Service
 * Centralized animation management with reduced motion support
 */

export class AnimationController {
  constructor() {
    this.prefersReducedMotion = false;
    this.animationsEnabled = true;
    this.performanceLevel = 'high'; // 'high' | 'medium' | 'low'
    this.listeners = [];
    this.init();
  }

  /**
   * Initialize animation controller
   */
  init() {
    // Check for prefers-reduced-motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion = mediaQuery.matches;
    
    // Listen for changes to the preference
    mediaQuery.addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
      this.updateAnimations();
    });
  }

  /**
   * Check if animations should be enabled
   */
  shouldAnimate() {
    return this.animationsEnabled && !this.prefersReducedMotion;
  }

  /**
   * Enable or disable animations
   */
  setAnimationsEnabled(enabled) {
    this.animationsEnabled = enabled;
    this.updateAnimations();
  }

  /**
   * Update animations based on current settings
   */
  updateAnimations() {
    // Dispatch event for components to react to animation changes
    const event = new CustomEvent('animation-preference-changed', {
      detail: {
        enabled: this.shouldAnimate(),
        reducedMotion: this.prefersReducedMotion,
        performanceLevel: this.performanceLevel
      }
    });
    window.dispatchEvent(event);
    
    // Notify registered listeners
    this.listeners.forEach(listener => {
      if (typeof listener === 'function') {
        listener(this.getAnimationState());
      }
    });
  }

  /**
   * Set performance level for adaptive quality
   */
  setPerformanceLevel(level) {
    if (['high', 'medium', 'low'].includes(level)) {
      this.performanceLevel = level;
      this.updateAnimations();
    }
  }

  /**
   * Get current performance level
   */
  getPerformanceLevel() {
    return this.performanceLevel;
  }

  /**
   * Register listener for animation state changes
   */
  addListener(listener) {
    if (typeof listener === 'function') {
      this.listeners.push(listener);
    }
  }

  /**
   * Remove listener
   */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Get current animation state
   */
  getAnimationState() {
    return {
      enabled: this.animationsEnabled,
      reducedMotion: this.prefersReducedMotion,
      shouldAnimate: this.shouldAnimate(),
      performanceLevel: this.performanceLevel
    };
  }
}

// Export singleton instance
export const animationController = new AnimationController();

