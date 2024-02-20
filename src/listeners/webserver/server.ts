import express from 'express';
import { Config } from '../../clients/configuration.js';
import { cors } from './middleware/cors.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { baseRoutes } from './routes/base.js';
import { v1Routes } from './routes/v1.js';
import { getLogger } from '../../logger.js';
const logger = getLogger('webserver');

let server: any = undefined;

export async function startWebserver() {
  const app = express();
  const port = Config.getConfig().webserver_port || 32043;
  const bind = Config.getConfig().webserver_bind || '0.0.0.0';
  app.disable('x-powered-by');
  app.use(cors);
  app.use(express.json());

  baseRoutes(app);
  v1Routes(app);

  app.use(notFound);
  app.use(errorHandler);

  server = app.listen(port, bind);
  logger.info(`Webserver now listening on ${bind} over port ${port}`);
}

export async function stopWebserver() {
  if (server) server.close();
}
