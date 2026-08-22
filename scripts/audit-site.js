import fs from 'fs';
import path from 'path';
import { SITE_ARTICLES } from '../src/data/articles.js';

const ROOT_DIR = process.cwd();
const htmlFiles = fs.readdirSync(ROOT_DIR).filter(f => f.endsWith('.html'));

console.log(`Auditing ${htmlFiles.length} HTML files for structural, SEO, shell, and deduplication integrity...`);

const issues = [];

// 1. DEDUPLICATION AUDIT
const slugs = new Set();
const articleUrls = new Set();
const titles = new Set();
const canonicals = new Set();

SITE_ARTICLES.forEach(art => {
  if (slugs.has(art.slug)) issues.push({ file: 'articles.ts', type: 'DuplicateSlug', msg: `Duplicate slug: ${art.slug}` });
  slugs.add(art.slug);

  if (articleUrls.has(art.url)) issues.push({ file: 'articles.ts', type: 'DuplicateUrl', msg: `Duplicate URL: ${art.url}` });
  articleUrls.add(art.url);

  if (titles.has(art.title)) issues.push({ file: 'articles.ts', type: 'DuplicateTitle', msg: `Duplicate title: ${art.title}` });
  titles.add(art.title);

  if (canonicals.has(art.canonicalUrl)) issues.push({ file: 'articles.ts', type: 'DuplicateCanonical', msg: `Duplicate canonical: ${art.canonicalUrl}` });
  canonicals.add(art.canonicalUrl);
});

// Check sitemap uniqueness
if (fs.existsSync(path.join(ROOT_DIR, 'sitemap.xml'))) {
  const sitemap = fs.readFileSync(path.join(ROOT_DIR, 'sitemap.xml'), 'utf8');
  const locMatches = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const seenLocs = new Set();
  locMatches.forEach(loc => {
    if (seenLocs.has(loc)) {
      issues.push({ file: 'sitemap.xml', type: 'DuplicateSitemapLoc', msg: `Duplicate sitemap URL: ${loc}` });
    }
    seenLocs.add(loc);
  });
}

// 2. HTML FILE VALIDATION
function checkHtmlFile(file) {
  const content = fs.readFileSync(path.join(ROOT_DIR, file), 'utf8');

  // Check H1 count
  const h1Matches = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  if (h1Matches.length === 0) {
    issues.push({ file, type: 'H1', msg: 'Missing <h1> tag' });
  } else if (h1Matches.length > 1) {
    issues.push({ file, type: 'H1', msg: `Multiple <h1> tags found (${h1Matches.length})` });
  }

  // Check Title
  const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/i);
  if (!titleMatch) {
    issues.push({ file, type: 'Title', msg: 'Missing <title> tag' });
  }

  // Check Meta Description
  const metaDescMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']\s*\/?>/i);
  if (!metaDescMatch && file !== '404.html') {
    issues.push({ file, type: 'MetaDescription', msg: 'Missing meta description' });
  }

  // Check Canonical
  const canonicalMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']\s*\/?>/i);
  if (!canonicalMatch && file !== '404.html') {
    issues.push({ file, type: 'Canonical', msg: 'Missing canonical link' });
  }

  // Check Shell Components
  if (!content.includes('class="site-header"')) issues.push({ file, type: 'Shell', msg: 'Missing .site-header' });
  if (!content.includes('class="site-footer"')) issues.push({ file, type: 'Shell', msg: 'Missing .site-footer' });
  if (!content.includes('class="notice-banner"')) issues.push({ file, type: 'Shell', msg: 'Missing .notice-banner' });
  if (!content.includes('id="search-toggle-btn"')) issues.push({ file, type: 'Shell', msg: 'Missing search button' });
  if (!content.includes('id="theme-toggle-btn"')) issues.push({ file, type: 'Shell', msg: 'Missing theme button' });
  if (!content.includes('id="nav-drawer"')) issues.push({ file, type: 'Shell', msg: 'Missing #nav-drawer' });

  // Check Heading Hierarchy
  const headings = [...content.matchAll(/<(h[1-6])[^>]*>/gi)].map(m => parseInt(m[1].replace('h', '')));
  for (let i = 0; i < headings.length - 1; i++) {
    if (headings[i+1] > headings[i] + 1) {
      issues.push({ file, type: 'HeadingHierarchy', msg: `Skipped heading level from H${headings[i]} to H${headings[i+1]}` });
    }
  }

  // Check duplicate IDs
  const ids = [...content.matchAll(/\sid=["']([^"']+)["']/gi)].map(m => m[1]);
  const seenIds = new Set();
  const dupes = new Set();
  for (const id of ids) {
    if (seenIds.has(id)) dupes.add(id);
    seenIds.add(id);
  }
  if (dupes.size > 0) {
    issues.push({ file, type: 'DuplicateIDs', msg: `Duplicate IDs: ${[...dupes].join(', ')}` });
  }

  // Check Structured Data
  const jsonLdMatches = [...content.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)];
  jsonLdMatches.forEach((m, idx) => {
    try {
      const parsed = JSON.parse(m[1]);
      if (parsed.publisher && !parsed.publisher.logo) {
        issues.push({ file, type: 'Schema', msg: `Publisher in JSON-LD #${idx+1} missing logo` });
      }
    } catch (e) {
      issues.push({ file, type: 'Schema', msg: `Invalid JSON-LD #${idx+1}: ${e.message}` });
    }
  });

  // Check Article specific alignment
  const art = SITE_ARTICLES.find(a => a.url === file);
  if (art) {
    const rawTitle = titleMatch ? titleMatch[1].trim() : '';
    const h1Text = h1Matches.length > 0 ? h1Matches[0].replace(/<[^>]+>/g, '').trim() : '';
    
    if (rawTitle !== art.title && rawTitle !== art.metaTitle) {
      issues.push({ file, type: 'TitleMismatch', msg: `HTML title "${rawTitle}" != article title "${art.title}"` });
    }
    if (h1Text !== art.h1) {
      issues.push({ file, type: 'H1Mismatch', msg: `HTML H1 "${h1Text}" != article H1 "${art.h1}"` });
    }

    const ogTitleMatch = content.match(/<meta\s+property=["']og:title["']\s+content=["']([\s\S]*?)["']\s*\/?>/i);
    const twTitleMatch = content.match(/<meta\s+name=["']twitter:title["']\s+content=["']([\s\S]*?)["']\s*\/?>/i);
    if (ogTitleMatch && ogTitleMatch[1].trim() !== art.title && ogTitleMatch[1].trim() !== art.metaTitle) {
      issues.push({ file, type: 'OgTitleMismatch', msg: `og:title "${ogTitleMatch[1].trim()}" != article title "${art.title}"` });
    }
    if (twTitleMatch && twTitleMatch[1].trim() !== art.title && twTitleMatch[1].trim() !== art.metaTitle) {
      issues.push({ file, type: 'TwitterTitleMismatch', msg: `twitter:title "${twTitleMatch[1].trim()}" != article title "${art.title}"` });
    }

    if (metaDescMatch && metaDescMatch[1].trim() !== art.metaDescription) {
      issues.push({ file, type: 'DescMismatch', msg: `Meta description != article metaDescription` });
    }

    // Hero / Title image matching
    const ogImg = content.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    const twImg = content.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
    if (ogImg && ogImg[1] !== art.canonicalImage) {
      issues.push({ file, type: 'ImageMismatch', msg: `og:image "${ogImg[1]}" != canonicalImage "${art.canonicalImage}"` });
    }
    if (twImg && twImg[1] !== art.canonicalImage) {
      issues.push({ file, type: 'ImageMismatch', msg: `twitter:image "${twImg[1]}" != canonicalImage "${art.canonicalImage}"` });
    }
    if (!content.includes(`src="${art.canonicalImage}"`)) {
      issues.push({ file, type: 'HeroImageMismatch', msg: `Article body hero image src != "${art.canonicalImage}"` });
    }
  }
}

htmlFiles.forEach(checkHtmlFile);

console.log('\n--- AUDIT RESULTS ---');
console.log(`Total issues found: ${issues.length}`);
issues.forEach((iss, i) => {
  console.log(`${i+1}. [${iss.file}] (${iss.type}): ${iss.msg}`);
});
