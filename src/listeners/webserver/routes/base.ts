import express from 'express';
import * as systemController from '../controllers/system.js';

export function baseRoutes(app: express.Application) {
  const baseRouter = express.Router();
  app.use(baseRouter);

  baseRouter.get('/health', systemController.healthCheck);
}
