/**
 * Login Button Component
 * Creates login button with navigation and styling
 */

export class LoginButton {
  constructor(options = {}) {
    this.text = options.text || 'Login';
    this.href = options.href || '/src/pages/login.html';
    this.ariaLabel = options.ariaLabel || 'Navigate to login page';
    this.buttonElement = null;
  }

  /**
   * Create login button element
   */
  create() {
    const button = document.createElement('a');
    button.href = this.href;
    button.className = 'login-button';
    button.setAttribute('role', 'button');
    button.setAttribute('aria-label', this.ariaLabel);
    button.textContent = this.text;

    // Add keyboard navigation support
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        button.click();
      }
    });

    // Add click handler
    button.addEventListener('click', (e) => {
      // Navigation will be handled by browser for anchor tag
      // Can add analytics or additional logic here if needed
    });

    this.buttonElement = button;
    return button;
  }

  /**
   * Render login button into container
   */
  render(container) {
    if (!this.buttonElement) {
      this.create();
    }

    if (typeof container === 'string') {
      container = document.querySelector(container);
    }

    if (container) {
      container.appendChild(this.buttonElement);
      return this.buttonElement;
    }

    return null;
  }
}

