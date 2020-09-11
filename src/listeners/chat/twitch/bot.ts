import { Config } from '../../../clients/configuration';
import { getLogger } from '../../../logger';
import { RefreshableAuthProvider, StaticAuthProvider } from 'twitch-auth';
import { ChatClient } from 'twitch-chat-client';

const logger = getLogger('twitch');

const singletonClient = new ChatClient(
  new RefreshableAuthProvider(new StaticAuthProvider(Config.getConfig().twitch_app_client_id, Config.getConfig().twitch_bot_access_token), {
    clientSecret: Config.getConfig().twitch_app_client_secret,
    refreshToken: Config.getConfig().twitch_bot_refresh_token,
    onRefresh: async ({ accessToken, refreshToken }) => await Config.updateTwitchAuthTokens(accessToken, refreshToken),
  }),
  {
    logger: { emoji: false },
  }
);

// param is the parsed message content after trimming the prepended command.
// Return the string content for replying to the message, or an empty string if a general reply is not desired.
export type TwitchMessageHandler = (channel: string, user: string, message: string, param?: string) => Promise<string>;

export class TwitchClient {
  public static client = singletonClient;
  private static cmdPrefix = Config.getConfig().twitch_bot_cmd_prefix || '!';
  private static commands: {
    [cmd: string]: {
      desc: string;
      usage: string;
      handler: TwitchMessageHandler;
    };
  } = {};

  public static async connect() {
    await TwitchClient.client.connect();
  }

  public static async postRegistration() {
    logger.info(`Twitch user ${TwitchClient.client.currentNick} logged into chat`);
    // Join channels here or whatever
  }

  public static async handleMessage(channel: string, user: string, message: string) {
    if (message.startsWith(TwitchClient.cmdPrefix)) {
      const sep = message.indexOf(' ');
      const cmd = message.substring(TwitchClient.cmdPrefix.length, sep === -1 ? undefined : sep);
      const param = sep === -1 ? undefined : message.substring(sep + 1).trim() || undefined;
      logger.trace(`cmd: '${cmd}' params: '${param}' channel: '${channel}' user: ${user}`);
      if (TwitchClient.commands[cmd]) {
        const reply = await TwitchClient.commands[cmd].handler(channel, user, message, param);
        if (reply) TwitchClient.client.say(channel, reply);
      }
    }
  }

  public static registerCommandHandler(cmd: string, shortDescription: string, usageInfo: string, handler: TwitchMessageHandler) {
    if (TwitchClient.commands[cmd]) throw new Error(`Command handler for cmd ${cmd} already registered!`);
    TwitchClient.commands[cmd] = {
      desc: shortDescription,
      usage: usageInfo,
      handler: handler,
    };
  }

  public static async shutdown() {
    await TwitchClient.client.quit();
  }
}

singletonClient.onRegister(TwitchClient.postRegistration);
singletonClient.onMessage(TwitchClient.handleMessage);
