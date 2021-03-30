import { Config } from './configuration';
import { ApiClient, HelixStream } from 'twitch';
import { RefreshableAuthProvider, StaticAuthProvider } from 'twitch-auth';

export class TwitchApi {
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

  public static async getTwitchUserNames(twitchIDs: string[]) {
    const users = await TwitchApi.client.helix.users.getUsersByIds(twitchIDs);
    return users.map((user) => user.displayName);
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
