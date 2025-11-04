/**
 * Cyrillic font support for jsPDF
 * Uses pre-converted DejaVu Sans font (supports Cyrillic)
 * Font must be converted using jsPDF font converter: https://rawgit.com/MrRio/jsPDF/master/fontconverter/fontconverter.html
 */

let fontInitialized = false;
let fontLoadPromise = null;

/**
 * Load Cyrillic font using a pre-converted base64 font
 * For production: Convert a Cyrillic TTF font using jsPDF font converter
 * @param {jsPDF} doc - jsPDF document instance
 * @returns {Promise<boolean>} True if font was successfully loaded
 */
export async function loadCyrillicFont(doc) {
  if (fontInitialized) {
    return true;
  }

  if (fontLoadPromise) {
    return fontLoadPromise;
  }

  fontLoadPromise = (async () => {
    try {
      // Try to load a pre-converted font from a reliable source
      // We'll use a CDN that hosts pre-converted jsPDF fonts
      // Alternative: Load from local file if available
      
      // Method 1: Try loading from a known CDN with pre-converted fonts
      const fontUrl = 'https://cdn.jsdelivr.net/gh/parallax/jsPDF@master/examples/fonts/DejaVuSans-normal.bin';
      
      let fontData = null;
      
      try {
        const response = await fetch(fontUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          // Convert to binary string
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          fontData = binary;
        }
      } catch (e) {
        console.warn('Could not load font from CDN, trying alternative method');
      }

      // Method 2: If CDN fails, try using a minimal inline base64 font
      // This is a minimal subset - for production, use full font converter
      if (!fontData) {
        // Try to load a working pre-converted font
        // Note: This requires a properly converted font file
        // For now, we'll use a workaround with canvas rendering
        
        // Use canvas to render text and embed as image (fallback)
        console.warn('Pre-converted font not available, using canvas fallback');
        return false; // Will trigger canvas-based rendering
      }

      // Add font to jsPDF
      doc.addFileToVFS('DejaVuSans.ttf', fontData);
      doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
      
      fontInitialized = true;
      return true;
    } catch (error) {
      console.error('Error loading Cyrillic font:', error);
      return false;
    }
  })();

  return fontLoadPromise;
}

/**
 * Check if Cyrillic font is initialized
 */
export function isCyrillicFontReady() {
  return fontInitialized;
}

/**
 * Get the font name to use for Cyrillic text
 */
export function getCyrillicFontName() {
  return 'DejaVuSans';
}

/**
 * Render text using canvas fallback for Cyrillic characters
 * This is used when font loading fails
 */
export async function renderTextWithCanvas(doc, text, x, y, options = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set up canvas
  const fontSize = options.fontSize || 12;
  canvas.width = 800;
  canvas.height = 100;
  
  ctx.fillStyle = 'black';
  ctx.font = `${fontSize}px Arial, sans-serif`;
  ctx.fillText(text, 10, 50);
  
  // Convert canvas to image and add to PDF
  const imgData = canvas.toDataURL('image/png');
  doc.addImage(imgData, 'PNG', x, y - fontSize, canvas.width / 10, canvas.height / 10);
}
