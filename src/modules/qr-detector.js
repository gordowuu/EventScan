/**
 * QR Code Detection Module
 * Lazy-loaded for performance - only imported when needed
 */

// jsQR is a UMD module, we load it and it attaches to window
let jsQRLoaded = false;

/**
 * Load jsQR library dynamically
 */
async function loadJsQR() {
  if (jsQRLoaded || typeof window.jsQR !== 'undefined') {
    jsQRLoaded = true;
    return;
  }

  // Dynamically load the script - Vite will handle this
  await import('../lib/jsqr.min.js');
  jsQRLoaded = true;
}

/**
 * Detect and extract QR codes from an image
 * @param {File} imageFile - The image file to scan
 * @returns {Promise<string[]>} - Array of detected URLs
 */
export async function detectQRCodes(imageFile) {
  // Ensure jsQR is loaded
  await loadJsQR();

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Scan for QR codes using jsQR library (attached to window by UMD)
        if (typeof window.jsQR !== 'undefined') {
          const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            // Check if it's a URL
            try {
              new URL(code.data);
              resolve([code.data]);
              return;
            } catch (e) {
              // Not a URL, ignore
            }
          }
        }

        resolve([]);
      };
      img.onerror = () => resolve([]);
    };
    reader.onerror = () => resolve([]);
  });
}

/**
 * Extract URL from QR code data
 * @param {string} qrData - Raw QR code data
 * @returns {string|null} - URL if valid, null otherwise
 */
export function extractURLFromQR(qrData) {
  try {
    new URL(qrData);
    return qrData;
  } catch (e) {
    return null;
  }
}
