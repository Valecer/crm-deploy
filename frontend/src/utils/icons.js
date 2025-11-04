/**
 * Icon utilities for creating simple 2-color SVG icons
 */

/**
 * Get CSS variable value
 * @param {string} varName - CSS variable name (e.g., '--color-primary')
 * @returns {string} CSS variable value
 */
function getCSSVariable(varName) {
  if (typeof document === 'undefined') {
    // Fallback for SSR
    return varName === '--color-primary' ? '#2563eb' : '#64748b';
  }
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim() || (varName === '--color-primary' ? '#2563eb' : '#64748b');
}

/**
 * Create a simple 2-color SVG icon
 * @param {string} iconName - Name of the icon
 * @param {string} primaryColor - Primary color (optional, defaults to CSS variable)
 * @param {string} secondaryColor - Secondary color (optional, defaults to CSS variable)
 * @param {string} serviceId - Service ID for service-specific SVG structure
 * @returns {string} SVG string
 */
export function createIcon(iconName, primaryColor = null, secondaryColor = null, serviceId = null) {
  // Use CSS variables if colors not provided
  const primary = primaryColor || getCSSVariable('--color-primary');
  const secondary = secondaryColor || getCSSVariable('--color-secondary');
  
  // Service-specific SVG structures for animations
  if (serviceId === 'server-deployment') {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect class="server-line server-line-1" x="3" y="4" width="18" height="3" rx="1" fill="${primary}" opacity="0"/>
      <rect class="server-line server-line-2" x="3" y="10" width="18" height="3" rx="1" fill="${primary}" opacity="0"/>
      <rect class="server-line server-line-3" x="3" y="16" width="18" height="3" rx="1" fill="${primary}" opacity="0"/>
      <circle class="server-dot server-dot-1" cx="6" cy="5.5" r="0.8" fill="${secondary}" opacity="0"/>
      <circle class="server-dot server-dot-2" cx="6" cy="11.5" r="0.8" fill="${secondary}" opacity="0"/>
      <circle class="server-dot server-dot-3" cx="6" cy="17.5" r="0.8" fill="${secondary}" opacity="0"/>
    </svg>`;
  }
  
  if (serviceId === 'cloud-migration') {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path class="cloud-shape" d="M18 10h-1.26A6 6 0 1 0 9 20h9a4 4 0 0 0 0-8z" fill="${primary}" opacity="0.2"/>
      <path class="cloud-shape" d="M18 10h-1.26A6 6 0 1 0 9 20h9a4 4 0 0 0 0-8z" stroke="${primary}" stroke-width="2" fill="none"/>
      <circle class="cloud-dot" cx="12" cy="14" r="1.5" fill="${secondary}"/>
    </svg>`;
  }
  
  if (serviceId === 'infrastructure-management') {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle class="settings-center" cx="12" cy="12" r="3" stroke="${primary}" stroke-width="2" fill="none"/>
      <path class="settings-line" d="M12 2v6m0 8v6M22 12h-6m-8 0H2M19.071 4.929l-4.243 4.243m0 2.828l4.243 4.243M4.929 4.929l4.243 4.243m0 2.828l-4.243 4.243" stroke="${primary}" stroke-width="1.5"/>
    </svg>`;
  }
  
  if (serviceId === 'support') {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path class="shield-shape" d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" fill="${primary}" opacity="0.2"/>
      <path class="shield-shape" d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" stroke="${primary}" stroke-width="2" fill="none"/>
      <path class="shield-check" d="M9 12l2 2 4-4" stroke="${secondary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke-dasharray="8" stroke-dashoffset="8"/>
    </svg>`;
  }
  
  if (serviceId === 'security') {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect class="lock-body" x="5" y="11" width="14" height="10" rx="2" fill="${primary}" opacity="0.2"/>
      <rect class="lock-body" x="5" y="11" width="14" height="10" rx="2" stroke="${primary}" stroke-width="2" fill="none"/>
      <path class="lock-arch" d="M9 11V7a3 3 0 0 1 6 0v4" stroke="${primary}" stroke-width="2" stroke-linecap="round" fill="none"/>
      <circle class="lock-keyhole" cx="12" cy="16" r="1.5" fill="${secondary}"/>
    </svg>`;
  }
  
  if (serviceId === 'backup-disaster') {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse class="database-top" cx="12" cy="5" rx="8" ry="3" fill="${primary}" opacity="0.2"/>
      <ellipse class="database-top" cx="12" cy="5" rx="8" ry="3" stroke="${primary}" stroke-width="2" fill="none"/>
      <path class="database-side" d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" stroke="${primary}" stroke-width="2" fill="none"/>
      <ellipse class="database-middle" cx="12" cy="12" rx="8" ry="3" stroke="${primary}" stroke-width="2" fill="none"/>
      <ellipse class="database-bottom" cx="12" cy="19" rx="8" ry="3" stroke="${primary}" stroke-width="2" fill="none"/>
      <line class="database-line-left" x1="4" y1="5" x2="4" y2="19" stroke="${primary}" stroke-width="1.5"/>
      <line class="database-line-right" x1="20" y1="5" x2="20" y2="19" stroke="${primary}" stroke-width="1.5"/>
      <rect class="database-fill-1" x="4" y="15" width="16" height="4" rx="2" fill="${primary}" opacity="0.4"/>
      <rect class="database-fill-2" x="4" y="11" width="16" height="4" rx="2" fill="${primary}" opacity="0.5"/>
      <rect class="database-fill-3" x="4" y="5" width="16" height="6" rx="2" fill="${primary}" opacity="0.6"/>
    </svg>`;
  }
  
  if (serviceId === 'consulting') {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect class="chart-bar chart-bar-1" x="3" y="18" width="4" height="3" rx="1" fill="${primary}"/>
      <rect class="chart-bar chart-bar-2" x="8" y="13" width="4" height="8" rx="1" fill="${primary}"/>
      <rect class="chart-bar chart-bar-3" x="13" y="9" width="4" height="12" rx="1" fill="${primary}"/>
      <rect class="chart-bar chart-bar-4" x="18" y="5" width="4" height="16" rx="1" fill="${primary}"/>
      <line class="chart-line chart-line-1" x1="3" y1="18" x2="7" y2="18" stroke="${secondary}" stroke-width="1.5"/>
      <line class="chart-line chart-line-2" x1="8" y1="13" x2="12" y2="13" stroke="${secondary}" stroke-width="1.5"/>
      <line class="chart-line chart-line-3" x1="13" y1="9" x2="17" y2="9" stroke="${secondary}" stroke-width="1.5"/>
      <line class="chart-line chart-line-4" x1="18" y1="5" x2="22" y2="5" stroke="${secondary}" stroke-width="1.5"/>
    </svg>`;
  }
  
  // Default icons for other services
  const icons = {
    'pencil': `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="${primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="${secondary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`,
    'server': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="3" rx="1" fill="${primary}"/>
      <rect x="3" y="10" width="18" height="3" rx="1" fill="${primary}"/>
      <rect x="3" y="16" width="18" height="3" rx="1" fill="${primary}"/>
      <circle cx="6" cy="5.5" r="0.8" fill="${secondary}"/>
      <circle cx="6" cy="11.5" r="0.8" fill="${secondary}"/>
      <circle cx="6" cy="17.5" r="0.8" fill="${secondary}"/>
    </svg>`,
    'cloud': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 10h-1.26A6 6 0 1 0 9 20h9a4 4 0 0 0 0-8z" fill="${primary}" opacity="0.2"/>
      <path d="M18 10h-1.26A6 6 0 1 0 9 20h9a4 4 0 0 0 0-8z" stroke="${primary}" stroke-width="2" fill="none"/>
      <circle cx="12" cy="14" r="1.5" fill="${secondary}"/>
    </svg>`,
    'settings': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" stroke="${primary}" stroke-width="2" fill="none"/>
      <path d="M12 2v6m0 8v6M22 12h-6m-8 0H2M19.071 4.929l-4.243 4.243m0 2.828l4.243 4.243M4.929 4.929l4.243 4.243m0 2.828l-4.243 4.243" stroke="${primary}" stroke-width="1.5"/>
    </svg>`,
    'shield': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" fill="${primary}" opacity="0.2"/>
      <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" stroke="${primary}" stroke-width="2" fill="none"/>
      <path d="M9 12l2 2 4-4" stroke="${secondary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`,
    'refresh': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="${primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M21 3v5h-5" stroke="${primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="${secondary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M8 16H3v-5" stroke="${secondary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`,
    'lock': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="11" width="14" height="10" rx="2" fill="${primary}" opacity="0.2"/>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="${primary}" stroke-width="2" fill="none"/>
      <path d="M9 11V7a3 3 0 0 1 6 0v4" stroke="${primary}" stroke-width="2" stroke-linecap="round" fill="none"/>
      <circle cx="12" cy="16" r="1.5" fill="${secondary}"/>
    </svg>`,
    'database': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="12" cy="5" rx="8" ry="3" fill="${primary}" opacity="0.2"/>
      <ellipse cx="12" cy="5" rx="8" ry="3" stroke="${primary}" stroke-width="2" fill="none"/>
      <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" stroke="${primary}" stroke-width="2" fill="none"/>
      <ellipse cx="12" cy="12" rx="8" ry="3" stroke="${primary}" stroke-width="2" fill="none"/>
      <ellipse cx="12" cy="19" rx="8" ry="3" stroke="${primary}" stroke-width="2" fill="none"/>
      <line x1="4" y1="5" x2="4" y2="19" stroke="${secondary}" stroke-width="1.5"/>
      <line x1="20" y1="5" x2="20" y2="19" stroke="${secondary}" stroke-width="1.5"/>
    </svg>`,
    'chart': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="18" width="4" height="3" rx="1" fill="${primary}"/>
      <rect x="8" y="13" width="4" height="8" rx="1" fill="${primary}"/>
      <rect x="13" y="9" width="4" height="12" rx="1" fill="${primary}"/>
      <rect x="18" y="5" width="4" height="16" rx="1" fill="${primary}"/>
      <line x1="3" y1="18" x2="7" y2="18" stroke="${secondary}" stroke-width="1.5"/>
      <line x1="8" y1="13" x2="12" y2="13" stroke="${secondary}" stroke-width="1.5"/>
      <line x1="13" y1="9" x2="17" y2="9" stroke="${secondary}" stroke-width="1.5"/>
      <line x1="18" y1="5" x2="22" y2="5" stroke="${secondary}" stroke-width="1.5"/>
    </svg>`
  };
  
  return icons[iconName] || icons['server'];
}

/**
 * Map emoji icon names to icon names
 */
export const iconMap = {
  '🖥️': 'server',
  '☁️': 'cloud',
  '⚙️': 'settings',
  '🛡️': 'shield',
  '🔄': 'refresh',
  '🔒': 'lock',
  '💾': 'database',
  '📊': 'chart'
};

