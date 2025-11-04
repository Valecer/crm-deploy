/**
 * Partners Section Component
 * Displays partner logos in a grid layout
 */

export class PartnersSection {
  constructor(options = {}) {
    this.id = options.id || `partners-section-${Math.random().toString(36).substr(2, 9)}`;
    this.type = 'partners';
    this.title = options.title || 'Our Partners';
    this.subtitle = options.subtitle || '';
    this.partners = options.partners || [];
    this.backgroundColor = options.backgroundColor || 'var(--bg-primary)';
    this.textColor = options.textColor || 'var(--text-primary)';
    this.sectionElement = null;
  }

  /**
   * Create partners section element
   */
  create() {
    const section = document.createElement('section');
    section.id = this.id;
    section.className = `content-section content-section-${this.type}`;
    section.setAttribute('role', 'region');
    section.setAttribute('aria-labelledby', `${this.id}-title`);
    section.setAttribute('data-animate', 'true');
    
    section.style.backgroundColor = this.backgroundColor;
    section.style.color = this.textColor;

    let sectionHTML = '<div class="content-section-container">';

    if (this.title) {
      sectionHTML += `<header class="content-section-header">
        <h2 id="${this.id}-title" class="content-section-title">${this.title}</h2>
        ${this.subtitle ? `<p class="content-section-subtitle">${this.subtitle}</p>` : ''}
      </header>`;
    }

    sectionHTML += '<div class="content-section-body partners-content">';
    sectionHTML += this._createPartnersGrid();
    sectionHTML += '</div></div>';

    section.innerHTML = sectionHTML;
    this.sectionElement = section;
    return section;
  }

  /**
   * Create partners carousel
   */
  _createPartnersGrid() {
    if (!this.partners || this.partners.length === 0) {
      return '<div class="partners-empty">No partners available.</div>';
    }

    let html = `
      <div class="partners-carousel-container">
        <div class="partners-carousel-wrapper">
          <div class="partners-carousel-track" data-carousel-track>
    `;
    
    // Duplicate partners for infinite scroll effect
    const duplicatedPartners = [...this.partners, ...this.partners];
    
    duplicatedPartners.forEach((partner, index) => {
      const partnerElement = partner.website 
        ? `<a href="${this._escapeHtml(partner.website)}" target="_blank" rel="noopener noreferrer" class="partner-carousel-item partner-link" aria-label="Visit ${this._escapeHtml(partner.name)} website">`
        : '<div class="partner-carousel-item partner-item">';
      
      html += partnerElement;
      
      if (partner.logo) {
        html += `<img src="${this._escapeHtml(partner.logo)}" alt="${this._escapeHtml(partner.name)} logo" class="partner-logo" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'100\'%3E%3Crect width=\'200\' height=\'100\' fill=\'%23f1f5f9\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dominant-baseline=\'middle\' fill=\'%2364748b\' font-family=\'sans-serif\' font-size=\'14\'%3E${this._escapeHtml(partner.name)}%3C/text%3E%3C/svg%3E'">`;
      }
      
      if (partner.description) {
        html += `<div class="partner-description">${this._escapeHtml(partner.description)}</div>`;
      }
      
      html += partner.website ? '</a>' : '</div>';
    });

    html += `
          </div>
        </div>
        <button class="partners-carousel-btn partners-carousel-btn-prev" aria-label="Previous partners" data-carousel-prev>
          <span aria-hidden="true">‹</span>
        </button>
        <button class="partners-carousel-btn partners-carousel-btn-next" aria-label="Next partners" data-carousel-next>
          <span aria-hidden="true">›</span>
        </button>
      </div>
    `;
    
    return html;
  }

  /**
   * Initialize carousel after rendering
   */
  initCarousel() {
    if (!this.sectionElement) return;

    const track = this.sectionElement.querySelector('[data-carousel-track]');
    const prevBtn = this.sectionElement.querySelector('[data-carousel-prev]');
    const nextBtn = this.sectionElement.querySelector('[data-carousel-next]');
    
    if (!track) return;

    const items = track.querySelectorAll('.partner-carousel-item');
    if (items.length === 0) return;

    const itemCount = items.length / 2; // Since we duplicated the items
    let currentIndex = 0;
    
    // Calculate item width with gap (try to get actual computed value)
    const getItemWidth = () => {
      const firstItem = items[0];
      if (!firstItem) return 200;
      const style = window.getComputedStyle(firstItem);
      const width = firstItem.offsetWidth;
      const marginRight = parseFloat(style.marginRight) || 0;
      return width + marginRight;
    };
    
    const updateCarousel = () => {
      const itemWidth = getItemWidth();
      const offset = -currentIndex * itemWidth;
      track.style.transform = `translateX(${offset}px)`;
      track.style.transition = 'transform 0.5s ease-in-out';
    };

    // Auto-scroll carousel
    let autoScrollInterval = setInterval(() => {
      currentIndex++;
      if (currentIndex >= itemCount) {
        currentIndex = 0;
        track.style.transition = 'none';
        updateCarousel();
        // Force reflow
        void track.offsetWidth;
        currentIndex = 0;
      }
      track.style.transition = 'transform 0.5s ease-in-out';
      updateCarousel();
    }, 3000);

    // Helper function to reset auto-scroll timer
    const resetAutoScroll = () => {
      clearInterval(autoScrollInterval);
      autoScrollInterval = setInterval(() => {
        currentIndex++;
        if (currentIndex >= itemCount) {
          currentIndex = 0;
          track.style.transition = 'none';
          updateCarousel();
          void track.offsetWidth;
        }
        track.style.transition = 'transform 0.5s ease-in-out';
        updateCarousel();
      }, 3000);
      // Update stored interval reference
      this._carouselInterval = autoScrollInterval;
    };

    // Manual navigation
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentIndex++;
        if (currentIndex >= itemCount) {
          currentIndex = 0;
          track.style.transition = 'none';
          updateCarousel();
          void track.offsetWidth;
        }
        track.style.transition = 'transform 0.5s ease-in-out';
        updateCarousel();
        resetAutoScroll();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentIndex--;
        if (currentIndex < 0) {
          currentIndex = itemCount - 1;
          track.style.transition = 'none';
          updateCarousel();
          void track.offsetWidth;
        }
        track.style.transition = 'transform 0.5s ease-in-out';
        updateCarousel();
        resetAutoScroll();
      });
    }

    // Pause on hover
    const container = this.sectionElement.querySelector('.partners-carousel-container');
    if (container) {
      container.addEventListener('mouseenter', () => {
        clearInterval(autoScrollInterval);
      });
      container.addEventListener('mouseleave', () => {
        resetAutoScroll();
      });
    }

    // Store interval for cleanup
    this._carouselInterval = autoScrollInterval;
  }

  /**
   * Escape HTML to prevent XSS
   */
  _escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Render section into container
   */
  render(parentContainer) {
    if (!this.sectionElement) {
      this.create();
    }

    if (typeof parentContainer === 'string') {
      parentContainer = document.querySelector(parentContainer);
    }

    if (parentContainer) {
      parentContainer.appendChild(this.sectionElement);
      
      // Initialize carousel after a short delay to ensure DOM is ready
      setTimeout(() => {
        this.initCarousel();
      }, 100);
      
      return this.sectionElement;
    }

    return null;
  }

  /**
   * Dispose and cleanup
   */
  dispose() {
    if (this._carouselInterval) {
      clearInterval(this._carouselInterval);
      this._carouselInterval = null;
    }
  }
}

