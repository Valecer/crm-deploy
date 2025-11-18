/**
 * Content Section Component
 * Creates content sections for services/features display
 */

import { createIcon, iconMap } from '../utils/icons.js';
import { t } from '../services/i18n.js';

export class ContentSection {
  constructor(options = {}) {
    this.id = options.id || `content-section-${Math.random().toString(36).substr(2, 9)}`;
    this.type = options.type || 'services'; // services, features, about, services, customers, partners, contacts
    this.title = options.title || '';
    this.subtitle = options.subtitle || '';
    this.content = options.content || '';
    this.backgroundColor = options.backgroundColor || 'var(--bg-secondary)';
    this.textColor = options.textColor || 'var(--text-primary)';
    this.sectionElement = null;
  }

  /**
   * Create content section element
   */
  create() {
    const section = document.createElement('section');
    section.id = this.id;
    section.className = `content-section content-section-${this.type}`;
    section.setAttribute('role', 'region');
    section.setAttribute('aria-labelledby', `${this.id}-title`);
    section.setAttribute('data-animate', 'true'); // Enable scroll animations
    
    section.style.backgroundColor = this.backgroundColor;
    section.style.color = this.textColor;

    let sectionHTML = '<div class="content-section-container">';

    if (this.title) {
      sectionHTML += `<header class="content-section-header">
        <h2 id="${this.id}-title" class="content-section-title">${this.title}</h2>
        ${this.subtitle ? `<p class="content-section-subtitle">${this.subtitle}</p>` : ''}
      </header>`;
    }

    // Handle different content types
    if (this.type === 'about') {
      sectionHTML += this._createAboutContent();
    } else if (this.type === 'services') {
      sectionHTML += this._createServicesContent();
    } else if (this.content) {
      sectionHTML += `<div class="content-section-body">
        ${typeof this.content === 'string' ? this.content : ''}
      </div>`;
    }

    sectionHTML += '</div>';

    section.innerHTML = sectionHTML;
    this.sectionElement = section;
    return section;
  }

  /**
   * Create About Company section content
   */
  _createAboutContent() {
    const content = this.content;
    if (!content || typeof content !== 'object') {
      return '<div class="content-section-body"></div>';
    }

    let html = '<div class="content-section-body about-content">';
    
    if (content.background) {
      html += `<div class="about-background"><p>${this._escapeHtml(content.background)}</p></div>`;
    }

    if (content.mission) {
      const missionTitle = content.missionTitle || t('about.missionTitle');
      html += `<div class="about-mission"><h3>${this._escapeHtml(missionTitle)}</h3><p>${this._escapeHtml(content.mission)}</p></div>`;
    }

    if (content.values && Array.isArray(content.values)) {
      const valuesTitle = content.valuesTitle || t('about.valuesTitle');
      html += `<div class="about-values"><h3>${this._escapeHtml(valuesTitle)}</h3><div class="values-bento-grid">`;
      content.values.forEach((value, index) => {
        // All cards span 4 columns for two-line layout (3 cards per row)
        let spanClass = 'values-bento-card-small'; // spans 4 columns
        html += `<div class="values-bento-card ${spanClass}">${this._escapeHtml(value)}</div>`;
      });
      html += '</div></div>';
    }

    if (content.history) {
      const historyTitle = content.historyTitle || t('about.historyTitle');
      html += `<div class="about-history"><h3>${this._escapeHtml(historyTitle)}</h3><p>${this._escapeHtml(content.history)}</p></div>`;
    }

    html += '</div>';
    return html;
  }

  /**
   * Create Services section content with uniform grid layout
   */
  _createServicesContent() {
    const services = this.content?.services || this.content;
    if (!services || !Array.isArray(services)) {
      return '<div class="content-section-body"></div>';
    }

    let html = '<div class="content-section-body services-grid">';
    
    services.forEach((service) => {
      html += `<div class="service-card">`;
      html += '<div class="service-card-content">';
      
      if (service.icon) {
        // Use SVG icons - convert emoji to icon name if needed
        // Add service-specific class for custom animations
        const iconClass = `service-icon-${service.id}`;
        html += `<div class="service-card-icon ${iconClass}">${this._createIconSVG(service.icon, service.id)}</div>`;
      }
      
      if (service.title) {
        html += `<h3 class="service-card-title">${this._escapeHtml(service.title)}</h3>`;
      }
      
      if (service.description) {
        html += `<p class="service-card-description">${this._escapeHtml(service.description)}</p>`;
      }
      
      if (service.features && Array.isArray(service.features)) {
        html += '<ul class="service-card-features">';
        service.features.forEach(feature => {
          html += `<li>${this._escapeHtml(feature)}</li>`;
        });
        html += '</ul>';
      }
      
      html += '</div>';
      html += '</div>';
    });

    html += '</div>';
    return html;
  }

  /**
   * Create SVG icon from emoji or icon name
   */
  _createIconSVG(icon, serviceId = null) {
    // If icon is an emoji, convert to icon name
    const iconName = iconMap[icon] || icon;
    // Get primary and secondary colors from CSS variables
    return createIcon(iconName, null, null, serviceId);
  }

  /**
   * Escape HTML to prevent XSS
   */
  _escapeHtml(text) {
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

