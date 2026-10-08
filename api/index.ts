/**
 * Vercel Serverless Function Entrypoint
 * Forwards all /api/* requests to the Express application
 */

import { app } from '../server/app.ts';

export default app;
