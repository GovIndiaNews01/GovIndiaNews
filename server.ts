import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { SITE_ARTICLES } from './src/data/articles.js';

const rootPath = process.cwd();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security Headers Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- 1. API ROUTES ---
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'GovIndiaNews Production Server',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/articles', (req: Request, res: Response) => {
    res.json({
      count: SITE_ARTICLES.length,
      articles: SITE_ARTICLES
    });
  });

  // Rate-limiting tracker for contact endpoint
  const recentSubmissions = new Map<string, number>();

  app.post('/api/contact', (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const lastSub = recentSubmissions.get(ip);

    if (lastSub && now - lastSub < 4000) {
      return res.status(429).json({
        error: 'Too many requests. Please wait a few seconds before sending another message.'
      });
    }

    const { name, email, department, message } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Please enter your full name.' });
    }

    if (!email || !String(email).trim()) {
      return res.status(400).json({ error: 'Please enter your email address.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!message || !String(message).trim() || String(message).trim().length < 5) {
      return res.status(400).json({ error: 'Please provide a detailed inquiry message.' });
    }

    recentSubmissions.set(ip, now);
    console.log(`[Contact Submission] Received from "${name}" <${email}> for department "${department || 'editorial'}".`);

    return res.status(200).json({
      success: true,
      message: 'Thank you! Your inquiry has been received by the GovIndiaNews desk. We review inquiries within 24 business hours.'
    });
  });

  // --- 2. VITE & STATIC FILE SERVING ---
  const staticOptions = {
    extensions: ['html', 'htm'],
    maxAge: '1y',
    setHeaders: (res: Response, filePath: string) => {
      if (
        filePath.endsWith('.css') ||
        filePath.endsWith('.js') ||
        filePath.endsWith('.svg') ||
        filePath.endsWith('.webp') ||
        filePath.endsWith('.png') ||
        filePath.endsWith('.jpg') ||
        filePath.endsWith('.jpeg') ||
        filePath.endsWith('.ico') ||
        filePath.endsWith('.woff2')
      ) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.endsWith('.html') || filePath.endsWith('.htm')) {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      }
    }
  };

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: 3000 },
      appType: 'custom'
    });
    app.use(vite.middlewares);
    app.use(express.static(process.cwd(), staticOptions));
    app.use((req: Request, res: Response) => {
      res.status(404).sendFile(path.join(process.cwd(), '404.html'));
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, staticOptions));
    app.use((req: Request, res: Response) => {
      res.status(404).sendFile(path.join(distPath, '404.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GovIndiaNews server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
