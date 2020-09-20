import { parseNextWord } from '../shared/utils';
import { Config } from '../../../clients/configuration';
import { getLogger } from '../../../logger';
import { RefreshableAuthProvider, StaticAuthProvider } from 'twitch-auth';
import { ChatClient, PrivateMessage } from 'twitch-chat-client';
import type { CommandCategory } from '../../../types';

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

export type MsgHandler = (msg: PrivateMessage, param?: string) => Promise<string>;
// param input in the handler is the parsed message content after trimming the prepended command.
// Return the string content for replying to the message, or an empty string if a general reply is not desired.
export interface TwitchCommand {
  cmd: string;
  category: CommandCategory;
  shortDescription: string;
  usageInfo: string;
  handler: MsgHandler;
}

export class TwitchClient {
  public static client = singletonClient;
  public static cmdPrefix = Config.getConfig().twitch_bot_cmd_prefix || '!';
  public static username = '';
  private static commands: {
    [cmd: string]: {
      category: CommandCategory;
      desc: string;
      usage: string;
      handler: MsgHandler;
    };
  } = {};

  public static async connect() {
    await TwitchClient.client.connect();
  }

  public static async postRegistration() {
    TwitchClient.username = TwitchClient.client.currentNick;
    logger.info(`Twitch user ${TwitchClient.username} logged into chat`);
    // Join channels here
    await TwitchClient.client.join(`#${TwitchClient.username}`); // always join our own channel chat
    logger.info(`Joined twitch channel #${TwitchClient.username}`);
  }

  public static async handleMessage(_chan: string, _user: string, message: string, msg: PrivateMessage) {
    if (message.startsWith(TwitchClient.cmdPrefix)) {
      const { word: cmd, remain: param } = parseNextWord(message, TwitchClient.cmdPrefix.length);
      logger.trace(`cmd: '${cmd}' params: '${param}' channel: '${msg.target.value}' user: ${msg.userInfo.userName}`);
      if (TwitchClient.commands[cmd]) {
        try {
          const reply = await TwitchClient.commands[cmd].handler(msg, param);
          if (reply) TwitchClient.client.say(msg.target.value, reply);
        } catch (e) {
          logger.error(e);
          TwitchClient.client.say(msg.target.value, 'Internal Error');
        }
      }
    }
  }

  public static registerCommand(command: TwitchCommand) {
    if (TwitchClient.commands[command.cmd]) throw new Error(`Command handler for cmd ${command.cmd} already registered!`);
    TwitchClient.commands[command.cmd] = {
      category: command.category,
      desc: command.shortDescription,
      usage: command.usageInfo,
      handler: command.handler,
    };
  }

  public static doesCommandExist(cmd: string) {
    return Boolean(TwitchClient.commands[cmd]);
  }

  public static removeCommand(cmd: string) {
    delete TwitchClient.commands[cmd];
  }

  public static async shutdown() {
    await TwitchClient.client.quit();
  }
}

singletonClient.onRegister(TwitchClient.postRegistration);
singletonClient.onMessage(TwitchClient.handleMessage);
