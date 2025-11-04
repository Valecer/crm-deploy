/**
 * Scroll Animations Component
 * Manages GSAP ScrollTrigger animations for scroll-triggered reveals
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { animationController } from '../services/animation-controller.js';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export class ScrollAnimations {
  constructor() {
    this.animations = [];
    this.isInitialized = false;
    this.scrollTriggerInstances = [];
  }

  /**
   * Initialize scroll animations
   */
  init() {
    if (this.isInitialized) {
      console.warn('Scroll animations already initialized');
      return;
    }

    // Check if animations should be enabled
    if (!animationController.shouldAnimate()) {
      console.log('Animations disabled by user preference');
      return;
    }

    this.setupBentoCardAnimations();
    this.setupContentSectionAnimations();
    this.setupParallaxAnimations();
    this.isInitialized = true;
  }

  /**
   * Setup scroll-triggered reveal animations for bento cards
   */
  setupBentoCardAnimations() {
    const cards = document.querySelectorAll('.bento-card');
    
    cards.forEach((card, index) => {
      // Individual card trigger for better performance
      const animation = gsap.from(card, {
        opacity: 0,
        y: 35,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 80%',
          toggleActions: 'play none none none',
          once: true, // Play only once for performance
        },
        delay: index * 0.1, // Stagger delay: 100ms between cards
      });

      this.scrollTriggerInstances.push(animation.scrollTrigger);
      this.animations.push(animation);
    });
  }

  /**
   * Setup scroll-triggered animations for content sections
   */
  setupContentSectionAnimations() {
    const sections = document.querySelectorAll('.content-section, section[data-animate]');
    
    sections.forEach((section, index) => {
      // Check if section is already in viewport - if so, make it visible immediately
      const rect = section.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight * 0.85;
      
      if (isInViewport) {
        // Section is already visible, ensure it's shown
        gsap.set(section, { opacity: 1, y: 0 });
      } else {
        // Section is not yet in view, animate it in on scroll
        const animation = gsap.fromTo(section, 
          {
            opacity: 0,
            y: 40,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 85%',
              toggleActions: 'play none none none',
              once: true,
            },
          }
        );

        this.scrollTriggerInstances.push(animation.scrollTrigger);
        this.animations.push(animation);
      }
    });
  }

  /**
   * Setup parallax scrolling effects for background elements
   */
  setupParallaxAnimations() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    parallaxElements.forEach((element) => {
      const speed = parseFloat(element.dataset.parallax) || 0.5;
      
      const animation = gsap.to(element, {
        y: () => window.innerHeight * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: element,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });

      this.scrollTriggerInstances.push(animation.scrollTrigger);
      this.animations.push(animation);
    });
  }

  /**
   * Refresh ScrollTrigger instances (call after DOM changes)
   */
  refresh() {
    ScrollTrigger.refresh();
  }

  /**
   * Cleanup and kill all animations
   */
  dispose() {
    this.scrollTriggerInstances.forEach((instance) => {
      if (instance && instance.kill) {
        instance.kill();
      }
    });

    this.animations.forEach((animation) => {
      if (animation && animation.kill) {
        animation.kill();
      }
    });

    this.scrollTriggerInstances = [];
    this.animations = [];
    this.isInitialized = false;
  }
}

