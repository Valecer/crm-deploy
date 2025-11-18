/**
 * Navigation Component
 * Creates navigation bar with logo, language switcher, and login button
 */

import { getCurrentLanguage, setLanguage, t } from '../services/i18n.js';

export class Navigation {
  constructor() {
    this.navElement = null;
    this.languageSwitcher = null;
    this._languageChangeHandler = null;
  }

  /**
   * Create navigation element
   */
  create() {
    const nav = document.createElement('nav');
    nav.id = 'main-navigation';
    nav.className = 'main-navigation';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Main navigation');

    const currentLang = getCurrentLanguage();
    
    nav.innerHTML = `
      <div class="nav-container">
        <div class="nav-brand">
          <a href="/" class="nav-logo" aria-label="Company Logo">
            <svg class="logo-icon" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="6" fill="url(#navLogoGradient)"/>
              <path d="M12 20L18 14L20 16L16 20L20 24L18 26L12 20Z" fill="white"/>
              <path d="M28 20L22 14L20 16L24 20L20 24L22 26L28 20Z" fill="white"/>
              <circle cx="20" cy="20" r="2" fill="white"/>
              <defs>
                <linearGradient id="navLogoGradient" x1="0" y1="0" x2="40" y2="40">
                  <stop offset="0%" stop-color="#2563eb"/>
                  <stop offset="100%" stop-color="#1e40af"/>
                </linearGradient>
              </defs>
            </svg>
            <span class="logo-text">${t('dashboard.enterpriseBrand')}</span>
          </a>
        </div>
        <div class="nav-menu">
          <div id="language-switcher-container"></div>
          <div id="login-button-container"></div>
        </div>
      </div>
    `;

    this.navElement = nav;
    this._createLanguageSwitcher();
    this._setupLanguageChangeListener();
    return nav;
  }

  /**
   * Create language switcher button
   */
  _createLanguageSwitcher() {
    const container = this.navElement.querySelector('#language-switcher-container');
    if (!container) return;
    
    const switcher = document.createElement('button');
    switcher.className = 'language-switcher';
    
    // Initial display
    const currentLang = getCurrentLanguage();
    const nextLang = currentLang === 'en' ? 'ru' : 'en';
    switcher.innerHTML = `<span class="lang-code">${nextLang.toUpperCase()}</span>`;
    switcher.setAttribute('aria-label', `Switch to ${nextLang === 'en' ? 'English' : 'Русский'}`);
    switcher.setAttribute('title', `Switch to ${nextLang === 'en' ? 'English' : 'Русский'}`);
    
    // Click handler - determine next language dynamically on each click
    switcher.addEventListener('click', () => {
      const currentLang = getCurrentLanguage();
      const nextLang = currentLang === 'en' ? 'ru' : 'en';
      setLanguage(nextLang);
      // Update navigation immediately after language change
      this.update();
    });

    container.appendChild(switcher);
    this.languageSwitcher = switcher;
  }

  /**
   * Setup listener for language changes
   */
  _setupLanguageChangeListener() {
    // Remove previous listener if it exists
    if (this._languageChangeHandler) {
      window.removeEventListener('languagechange', this._languageChangeHandler);
    }
    
    // Create and store the handler
    this._languageChangeHandler = () => {
      this.update();
    };
    
    // Add the new listener
    window.addEventListener('languagechange', this._languageChangeHandler);
  }

  /**
   * Update navigation when language changes
   */
  update() {
    if (this.languageSwitcher) {
      const currentLang = getCurrentLanguage();
      const nextLang = currentLang === 'en' ? 'ru' : 'en';
      this.languageSwitcher.querySelector('.lang-code').textContent = nextLang.toUpperCase();
      this.languageSwitcher.setAttribute('aria-label', `Switch to ${nextLang === 'en' ? 'English' : 'Русский'}`);
      this.languageSwitcher.setAttribute('title', `Switch to ${nextLang === 'en' ? 'English' : 'Русский'}`);
    }
    
    // Update logo text
    if (this.navElement) {
      const logoText = this.navElement.querySelector('.logo-text');
      if (logoText) {
        logoText.textContent = t('dashboard.enterpriseBrand');
      }
    }
  }

  /**
   * Render navigation into container
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
   * Get login button container
   */
  getLoginButtonContainer() {
    if (this.navElement) {
      return this.navElement.querySelector('#login-button-container');
    }
    return null;
  }
}

