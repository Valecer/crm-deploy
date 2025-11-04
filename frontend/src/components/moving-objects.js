/**
 * Moving Objects Component
 * Reusable component for animated visual elements with various motion patterns
 */

import { animationController } from '../services/animation-controller.js';

export class MovingObjects {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container)
      : container;
    this.options = {
      motionType: 'float', // 'float' | 'orbit'
      speed: 1,
      range: { x: 0, y: 20, z: 0 },
      orbitRadius: 50,
      orbitCenter: { x: 0, y: 0 },
      ...options
    };
    this.objects = [];
    this.isVisible = true;
    this.animationFrame = null;
    this.startTime = performance.now();
    this.init();
  }

  /**
   * Initialize moving objects component
   */
  init() {
    if (!this.container) {
      console.error('Moving objects container not found');
      return;
    }

    // Listen for animation preference changes
    window.addEventListener('animation-preference-changed', (e) => {
      if (!e.detail.shouldAnimate) {
        this.pause();
      } else {
        this.resume();
      }
    });

    // Check initial animation state
    if (!animationController.shouldAnimate()) {
      return;
    }

    this.createObjects();
    this.observeVisibility();
  }

  /**
   * Create moving object elements
   */
  createObjects() {
    // Create abstract geometric shapes as moving objects
    const shapes = [
      { type: 'circle', size: 20, color: 'rgba(59, 130, 246, 0.3)' },
      { type: 'square', size: 15, color: 'rgba(37, 99, 235, 0.25)' },
      { type: 'triangle', size: 18, color: 'rgba(96, 165, 250, 0.2)' }
    ];

    shapes.forEach((shape, index) => {
      const element = document.createElement('div');
      element.className = 'moving-object';
      element.style.cssText = `
        position: absolute;
        width: ${shape.size}px;
        height: ${shape.size}px;
        background: ${shape.color};
        border-radius: ${shape.type === 'circle' ? '50%' : shape.type === 'triangle' ? '0' : '4px'};
        clip-path: ${shape.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none'};
        pointer-events: none;
        will-change: transform;
      `;

      // Set initial position
      element.style.left = `${10 + index * 30}%`;
      element.style.top = `${20 + index * 15}%`;

      this.container.appendChild(element);
      this.objects.push({
        element,
        phaseOffset: index * (Math.PI / 3), // Stagger phases
        ...shape
      });
    });

    this.animate();
  }

  /**
   * Animate moving objects
   */
  animate() {
    if (!this.isVisible || !animationController.shouldAnimate()) {
      return;
    }

    this.animationFrame = requestAnimationFrame(() => this.animate());

    const time = (performance.now() - this.startTime) * 0.001 * this.options.speed;

    this.objects.forEach((obj) => {
      if (this.options.motionType === 'float') {
        // Sine wave floating motion
        const x = Math.sin(time + obj.phaseOffset) * this.options.range.x;
        const y = Math.sin(time * 0.7 + obj.phaseOffset) * this.options.range.y;
        obj.element.style.transform = `translate(${x}px, ${y}px)`;
      } else if (this.options.motionType === 'orbit') {
        // Circular orbit motion
        const angle = time + obj.phaseOffset;
        const x = Math.cos(angle) * this.options.orbitRadius;
        const y = Math.sin(angle) * this.options.orbitRadius;
        obj.element.style.transform = `translate(${x}px, ${y}px)`;
      }
    });
  }

  /**
   * Observe visibility for performance
   */
  observeVisibility() {
    if (!('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        this.isVisible = entry.isIntersecting;
        if (this.isVisible && animationController.shouldAnimate()) {
          this.resume();
        } else {
          this.pause();
        }
      });
    }, {
      threshold: 0.1
    });

    observer.observe(this.container);
  }

  /**
   * Pause animation
   */
  pause() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Resume animation
   */
  resume() {
    if (!this.animationFrame && animationController.shouldAnimate()) {
      this.startTime = performance.now();
      this.animate();
    }
  }

  /**
   * Cleanup
   */
  dispose() {
    this.pause();
    
    if (this.objects) {
      this.objects.forEach(obj => {
        if (obj.element && obj.element.parentNode) {
          obj.element.parentNode.removeChild(obj.element);
        }
      });
      this.objects = [];
    }
  }
}

