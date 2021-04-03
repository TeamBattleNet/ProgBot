import got from 'got';
import { Config } from './configuration';
import { getLogger } from '../logger';
import { ApiClient, HelixStream } from 'twitch';
import { RefreshableAuthProvider, StaticAuthProvider } from 'twitch-auth';

const logger = getLogger('twitchAPI');

export class TwitchApi {
  public static got = got.extend({
    throwHttpErrors: false,
    timeout: 30000,
  });
  public static AuthProvider = new RefreshableAuthProvider(new StaticAuthProvider(Config.getConfig().twitch_app_client_id, Config.getConfig().twitch_bot_access_token), {
    clientSecret: Config.getConfig().twitch_app_client_secret,
    refreshToken: Config.getConfig().twitch_bot_refresh_token,
    onRefresh: async ({ accessToken, refreshToken }) => await Config.updateTwitchAuthTokens(accessToken, refreshToken),
  });
  public static client = new ApiClient({ authProvider: TwitchApi.AuthProvider });

  public static async getStreamsOfGames(twitchGameIds: string[]) {
    if (twitchGameIds.length === 0) return [];
    return (await TwitchApi.client.helix.streams.getStreamsPaginated({ game: twitchGameIds }).getAll()).map(apiStreamToStreamObj);
  }

  public static async getStreamsOfUsers(twitchUserIds: string[]) {
    if (twitchUserIds.length === 0) return [];
    return (await TwitchApi.client.helix.streams.getStreamsPaginated({ userId: twitchUserIds }).getAll()).map(apiStreamToStreamObj);
  }

  // returns an empty string if not found
  public static async getTwitchUserID(twitchChannelName: string) {
    const user = await TwitchApi.client.helix.users.getUserByName(twitchChannelName.toLowerCase());
    if (!user) return '';
    return user.id;
  }

  // returns an empty string if not found
  public static async getTwitchLoginName(twitchId: string) {
    const user = await TwitchApi.client.helix.users.getUserById(twitchId);
    return user?.name || '';
  }

  public static async getTwitchUserNames(twitchIDs: string[]) {
    const users = await TwitchApi.client.helix.users.getUsersByIds(twitchIDs);
    return users.map((user) => user.displayName);
  }

  public static async getOauthToken(code: string, redirectURI: string) {
    const response = await TwitchApi.got('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      responseType: 'text',
      searchParams: {
        client_id: Config.getConfig().twitch_app_client_id,
        client_secret: Config.getConfig().twitch_app_client_secret,
        grant_type: 'authorization_code',
        redirect_uri: redirectURI,
        code,
      },
    });
    if (response.statusCode !== 200) {
      logger.error(`Bad response from twitch getting oauth token. Status: ${response.statusCode}\n${response.body}`);
      throw new Error(`Bad response getting oauth token from twitch`);
    }
    const tokenData = JSON.parse(response.body);
    return {
      accessToken: tokenData.access_token as string,
      refreshToken: tokenData.refresh_token as string,
    };
  }
}

function apiStreamToStreamObj(stream: HelixStream) {
  return {
    id: stream.id,
    title: stream.title,
    game: stream.gameName,
    user: stream.userDisplayName,
    start: stream.startDate,
    url: `https://twitch.tv/${stream.userName}`,
  };
}
