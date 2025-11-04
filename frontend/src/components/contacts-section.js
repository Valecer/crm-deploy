/**
 * Contacts Section Component
 * Displays contact information and contact form
 */

import { ContactForm } from './contact-form.js';
import { t } from '../services/i18n.js';

export class ContactsSection {
  constructor(options = {}) {
    this.id = options.id || `contacts-section-${Math.random().toString(36).substr(2, 9)}`;
    this.type = 'contacts';
    this.title = options.title || 'Contact Us';
    this.subtitle = options.subtitle || '';
    this.contactInfo = options.contactInfo || {};
    this.form = options.form || {};
    this.backgroundColor = options.backgroundColor || 'var(--bg-secondary)';
    this.textColor = options.textColor || 'var(--text-primary)';
    this.sectionElement = null;
    this.contactForm = null;
  }

  /**
   * Create contacts section element
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

    sectionHTML += '<div class="content-section-body contacts-content">';
    sectionHTML += '<div class="contacts-layout">';
    
    // Contact information
    sectionHTML += '<div class="contact-info">';
    sectionHTML += this._createContactInfo();
    sectionHTML += '</div>';

    // Contact form
    sectionHTML += '<div class="contact-form-wrapper">';
    sectionHTML += `<div id="${this.id}-form-container"></div>`;
    sectionHTML += '</div>';

    sectionHTML += '</div></div></div>';

    section.innerHTML = sectionHTML;
    this.sectionElement = section;

    return section;
  }

  /**
   * Create contact information HTML
   */
  _createContactInfo() {
    let html = '<div class="contact-info-content">';

    if (this.contactInfo.address) {
      html += '<div class="contact-info-item">';
      html += `<h3>${this._escapeHtml(t('contacts.labels.address'))}</h3>`;
      html += '<address>';
      if (this.contactInfo.address.street) {
        html += `<div>${this._escapeHtml(this.contactInfo.address.street)}</div>`;
      }
      const addressParts = [];
      if (this.contactInfo.address.city) addressParts.push(this.contactInfo.address.city);
      if (this.contactInfo.address.state) addressParts.push(this.contactInfo.address.state);
      if (this.contactInfo.address.zip) addressParts.push(this.contactInfo.address.zip);
      if (addressParts.length > 0) {
        html += `<div>${this._escapeHtml(addressParts.join(', '))}</div>`;
      }
      if (this.contactInfo.address.country) {
        html += `<div>${this._escapeHtml(this.contactInfo.address.country)}</div>`;
      }
      html += '</address>';
      html += '</div>';
    }

    if (this.contactInfo.phone) {
      html += '<div class="contact-info-item">';
      html += `<h3>${this._escapeHtml(t('contacts.labels.phone'))}</h3>`;
      html += `<p><a href="tel:${this._escapeHtml(this.contactInfo.phone.replace(/[^\d+]/g, ''))}">${this._escapeHtml(this.contactInfo.phone)}</a></p>`;
      html += '</div>';
    }

    if (this.contactInfo.email) {
      html += '<div class="contact-info-item">';
      html += `<h3>${this._escapeHtml(t('contacts.labels.email'))}</h3>`;
      html += `<p><a href="mailto:${this._escapeHtml(this.contactInfo.email)}">${this._escapeHtml(this.contactInfo.email)}</a></p>`;
      html += '</div>';
    }

    if (this.contactInfo.officeHours) {
      html += '<div class="contact-info-item">';
      html += `<h3>${this._escapeHtml(t('contacts.labels.officeHours'))}</h3>`;
      html += `<p>${this._escapeHtml(this.contactInfo.officeHours)}</p>`;
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  /**
   * Initialize contact form
   */
  _initContactForm() {
    if (!this.sectionElement || !this.form) return;

    const formContainer = this.sectionElement.querySelector(`#${this.id}-form-container`);
    if (!formContainer) return;

    this.contactForm = new ContactForm({
      id: this.form.id || 'contact-form',
      endpoint: this.form.endpoint || '/api/contact',
      fields: this.form.fields || {}
    });

    this.contactForm.render(formContainer);
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

