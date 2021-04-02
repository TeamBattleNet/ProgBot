import { Request, Response } from 'express';
import { getRedirectURI } from '../../../utils';
import { TwitchApi } from '../../../clients/twitchApi';
import { TwitchChannel } from '../../../models/twitchChannel';
import { ProgbotError } from '../../../errors';
import { asyncHandler } from './helpers';
import { getLogger } from '../../../logger';

const logger = getLogger('webserver_twitch');

/**
 * GET /twitch_oauth
 * Retrieve an oauth token from twitch identity callback (redirect_uri)
 */
export const twitchOauth = asyncHandler(async (req: Request, res: Response) => {
  const state = req.query.state;
  const code = req.query.code;
  if (!state || !code || typeof state !== 'string' || typeof code !== 'string') throw new ProgbotError('BAD_REQUEST', 'Did not recieve state and/or code for twitch oauth');
  const channel = await TwitchChannel.getChannelByOauthState(state);
  if (!channel) throw new ProgbotError('BAD_REQUEST', 'Did not request auth for this twitch account');
  const tokenData = await TwitchApi.getOauthToken(code, getRedirectURI());
  if (!(await channel.setAuthTokens(tokenData.accessToken, tokenData.refreshToken, true)))
    throw new ProgbotError('BAD_REQUEST', `Permissions were granted to incorrect channel. Wanted authorization for: ${channel.channel}`);
  logger.info(`Successfully retrieved and saved OAUTH token for ${channel.channel}`);
  res.status(200).send('Permissions granted successfully');
});
