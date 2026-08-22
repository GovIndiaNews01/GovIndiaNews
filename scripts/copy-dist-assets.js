import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');

if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

const assetsToCopy = [
  'script.min.js',
  'styles.min.css',
  'favicon.svg',
  'sitemap.xml',
  'rss.xml',
  'robots.txt',
  'ads.txt',
  'CNAME'
];

assetsToCopy.forEach(file => {
  const src = path.join(ROOT_DIR, file);
  const dest = path.join(DIST_DIR, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
});

// Copy images directory if exists
const srcImages = path.join(ROOT_DIR, 'images');
const destImages = path.join(DIST_DIR, 'images');
if (fs.existsSync(srcImages)) {
  if (!fs.existsSync(destImages)) {
    fs.mkdirSync(destImages, { recursive: true });
  }
  const files = fs.readdirSync(srcImages);
  files.forEach(f => {
    fs.copyFileSync(path.join(srcImages, f), path.join(destImages, f));
  });
}

console.log('Copied all production static assets to dist/.');
