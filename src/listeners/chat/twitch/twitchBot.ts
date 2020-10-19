import { parseNextWord } from '../shared/utils';
import { Config } from '../../../clients/configuration';
import { TwitchChannel } from '../../../models/twitchChannel';
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
    logger: { emoji: false, minLevel: 'INFO' },
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
  private static channelsCache: { [channel: string]: TwitchChannel | undefined } = {};

  public static async connect() {
    await TwitchClient.client.connect();
  }

  public static async postRegistration() {
    if (!TwitchClient.client.currentNick) {
      // Should never happen unless there is an issue with the IRC client
      logger.error('Twitch irc registration complete but nick not defined');
      return;
    }
    TwitchClient.username = TwitchClient.client.currentNick.toLowerCase();
    logger.info(`Twitch user ${TwitchClient.username} logged into chat`);
    // Join channels here
    const channels = await TwitchChannel.getAllChannels();
    // Make sure we have/bootstrap the bot's own channel
    let hasOwnChannel = false;
    for (const channel of channels) {
      if (channel.channel === TwitchClient.username) {
        hasOwnChannel = true;
        break;
      }
    }
    if (!hasOwnChannel) channels.push(await TwitchChannel.createNewChannel(TwitchClient.username));
    // Actually join the channels now
    await Promise.all(
      channels.map(async (channel) => {
        try {
          await TwitchClient.joinChannel(channel);
        } catch {
          logger.error(`Failed to join twitch channel ${channel.channel}`);
        }
      })
    );
  }

  public static async joinChannel(channel: TwitchChannel) {
    const chan = `#${channel.channel}`;
    await TwitchClient.client.join(chan);
    TwitchClient.channelsCache[channel.channel] = channel; // Add connected channel to cache
    TwitchClient.client.say(chan, 'Logging on and jacking in!');
    logger.info(`Joined twitch channel ${channel.channel}`);
  }

  public static leaveChannel(channel: string) {
    channel = channel.toLowerCase();
    TwitchClient.client.part(`#${channel}`);
    delete TwitchClient.channelsCache[channel];
  }

  public static getTwitchChannelFromCache(channel: string) {
    const formatted = channel.startsWith('#') ? channel.substring(1).toLowerCase() : channel.toLowerCase();
    const chan = TwitchClient.channelsCache[formatted];
    if (!chan) throw new Error(`Could not find channel ${formatted} in cache`);
    return chan;
  }

  public static async handleMessage(_chan: string, _usr: string, _msg: string, msg: PrivateMessage) {
    if (msg.message.value.startsWith(TwitchClient.cmdPrefix)) {
      const channel = msg.target.value.substring(1).toLowerCase();
      const { word: cmd, remain: param } = parseNextWord(msg.message.value, TwitchClient.cmdPrefix.length);
      logger.trace(`cmd: '${cmd}' params: '${param}' channel: '${channel}' user: ${msg.userInfo.userName}`);
      if (TwitchClient.commands[cmd] && !TwitchClient.channelsCache[channel]?.isDisabledCommand(cmd)) {
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
