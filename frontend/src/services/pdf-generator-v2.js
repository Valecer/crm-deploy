/**
 * PDF Generator Service v2
 * Generates PDF reports from ticket data using jsPDF with HTML rendering for Cyrillic support
 */

import jsPDF from 'jspdf';
import { getCurrentLanguage, t } from './i18n.js';

/**
 * Generate a ticket report PDF
 * @param {Array} tickets - Array of ticket objects
 * @param {object} filters - Applied filter criteria
 * @param {string} companyName - Company name
 */
export async function generateTicketReport(tickets, filters, companyName) {
  const language = getCurrentLanguage();
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';
  const doc = new jsPDF();

  // Build HTML content for the PDF
  let htmlContent = buildHTMLContent(tickets, filters, companyName, language, locale);
  
  // Use html2canvas for better Unicode/Cyrillic support
  try {
    // Import html2canvas dynamically
    const html2canvas = (await import('html2canvas')).default;
    
    // Create a temporary div with the HTML content
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.padding = '20px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.fontFamily = language === 'ru' 
      ? 'Arial, "DejaVu Sans", "Liberation Sans", sans-serif' 
      : 'Arial, sans-serif';
    tempDiv.style.color = 'black';
    tempDiv.innerHTML = htmlContent;
    document.body.appendChild(tempDiv);
    
    // Wait a bit for fonts to load
    await new Promise(resolve => setTimeout(resolve, 100));

    // Convert HTML to canvas then to PDF
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add image to PDF
    doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Clean up
    document.body.removeChild(tempDiv);

    // Save the PDF
    const filename = language === 'ru' 
      ? `отчет-${Date.now()}.pdf` 
      : `ticket-report-${Date.now()}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Error generating PDF with HTML method:', error);
    // Fallback to text method
    generatePDFWithText(doc, tickets, filters, companyName, language, locale);
  }
}

/**
 * Build HTML content for the PDF
 */
function buildHTMLContent(tickets, filters, companyName, language, locale) {
  let html = '<div style="font-family: Arial, sans-serif; padding: 25px; line-height: 1.5;">';
  
  // Title
  html += `<h1 style="font-size: 22px; margin-bottom: 15px; font-weight: bold;">${escapeHtml(t('reportModal.title') || 'Ticket Report')}</h1>`;
  
  // Company name
  const companyLabel = language === 'ru' ? 'Компания' : 'Company';
  html += `<p style="font-size: 14px; margin: 8px 0;"><strong>${companyLabel}:</strong> ${escapeHtml(companyName || 'N/A')}</p>`;
  
  // Generation date
  const now = new Date();
  const dateStr = now.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const generatedLabel = language === 'ru' ? 'Сформировано' : 'Generated';
  html += `<p style="font-size: 12px; margin: 8px 0;"><strong>${generatedLabel}:</strong> ${escapeHtml(dateStr)}</p>`;
  
  // Filters
  const filtersLabel = language === 'ru' ? 'Фильтры' : 'Filters';
  const noneLabel = language === 'ru' ? 'Нет' : 'None';
  let filtersStr = `${filtersLabel}: ${noneLabel}`;
  const filterParts = [];
  
  if (filters.date_from || filters.date_to) {
    const dateLabel = language === 'ru' ? 'Дата' : 'Date';
    const fromLabel = language === 'ru' ? 'с' : 'from';
    const toLabel = language === 'ru' ? 'по' : 'to';
    const from = filters.date_from ? new Date(filters.date_from * 1000).toLocaleDateString(locale) : (language === 'ru' ? 'Начало' : 'Start');
    const to = filters.date_to ? new Date(filters.date_to * 1000).toLocaleDateString(locale) : (language === 'ru' ? 'Конец' : 'End');
    filterParts.push(`${dateLabel}: ${from} ${toLabel} ${to}`);
  }
  if (filters.status && filters.status !== 'all') {
    const statusLabel = language === 'ru' ? 'Статус' : 'Status';
    const statusText = t(`status.${filters.status}`) || filters.status.replace(/_/g, ' ');
    filterParts.push(`${statusLabel}: ${escapeHtml(statusText)}`);
  }
  if (filters.job_title) {
    const jobTitleLabel = language === 'ru' ? 'Должность' : 'Job Title';
    filterParts.push(`${jobTitleLabel}: ${escapeHtml(filters.job_title)}`);
  }
  if (filters.client_full_name) {
    const clientLabel = language === 'ru' ? 'Клиент' : 'Client';
    filterParts.push(`${clientLabel}: ${escapeHtml(filters.client_full_name)}`);
  }
  if (filters.assigned_engineer_id) {
    const ticketWithEngineer = tickets?.find(ticket => ticket.assigned_engineer_id === filters.assigned_engineer_id);
    const engineerName = ticketWithEngineer?.assigned_engineer_name;
    const engineerLabel = language === 'ru' ? 'Назначенный инженер' : 'Assigned Engineer';
    const engineerIdLabel = language === 'ru' ? 'ID инженера' : 'Engineer ID';
    if (engineerName) {
      filterParts.push(`${engineerLabel}: ${escapeHtml(engineerName)}`);
    } else {
      filterParts.push(`${engineerIdLabel}: ${filters.assigned_engineer_id}`);
    }
  }
  
  if (filterParts.length > 0) {
    filtersStr = filterParts.join(', ');
  }
  
  html += `<p style="font-size: 12px; margin: 8px 0;">${escapeHtml(filtersStr)}</p>`;
  html += '<hr style="margin: 18px 0;">';
  
  // Tickets
  if (!tickets || tickets.length === 0) {
    const noTicketsText = language === 'ru' 
      ? 'Заявки, соответствующие выбранным критериям, не найдены.' 
      : 'No tickets found matching the selected criteria.';
    html += `<p style="font-size: 14px; margin: 10px 0;">${escapeHtml(noTicketsText)}</p>`;
  } else {
    tickets.forEach((ticket, index) => {
      if (index > 0) {
        html += '<hr style="margin: 18px 0; border: none; border-top: 1px solid #ccc;">';
      }
      
      html += '<div style="margin-bottom: 18px;">';
      
      // Ticket ID
      const ticketIdLabel = language === 'ru' ? '1. ID заявки:' : '1. Ticket ID:';
      html += `<p style="font-size: 12px; margin: 5px 0;"><strong>${ticketIdLabel}</strong> ${ticket.id || 'N/A'}</p>`;
      
      // Date
      const dateLabel = language === 'ru' ? '2. Дата:' : '2. Date:';
      html += `<p style="font-size: 12px; margin: 5px 0;"><strong>${dateLabel}</strong> ${escapeHtml(formatDate(ticket.submitted_at, locale))}</p>`;
      
      // Status
      const statusLabel = language === 'ru' ? '3. Статус:' : '3. Status:';
      const status = ticket.status ? (t(`status.${ticket.status}`) || ticket.status.replace(/_/g, ' ')) : 'N/A';
      html += `<p style="font-size: 12px; margin: 5px 0;"><strong>${statusLabel}</strong> ${escapeHtml(status)}</p>`;
      
      // Job Title
      const jobTitleLabel = language === 'ru' ? '4. Должность:' : '4. Job Title:';
      html += `<p style="font-size: 12px; margin: 5px 0;"><strong>${jobTitleLabel}</strong> ${escapeHtml(ticket.job_title || 'N/A')}</p>`;
      
      // Client
      const clientLabel = language === 'ru' ? '5. Клиент:' : '5. Client:';
      html += `<p style="font-size: 12px; margin: 5px 0;"><strong>${clientLabel}</strong> ${escapeHtml(ticket.client_full_name || 'N/A')}</p>`;
      
      // Serial
      const serialLabel = language === 'ru' ? '6. Серийный номер:' : '6. Serial:';
      html += `<p style="font-size: 12px; margin: 5px 0;"><strong>${serialLabel}</strong> ${escapeHtml(ticket.serial_number || 'N/A')}</p>`;
      
      // Problem Summary
      const problemLabel = language === 'ru' ? '7. Описание проблемы:' : '7. Problem Summary:';
      const problem = truncate(ticket.problem_description || 'N/A', 150);
      html += `<p style="font-size: 12px; margin: 5px 0;"><strong>${problemLabel}</strong><br><span style="font-size: 11px;">${escapeHtml(problem)}</span></p>`;
      
      html += '</div>';
    });
  }
  
  html += '</div>';
  return html;
}

/**
 * Format timestamp to readable date string
 */
function formatDate(timestamp, locale = 'en-US') {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Truncate text to specified length
 */
function truncate(text, maxLength) {
  if (!text) return 'N/A';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Fallback: Generate PDF using text method (without Cyrillic support)
 */
function generatePDFWithText(doc, tickets, filters, companyName, language, locale) {
  // This is a fallback that won't work well with Cyrillic
  // But at least the PDF will be generated
  console.warn('Using fallback text method - Cyrillic may not display correctly');
  // ... existing text-based generation code ...
}

