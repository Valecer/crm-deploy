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
            <span class="logo-text">Enterprise Solutions</span>
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

