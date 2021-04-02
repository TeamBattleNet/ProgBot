import express from 'express';
import * as twitch from '../controllers/twitchController';

export function v1Routes(app: express.Application) {
  const v1Router = express.Router();
  app.use('/v1', v1Router);

  // add routes to v1Router here
  v1Router.get('/twitch_oauth', twitch.twitchOauth);
}
