import { Config } from './configuration';
import { ApiClient } from 'twitch';
import { RefreshableAuthProvider, StaticAuthProvider } from 'twitch-auth';

export class TwitchApi {
  public static AuthProvider = new RefreshableAuthProvider(new StaticAuthProvider(Config.getConfig().twitch_app_client_id, Config.getConfig().twitch_bot_access_token), {
    clientSecret: Config.getConfig().twitch_app_client_secret,
    refreshToken: Config.getConfig().twitch_bot_refresh_token,
    onRefresh: async ({ accessToken, refreshToken }) => await Config.updateTwitchAuthTokens(accessToken, refreshToken),
  });
  public static client = new ApiClient({ authProvider: TwitchApi.AuthProvider });

  public static async getStreamsOfGames(twitchGameIds: string[]) {
    return (await TwitchApi.client.helix.streams.getStreamsPaginated({ game: twitchGameIds }).getAll()).map((stream) => {
      return {
        id: stream.id,
        title: stream.title,
        game: stream.gameName,
        user: stream.userDisplayName,
        start: stream.startDate,
        url: `https://twitch.tv/${stream.userName}`,
      };
    });
  }
}
