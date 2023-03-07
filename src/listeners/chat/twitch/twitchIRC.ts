import { parseNextWord } from '../shared/utils';
import { Config } from '../../../clients/configuration';
import { TwitchApi } from '../../../clients/twitchApi';
import { TwitchChannel } from '../../../models/twitchChannel';
import { getLogger } from '../../../logger';
import { ChatClient, PrivateMessage } from '@twurple/chat';
import type { CommandCategory } from '../../../types';

const logger = getLogger('twitchIRC');

const singletonClient = new ChatClient({
  authProvider: TwitchApi.AuthProvider,
  isAlwaysMod: true,
  logger: { emoji: false },
});

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

export class TwitchIRCClient {
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
    await TwitchIRCClient.client.connect();
  }

  public static async postRegistration() {
    if (!TwitchIRCClient.client.irc.currentNick) {
      // Should never happen unless there is an issue with the IRC client
      logger.error('Twitch irc registration complete but nick not defined');
      return;
    }
    TwitchIRCClient.username = TwitchIRCClient.client.irc.currentNick.toLowerCase();
    logger.info(`Twitch user ${TwitchIRCClient.username} logged into chat`);
    // Join channels here
    const channels = await TwitchChannel.getAllChannels();
    // Make sure we have/bootstrap the bot's own channel
    const hasOwnChannel = channels.some((chan) => chan.channel === TwitchIRCClient.username);
    if (!hasOwnChannel) channels.push(await TwitchChannel.createNewChannel(TwitchIRCClient.username));
    // Actually join the channels now
    await Promise.all(
      channels.map(async (channel) => {
        try {
          await TwitchIRCClient.joinChannel(channel);
        } catch {
          logger.error(`Failed to join twitch channel ${channel.channel}`);
        }
      })
    );
  }

  public static async joinChannel(channel: TwitchChannel) {
    const chan = `#${channel.channel}`;
    await TwitchIRCClient.client.join(chan);
    TwitchIRCClient.channelsCache[channel.channel] = channel; // Add connected channel to cache
    TwitchIRCClient.client.say(chan, 'Logging on and jacking in!');
    logger.info(`Joined twitch channel ${channel.channel}`);
  }

  public static leaveChannel(channel: string) {
    channel = channel.toLowerCase();
    TwitchIRCClient.client.part(`#${channel}`);
    delete TwitchIRCClient.channelsCache[channel];
  }

  public static getTwitchChannelFromCache(channel: string) {
    const formatted = channel.startsWith('#') ? channel.substring(1).toLowerCase() : channel.toLowerCase();
    const chan = TwitchIRCClient.channelsCache[formatted];
    if (!chan) throw new Error(`Could not find channel ${formatted} in cache`);
    return chan;
  }

  public static async sendMessage(channel: string, msg: string) {
    const chan = TwitchIRCClient.getTwitchChannelFromCache(channel);
    await TwitchIRCClient.client.say(`#${chan.channel}`, msg);
  }

  public static async handleMessage(_chan: string, _usr: string, _msg: string, msg: PrivateMessage) {
    if (msg.content.value.startsWith(TwitchIRCClient.cmdPrefix)) {
      const channel = msg.target.value.substring(1).toLowerCase();
      const { word: cmd, remain: param } = parseNextWord(msg.content.value, TwitchIRCClient.cmdPrefix.length);
      logger.trace(`cmd: '${cmd}' params: '${param}' channel: '${channel}' user: ${msg.userInfo.userName}`);
      const lowerCmd = cmd.toLowerCase();
      if (TwitchIRCClient.commands[lowerCmd] && !TwitchIRCClient.channelsCache[channel]?.isDisabledCommand(lowerCmd)) {
        try {
          const reply = await TwitchIRCClient.commands[lowerCmd].handler(msg, param);
          if (reply) TwitchIRCClient.client.say(msg.target.value, reply);
        } catch (e) {
          logger.error(e);
          TwitchIRCClient.client.say(msg.target.value, 'Internal Error');
        }
      }
    }
  }

  public static registerCommand(command: TwitchCommand) {
    const lowerCmd = command.cmd.toLowerCase();
    if (TwitchIRCClient.commands[lowerCmd]) throw new Error(`Command handler for cmd ${command.cmd} already registered!`);
    TwitchIRCClient.commands[lowerCmd] = {
      category: command.category,
      desc: command.shortDescription,
      usage: command.usageInfo,
      handler: command.handler,
    };
  }

  public static doesCommandExist(cmd: string) {
    return Boolean(TwitchIRCClient.commands[cmd]);
  }

  public static removeCommand(cmd: string) {
    delete TwitchIRCClient.commands[cmd];
  }

  public static async shutdown() {
    await TwitchIRCClient.client.quit();
  }
}

singletonClient.irc.onRegister(TwitchIRCClient.postRegistration);
singletonClient.onMessage(TwitchIRCClient.handleMessage);
singletonClient.irc.onAnyMessage(logger.trace);
