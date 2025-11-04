/**
 * PDF Generator Service
 * Generates PDF reports from ticket data using jsPDF
 * Uses HTML-based rendering for proper Cyrillic/Unicode support
 */

import { generateTicketReport as generateTicketReportHTML } from './pdf-generator-v2.js';

/**
 * Generate a ticket report PDF
 * @param {Array} tickets - Array of ticket objects
 * @param {object} filters - Applied filter criteria
 * @param {string} companyName - Company name
 */
export async function generateTicketReport(tickets, filters, companyName) {
  // Use HTML-based generation for better Cyrillic support
  // HTML rendering properly handles Unicode/Cyrillic characters
  // This method uses html2canvas which properly renders Cyrillic text
  return generateTicketReportHTML(tickets, filters, companyName);
}
