import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  // Dynamically discover all root HTML files for multi-page build
  const htmlFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));
  const inputEntries: Record<string, string> = {};
  htmlFiles.forEach(file => {
    const key = file.replace('.html', '');
    inputEntries[key] = path.resolve(__dirname, file);
  });

  return {
    plugins: [],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: inputEntries,
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
