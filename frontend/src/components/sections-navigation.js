/**
 * Sections Navigation Component
 * Creates a floating/sticky navigation panel for quick access to page sections
 */

export class SectionsNavigation {
  constructor(options = {}) {
    this.sections = options.sections || [
      { id: 'hero', label: 'Home' },
      { id: 'about-company', label: 'About' },
      { id: 'services', label: 'Services' },
      { id: 'customers', label: 'Customers' },
      { id: 'partners', label: 'Partners' },
      { id: 'contacts', label: 'Contact' }
    ];
    this.position = options.position || 'right'; // 'left' or 'right'
    this.navElement = null;
    this.activeSectionId = null;
    this.observer = null;
  }

  /**
   * Create sections navigation element
   */
  create() {
    const nav = document.createElement('nav');
    nav.className = `sections-navigation sections-navigation-${this.position}`;
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Page sections navigation');

    let navHTML = '<ul class="sections-nav-list">';
    
    this.sections.forEach((section, index) => {
      const sectionElement = document.getElementById(section.id);
      if (sectionElement) {
        navHTML += `
          <li class="sections-nav-item">
            <a href="#${section.id}" 
               class="sections-nav-link" 
               data-section-id="${section.id}"
               aria-label="Navigate to ${section.label} section">
              <span class="sections-nav-dot" aria-hidden="true"></span>
              <span class="sections-nav-label">${this._escapeHtml(section.label)}</span>
            </a>
          </li>
        `;
      }
    });

    navHTML += '</ul>';
    nav.innerHTML = navHTML;

    this.navElement = nav;
    this._attachEventListeners();
    this._initIntersectionObserver();

    return nav;
  }

  /**
   * Attach event listeners for navigation clicks
   */
  _attachEventListeners() {
    if (!this.navElement) return;

    const links = this.navElement.querySelectorAll('.sections-nav-link');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.dataset.sectionId;
        this.scrollToSection(sectionId);
      });
    });
  }

  /**
   * Scroll to a specific section with smooth behavior
   */
  scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const navHeight = document.querySelector('#navigation')?.offsetHeight || 0;
    const sectionTop = section.getBoundingClientRect().top + window.pageYOffset - navHeight;

    window.scrollTo({
      top: sectionTop,
      behavior: 'smooth'
    });

    // Update active state immediately
    this._setActiveSection(sectionId);
  }

  /**
   * Initialize Intersection Observer to detect active section
   */
  _initIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this._setActiveSection(entry.target.id);
        }
      });
    }, options);

    // Observe all sections
    this.sections.forEach(section => {
      const sectionElement = document.getElementById(section.id);
      if (sectionElement) {
        this.observer.observe(sectionElement);
      }
    });
  }

  /**
   * Set active section and update navigation
   */
  _setActiveSection(sectionId) {
    if (this.activeSectionId === sectionId) return;

    // Remove active class from all links
    const links = this.navElement?.querySelectorAll('.sections-nav-link');
    links?.forEach(link => {
      link.classList.remove('active');
    });

    // Add active class to current section link
    const activeLink = this.navElement?.querySelector(`[data-section-id="${sectionId}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
      this.activeSectionId = sectionId;
    }
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
   * Render sections navigation into container
   */
  render(container) {
    if (!this.navElement) {
      this.create();
    }

    if (typeof container === 'string') {
      container = document.querySelector(container);
    }

    if (container) {
      container.appendChild(this.navElement);
      return this.navElement;
    }

    return null;
  }

  /**
   * Update navigation labels when language changes
   */
  update() {
    if (!this.navElement) return;
    
    const links = this.navElement.querySelectorAll('.sections-nav-link');
    links.forEach((link, index) => {
      if (this.sections[index]) {
        const label = this.navElement.querySelector(`[data-section-id="${this.sections[index].id}"] .sections-nav-label`);
        if (label) {
          label.textContent = this.sections[index].label;
        }
        link.setAttribute('aria-label', `Navigate to ${this.sections[index].label} section`);
      }
    });
  }

  /**
   * Dispose and cleanup
   */
  dispose() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

