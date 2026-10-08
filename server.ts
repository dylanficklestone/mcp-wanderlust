/**
 * Express Server for Wanderlust AI
 * Bridges Vite frontend with server-side Gemini 3.1 Flash & MCP Tools
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { app } from './server/app.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = Number(process.env.PORT) || 3000;

  if (isProduction) {
    app.use(expressStaticDist());
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Wanderlust AI] Server running at http://0.0.0.0:${PORT}`);
  });
}

function expressStaticDist() {
  const express = require('express');
  const router = express.Router();
  router.use(express.static(path.resolve(__dirname, 'dist')));
  router.get('*', (_req: any, res: any) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
  return router;
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
