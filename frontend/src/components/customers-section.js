/**
 * Customers Section Component
 * Displays customer testimonials, logos, or case studies
 */

export class CustomersSection {
  constructor(options = {}) {
    this.id = options.id || `customers-section-${Math.random().toString(36).substr(2, 9)}`;
    this.type = 'customers';
    this.title = options.title || 'What Our Customers Say';
    this.subtitle = options.subtitle || '';
    this.format = options.format || 'testimonials'; // testimonials, logos, case-studies
    this.items = options.items || [];
    this.backgroundColor = options.backgroundColor || 'var(--bg-secondary)';
    this.textColor = options.textColor || 'var(--text-primary)';
    this.sectionElement = null;
  }

  /**
   * Create customers section element
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

    sectionHTML += '<div class="content-section-body customers-content">';
    
    if (this.format === 'testimonials') {
      sectionHTML += this._createTestimonials();
    } else if (this.format === 'logos') {
      sectionHTML += this._createLogos();
    } else if (this.format === 'case-studies') {
      sectionHTML += this._createCaseStudies();
    }

    sectionHTML += '</div></div>';

    section.innerHTML = sectionHTML;
    this.sectionElement = section;
    return section;
  }

  /**
   * Create testimonials display
   */
  _createTestimonials() {
    if (!this.items || this.items.length === 0) {
      return '<div class="customers-empty">No testimonials available.</div>';
    }

    let html = '<div class="testimonials-grid">';
    
    this.items.forEach(item => {
      html += '<div class="testimonial-card">';
      
      if (item.rating) {
        html += '<div class="testimonial-rating">';
        for (let i = 0; i < 5; i++) {
          html += `<span class="star ${i < item.rating ? 'filled' : ''}">★</span>`;
        }
        html += '</div>';
      }

      if (item.quote) {
        html += `<blockquote class="testimonial-quote">${this._escapeHtml(item.quote)}</blockquote>`;
      }

      if (item.author) {
        html += '<div class="testimonial-author">';
        if (item.logo) {
          html += `<img src="${this._escapeHtml(item.logo)}" alt="${this._escapeHtml(item.author.company || item.author.name)} logo" class="testimonial-logo" onerror="this.style.display='none'">`;
        }
        html += '<div class="testimonial-author-info">';
        if (item.author.name) {
          html += `<div class="testimonial-author-name">${this._escapeHtml(item.author.name)}</div>`;
        }
        if (item.author.role) {
          html += `<div class="testimonial-author-role">${this._escapeHtml(item.author.role)}</div>`;
        }
        if (item.author.company) {
          html += `<div class="testimonial-author-company">${this._escapeHtml(item.author.company)}</div>`;
        }
        html += '</div></div>';
      }

      html += '</div>';
    });

    html += '</div>';
    return html;
  }

  /**
   * Create logos display
   */
  _createLogos() {
    if (!this.items || this.items.length === 0) {
      return '<div class="customers-empty">No customer logos available.</div>';
    }

    let html = '<div class="customers-logos-grid">';
    
    this.items.forEach(item => {
      html += '<div class="customer-logo-item">';
      if (item.logo) {
        html += `<img src="${this._escapeHtml(item.logo)}" alt="${this._escapeHtml(item.company || 'Customer')} logo" class="customer-logo" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'100\'%3E%3Crect width=\'200\' height=\'100\' fill=\'%23f1f5f9\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dominant-baseline=\'middle\' fill=\'%2364748b\' font-family=\'sans-serif\' font-size=\'14\'%3E${this._escapeHtml(item.company || 'Logo')}%3C/text%3E%3C/svg%3E'">`;
      }
      if (item.company) {
        html += `<div class="customer-logo-name">${this._escapeHtml(item.company)}</div>`;
      }
      html += '</div>';
    });

    html += '</div>';
    return html;
  }

  /**
   * Create case studies display
   */
  _createCaseStudies() {
    if (!this.items || this.items.length === 0) {
      return '<div class="customers-empty">No case studies available.</div>';
    }

    let html = '<div class="case-studies-grid">';
    
    this.items.forEach(item => {
      html += '<div class="case-study-card">';
      if (item.logo) {
        html += `<img src="${this._escapeHtml(item.logo)}" alt="${this._escapeHtml(item.company || 'Case study')} logo" class="case-study-logo" onerror="this.style.display='none'">`;
      }
      if (item.title) {
        html += `<h3 class="case-study-title">${this._escapeHtml(item.title)}</h3>`;
      }
      if (item.summary) {
        html += `<p class="case-study-summary">${this._escapeHtml(item.summary)}</p>`;
      }
      if (item.company) {
        html += `<div class="case-study-company">${this._escapeHtml(item.company)}</div>`;
      }
      if (item.link) {
        html += `<a href="${this._escapeHtml(item.link)}" class="case-study-link" target="_blank" rel="noopener noreferrer">Read more →</a>`;
      }
      html += '</div>';
    });

    html += '</div>';
    return html;
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
      return this.sectionElement;
    }

    return null;
  }
}

