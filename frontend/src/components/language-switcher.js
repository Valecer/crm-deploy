/**
 * Language Switcher Component
 * Standalone component for switching languages in login and dashboard pages
 */

import { getCurrentLanguage, setLanguage, t } from '../services/i18n.js';

/**
 * Create and render language switcher
 * @param {HTMLElement} container - Container element to render into
 * @param {Function} onLanguageChange - Optional callback when language changes
 * @returns {Function} Update function to refresh the switcher
 */
export function createLanguageSwitcher(container, onLanguageChange = null) {
  let currentSwitcher = null;
  let languageChangeHandler = null;

  /**
   * Update language switcher UI
   */
  function updateSwitcher() {
    const currentLang = getCurrentLanguage();
    const nextLang = currentLang === 'en' ? 'ru' : 'en';
    const langLabel = nextLang === 'en' ? 'English' : 'Русский';
    
    if (currentSwitcher) {
      const langCode = currentSwitcher.querySelector('.lang-code');
      if (langCode) {
        langCode.textContent = nextLang.toUpperCase();
      } else {
        // First time initialization
        currentSwitcher.innerHTML = `<span class="lang-code">${nextLang.toUpperCase()}</span>`;
      }
      currentSwitcher.setAttribute('aria-label', `Switch to ${langLabel}`);
      currentSwitcher.setAttribute('title', `Switch to ${langLabel}`);
    }
  }

  /**
   * Handle language switch
   */
  function handleLanguageSwitch() {
    const currentLang = getCurrentLanguage();
    const nextLang = currentLang === 'en' ? 'ru' : 'en';
    
    if (setLanguage(nextLang)) {
      updateSwitcher();
      
      if (onLanguageChange) {
        onLanguageChange(nextLang);
      }
    }
  }

  /**
   * Initialize switcher
   */
  function init() {
    // Remove previous listener if it exists
    if (languageChangeHandler) {
      window.removeEventListener('languagechange', languageChangeHandler);
    }
    
    // Create switcher button
    const switcher = document.createElement('button');
    switcher.className = 'language-switcher';
    switcher.setAttribute('type', 'button');
    
    currentSwitcher = switcher;
    updateSwitcher();
    
    switcher.addEventListener('click', handleLanguageSwitch);
    
    // Listen for language changes from other sources
    languageChangeHandler = updateSwitcher;
    window.addEventListener('languagechange', languageChangeHandler);
    
    container.innerHTML = '';
    container.appendChild(switcher);
  }

  init();

  // Return update function
  return updateSwitcher;
}

