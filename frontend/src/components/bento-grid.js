/**
 * Bento Grid Component
 * Creates responsive bento-style grid layout for content cards
 */

export class BentoGrid {
  constructor(options = {}) {
    this.columns = options.columns || 12;
    this.gap = options.gap || 'var(--bento-gap-md)';
    this.container = null;
  }

  /**
   * Create bento grid element
   */
  create() {
    const grid = document.createElement('div');
    grid.className = 'bento-grid';
    grid.setAttribute('role', 'region');
    grid.setAttribute('aria-label', 'Content grid');
    
    // Set CSS custom properties for grid configuration
    grid.style.setProperty('--grid-columns', this.columns);
    grid.style.setProperty('--grid-gap', this.gap);

    this.container = grid;
    return grid;
  }

  /**
   * Render bento grid into container
   */
  render(parentContainer) {
    if (!this.container) {
      this.create();
    }

    if (typeof parentContainer === 'string') {
      parentContainer = document.querySelector(parentContainer);
    }

    if (parentContainer) {
      parentContainer.appendChild(this.container);
      return this.container;
    }

    return null;
  }

  /**
   * Get the grid container element
   */
  getContainer() {
    return this.container;
  }
}

