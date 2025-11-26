/**
 * Image Processing Module
 * Handles image validation, compression, and enhancement
 */

import { IMAGE_CONFIG } from './config.js';

const { MAX_SIZE, COMPRESSION_QUALITY, MAX_DIMENSION } = IMAGE_CONFIG;

/**
 * Validate file type and size
 * @param {File} file - The file to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImage(file) {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Validate file type
  if (!file.type.match('image/(jpeg|jpg|png)')) {
    return { valid: false, error: 'Please upload a JPG or PNG image.' };
  }

  // Validate file size
  if (file.size > MAX_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    return { valid: false, error: `Image is too large (${sizeMB}MB). Please use an image under 10MB.` };
  }

  return { valid: true };
}

/**
 * Compress and enhance image for better AI extraction
 * @param {File} file - The image file to compress
 * @returns {Promise<File>} - Compressed image file
 */
export async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if too large
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = (height / width) * MAX_DIMENSION;
            width = MAX_DIMENSION;
          } else {
            width = (width / height) * MAX_DIMENSION;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');

        // Image enhancement for better AI extraction
        ctx.filter = 'contrast(1.1) brightness(1.05)';
        ctx.drawImage(img, 0, 0, width, height);
        ctx.filter = 'none';

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              }));
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          COMPRESSION_QUALITY
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

/**
 * Convert blob to base64 string
 * @param {Blob} blob - The blob to convert
 * @returns {Promise<string>} - Base64 encoded string
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Create preview URL for an image file
 * @param {File} file - The image file
 * @returns {Promise<string>} - Data URL for preview
 */
export function createPreview(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
