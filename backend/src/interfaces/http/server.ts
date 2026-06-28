import express, { type Express } from 'express';
import cors from 'cors';
import type { Container } from '../../config/container.js';
import { registerRoutes } from './routes/index.js';

/** Builds the Express app. Express stays at the edge; all logic is in use cases. */
export function buildServer(container: Container): Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  registerRoutes(app, container);

  // 404 + error fallthrough.
  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'not_found', message: 'Route not found' } });
  });

  return app;
}
