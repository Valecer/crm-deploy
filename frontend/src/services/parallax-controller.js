/**
 * Parallax Controller Service
 * Manages scroll-based parallax effects for depth layers
 */

import { animationController } from './animation-controller.js';

export class ParallaxController {
  constructor() {
    this.parallaxElements = [];
    this.isActive = false;
    this.scrollY = 0;
    this.windowHeight = window.innerHeight;
    this.init();
  }

  /**
   * Initialize parallax controller
   */
  init() {
    // Listen for animation preference changes
    window.addEventListener('animation-preference-changed', (e) => {
      if (!e.detail.shouldAnimate) {
        this.deactivate();
      } else {
        this.activate();
      }
    });

    // Check initial animation state
    if (animationController.shouldAnimate()) {
      this.activate();
    }

    // Update window height on resize
    window.addEventListener('resize', () => {
      this.windowHeight = window.innerHeight;
    });
  }

  /**
   * Activate parallax effects
   */
  activate() {
    if (this.isActive) return;
    
    this.isActive = true;
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    this.handleScroll();
  }

  /**
   * Deactivate parallax effects
   */
  deactivate() {
    if (!this.isActive) return;
    
    this.isActive = false;
    window.removeEventListener('scroll', this.handleScroll.bind(this));
    
    // Reset all parallax elements
    this.parallaxElements.forEach(el => {
      if (el.element) {
        el.element.style.transform = '';
      }
    });
  }

  /**
   * Handle scroll event
   */
  handleScroll() {
    if (!this.isActive || !animationController.shouldAnimate()) return;

    this.scrollY = window.scrollY || window.pageYOffset;

    this.parallaxElements.forEach((item) => {
      if (!item.element) return;

      const rect = item.element.getBoundingClientRect();
      const elementTop = rect.top + this.scrollY;
      const elementCenter = elementTop + rect.height / 2;
      const viewportCenter = this.scrollY + this.windowHeight / 2;
      
      // Calculate distance from viewport center
      const distance = viewportCenter - elementCenter;
      
      // Apply parallax transform
      const parallaxOffset = distance * item.speed * -1;
      item.element.style.transform = `translateY(${parallaxOffset}px)`;
    });
  }

  /**
   * Register element for parallax effect
   * @param {HTMLElement|string} element - Element or selector
   * @param {Object} options - Parallax options
   * @param {number} options.speed - Parallax speed (0-1, typically 0.1-0.5)
   * @param {string} options.depth - Depth layer identifier
   */
  registerElement(element, options = {}) {
    const el = typeof element === 'string' 
      ? document.querySelector(element)
      : element;

    if (!el) {
      console.warn('Parallax element not found:', element);
      return;
    }

    const config = {
      element: el,
      speed: options.speed || 0.2,
      depth: options.depth || 'default'
    };

    // Check if already registered
    const existing = this.parallaxElements.find(item => item.element === el);
    if (existing) {
      existing.speed = config.speed;
      existing.depth = config.depth;
      return;
    }

    this.parallaxElements.push(config);

    // Trigger initial calculation
    if (this.isActive) {
      this.handleScroll();
    }
  }

  /**
   * Unregister element from parallax
   */
  unregisterElement(element) {
    const el = typeof element === 'string' 
      ? document.querySelector(element)
      : element;

    const index = this.parallaxElements.findIndex(item => item.element === el);
    if (index > -1) {
      // Reset transform
      if (this.parallaxElements[index].element) {
        this.parallaxElements[index].element.style.transform = '';
      }
      this.parallaxElements.splice(index, 1);
    }
  }

  /**
   * Set depth layer speeds
   */
  setDepthSpeeds(depths) {
    this.parallaxElements.forEach(item => {
      if (depths[item.depth] !== undefined) {
        item.speed = depths[item.depth];
      }
    });
  }

  /**
   * Cleanup
   */
  dispose() {
    this.deactivate();
    this.parallaxElements = [];
  }
}

// Export singleton instance
export const parallaxController = new ParallaxController();

