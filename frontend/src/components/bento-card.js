/**
 * Bento Card Component
 * Creates individual cards for bento grid with varying sizes
 */

import { animationController } from '../services/animation-controller.js';

export class BentoCard {
  constructor(options = {}) {
    this.id = options.id || `bento-card-${Math.random().toString(36).substr(2, 9)}`;
    this.title = options.title || '';
    this.description = options.description || '';
    this.size = options.size || 'medium'; // small, medium, large, xlarge
    this.columnSpan = options.columnSpan || null;
    this.rowSpan = options.rowSpan || null;
    this.image = options.image || null;
    this.icon = options.icon || null;
    this.color = options.color || null;
    this.animationDelay = options.animationDelay || 0;
    this.cardElement = null;
    this.isHovered = false;
    this.hoverAnimation = null;
  }

  /**
   * Get grid spans based on size
   */
  getGridSpans() {
    if (this.columnSpan && this.rowSpan) {
      return { columnSpan: this.columnSpan, rowSpan: this.rowSpan };
    }

    const sizeMap = {
      small: { columnSpan: 4, rowSpan: 2 },
      medium: { columnSpan: 6, rowSpan: 3 },
      large: { columnSpan: 8, rowSpan: 4 },
      xlarge: { columnSpan: 12, rowSpan: 4 }
    };

    return sizeMap[this.size] || sizeMap.medium;
  }

  /**
   * Create bento card element
   */
  create() {
    const card = document.createElement('article');
    card.id = this.id;
    card.className = `bento-card bento-card-${this.size}`;
    card.setAttribute('role', 'article');
    
    const spans = this.getGridSpans();
    card.style.gridColumn = `span ${spans.columnSpan}`;
    card.style.gridRow = `span ${spans.rowSpan}`;
    
    if (this.animationDelay > 0) {
      card.style.animationDelay = `${this.animationDelay}s`;
    }

    if (this.color) {
      card.style.setProperty('--card-accent-color', this.color);
    }

    // Build card content
    let contentHTML = '<div class="bento-card-content">';

    if (this.icon) {
      contentHTML += `<div class="bento-card-icon">${this.icon}</div>`;
    }

    if (this.image) {
      contentHTML += `<div class="bento-card-image">
        <img src="${this.image.src || this.image}" 
             alt="${this.image.alt || this.title}" 
             loading="lazy" />
      </div>`;
    }

    if (this.title) {
      contentHTML += `<h3 class="bento-card-title">${this.title}</h3>`;
    }

    if (this.description) {
      contentHTML += `<p class="bento-card-description">${this.description}</p>`;
    }

    contentHTML += '</div>';

    card.innerHTML = contentHTML;
    this.cardElement = card;
    
    // Setup hover animations
    this.setupHoverEffects();
    
    return card;
  }

  /**
   * Setup hover effects for bento card
   */
  setupHoverEffects() {
    if (!this.cardElement || !animationController.shouldAnimate()) return;

    const card = this.cardElement;

    // Track hover state
    card.addEventListener('mouseenter', () => {
      this.isHovered = true;
      this.onHoverEnter();
    });

    card.addEventListener('mouseleave', () => {
      this.isHovered = false;
      this.onHoverLeave();
    });

    // Listen for animation preference changes
    window.addEventListener('animation-preference-changed', (e) => {
      if (!e.detail.shouldAnimate) {
        card.style.transform = '';
        card.style.boxShadow = '';
      }
    });
  }

  /**
   * Handle hover enter
   */
  onHoverEnter() {
    if (!this.cardElement || !animationController.shouldAnimate()) return;

    const card = this.cardElement;
    card.style.transition = 'transform 0.35s ease-out, box-shadow 0.35s ease-out, background-color 0.3s ease-out';
    card.style.transform = 'translateY(-4px) scale(1.02)';
    card.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
  }

  /**
   * Handle hover leave
   */
  onHoverLeave() {
    if (!this.cardElement || !animationController.shouldAnimate()) return;

    const card = this.cardElement;
    card.style.transform = 'translateY(0) scale(1)';
    card.style.boxShadow = '';
  }

  /**
   * Render card into grid container
   */
  render(gridContainer) {
    if (!this.cardElement) {
      this.create();
    }

    if (typeof gridContainer === 'string') {
      gridContainer = document.querySelector(gridContainer);
    }

    if (gridContainer) {
      gridContainer.appendChild(this.cardElement);
      return this.cardElement;
    }

    return null;
  }
}

