import express from 'express';

export function v1Routes(app: express.Application) {
  const v1Router = express.Router();
  app.use('/v1', v1Router);

  // add routes to v1Router here
}
