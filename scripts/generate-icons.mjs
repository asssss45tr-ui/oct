import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
const svgBuffer = fs.readFileSync(path.join(publicDir, 'icon.svg'));

async function generate() {
  console.log('Generating PWA icons...');
  // 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));

  // 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  // Apple Touch Icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // Maskable icon with 15% safe padding
  await sharp(svgBuffer)
    .resize(410, 410)
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: { r: 15, g: 23, b: 42, alpha: 1 }
    })
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-maskable.png'));

  console.log('Icons generated successfully!');
}

generate().catch(console.error);
