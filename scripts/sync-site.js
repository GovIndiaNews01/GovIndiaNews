import fs from 'fs';
import path from 'path';
import esbuild from 'esbuild';
import { SITE_ARTICLES } from '../src/data/articles.js';

const ROOT_DIR = process.cwd();

// --- 1. SYNC SEARCH ARRAY IN script.js ---
function syncScriptSearchArray() {
  const scriptPath = path.join(ROOT_DIR, 'script.js');
  let scriptContent = fs.readFileSync(scriptPath, 'utf8');

  const searchData = SITE_ARTICLES.map(art => ({
    title: art.title,
    snippet: art.snippet,
    url: art.url,
    category: art.category,
    keywords: art.keywords
  }));

  const arrayRegex = /const siteArticles\s*=\s*\[[\s\S]*?\];/;
  const newArrayCode = `const siteArticles = ${JSON.stringify(searchData, null, 2)};`;

  if (scriptContent.match(arrayRegex)) {
    scriptContent = scriptContent.replace(arrayRegex, newArrayCode);
    fs.writeFileSync(scriptPath, scriptContent, 'utf8');
    console.log(`Updated siteArticles in script.js with ${searchData.length} articles.`);
  }
}

// --- 2. MINIFY ASSETS WITH ESBUILD ---
function minifyAssets() {
  // Minify CSS
  const cssResult = esbuild.transformSync(fs.readFileSync(path.join(ROOT_DIR, 'styles.css'), 'utf8'), {
    loader: 'css',
    minify: true
  });
  fs.writeFileSync(path.join(ROOT_DIR, 'styles.min.css'), cssResult.code, 'utf8');

  // Minify JS
  const jsResult = esbuild.transformSync(fs.readFileSync(path.join(ROOT_DIR, 'script.js'), 'utf8'), {
    loader: 'js',
    minify: true
  });
  fs.writeFileSync(path.join(ROOT_DIR, 'script.min.js'), jsResult.code, 'utf8');

  console.log('Minified styles.min.css and script.min.js.');
}

// --- 3. SITEMAP GENERATOR ---
function generateSitemap() {
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily', lastmod: '2026-08-21' },
    { url: 'government-schemes.html', priority: '0.9', changefreq: 'daily', lastmod: '2026-08-21' },
    { url: 'government-jobs.html', priority: '0.9', changefreq: 'daily', lastmod: '2026-08-21' },
    { url: 'global-finance.html', priority: '0.9', changefreq: 'daily', lastmod: '2026-08-21' },
    { url: 'about.html', priority: '0.7', changefreq: 'monthly', lastmod: '2026-08-21' },
    { url: 'contact.html', priority: '0.7', changefreq: 'monthly', lastmod: '2026-08-21' },
    { url: 'author.html', priority: '0.7', changefreq: 'monthly', lastmod: '2026-08-21' },
    { url: 'privacy-policy.html', priority: '0.5', changefreq: 'yearly', lastmod: '2026-08-21' },
    { url: 'terms.html', priority: '0.5', changefreq: 'yearly', lastmod: '2026-08-21' },
    { url: 'disclaimer.html', priority: '0.5', changefreq: 'yearly', lastmod: '2026-08-21' },
    { url: 'editorial-policy.html', priority: '0.5', changefreq: 'yearly', lastmod: '2026-08-21' },
    { url: 'fact-check-policy.html', priority: '0.5', changefreq: 'yearly', lastmod: '2026-08-21' },
    { url: 'corrections-policy.html', priority: '0.5', changefreq: 'yearly', lastmod: '2026-08-21' },
    { url: 'ethics-policy.html', priority: '0.5', changefreq: 'yearly', lastmod: '2026-08-21' },
    { url: 'ownership-funding.html', priority: '0.5', changefreq: 'yearly', lastmod: '2026-08-21' },
    { url: 'cookie-policy.html', priority: '0.5', changefreq: 'yearly', lastmod: '2026-08-21' },
    { url: 'grievance.html', priority: '0.5', changefreq: 'yearly', lastmod: '2026-08-21' }
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const p of staticPages) {
    const loc = p.url ? `https://www.govindianews.com/${p.url}` : `https://www.govindianews.com/`;
    xml += `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${p.lastmod}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>\n`;
  }

  for (const art of SITE_ARTICLES) {
    xml += `  <url>\n    <loc>${art.canonicalUrl}</loc>\n    <lastmod>${art.modifiedIso.split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  }

  xml += `</urlset>\n`;
  fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), xml, 'utf8');
  console.log('Generated sitemap.xml.');
}

// --- 4. RSS GENERATOR ---
function generateRss() {
  let rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>GovIndiaNews</title>\n    <link>https://www.govindianews.com/</link>\n    <description>Government Schemes · Government Jobs · Global Finance — Explained Simply</description>\n    <language>en-in</language>\n    <copyright>© 2026 GovIndiaNews. All rights reserved.</copyright>\n    <atom:link href="https://www.govindianews.com/rss.xml" rel="self" type="application/rss+xml" />\n`;

  for (const art of SITE_ARTICLES) {
    const pubDateStr = new Date(art.publishedIso).toUTCString();
    rss += `    <item>\n      <title><![CDATA[${art.title}]]></title>\n      <link>${art.canonicalUrl}</link>\n      <guid isPermaLink="true">${art.canonicalUrl}</guid>\n      <pubDate>${pubDateStr}</pubDate>\n      <category><![CDATA[${art.category}]]></category>\n      <description><![CDATA[${art.snippet}]]></description>\n    </item>\n`;
  }

  rss += `  </channel>\n</rss>\n`;
  fs.writeFileSync(path.join(ROOT_DIR, 'rss.xml'), rss, 'utf8');
  console.log('Generated rss.xml.');
}

// Execute complete synchronization
syncScriptSearchArray();
minifyAssets();
generateSitemap();
generateRss();
