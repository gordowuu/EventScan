/**
 * Generate PWA icons from source image
 * Run with: node scripts/generate-icons.js
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SOURCE_ICON = join(__dirname, '../public/icons/source-icon.png');
const FALLBACK_ICON = join(__dirname, '../public/icons/icon-144x144.png');
const OUTPUT_DIR = join(__dirname, '../public/icons');

// Icon sizes required for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let sourcePath = SOURCE_ICON;
  // Check if source exists
  if (!existsSync(SOURCE_ICON)) {
    if (existsSync(FALLBACK_ICON)) {
        console.log('⚠️  High-res source-icon.png not found, using icon-144x144.png as fallback.');
        sourcePath = FALLBACK_ICON;
    } else {
        console.error('❌ Source icon not found. Please place a high-res icon at:', SOURCE_ICON);
        process.exit(1);
    }
  }

  // Generate each size
  for (const size of ICON_SIZES) {
    const outputPath = join(OUTPUT_DIR, `icon-${size}x${size}.png`);

    try {
      await sharp(sourcePath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Failed to generate ${size}x${size}:`, error.message);
    }
  }

  // Generate maskable icon (512x512 with padding for safe zone)
  try {
    const maskableOutput = join(OUTPUT_DIR, 'icon-512x512-maskable.png');

    // For maskable icons, the safe zone is the center 80%
    // So we resize to 80% and add padding
    const safeSize = Math.floor(512 * 0.8); // 409px
    const padding = Math.floor((512 - safeSize) / 2); // ~51px

    await sharp(sourcePath)
      .resize(safeSize, safeSize, {
        fit: 'contain',
        background: { r: 15, g: 23, b: 42, alpha: 1 }
      })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 15, g: 23, b: 42, alpha: 1 }
      })
      .resize(512, 512) // Ensure exact size after extend
      .png()
      .toFile(maskableOutput);

    console.log(`✅ Generated: icon-512x512-maskable.png`);
  } catch (error) {
    console.error('❌ Failed to generate maskable icon:', error.message);
  }

  console.log('\n🎉 Icon generation complete!');
}

generateIcons().catch(console.error);
