import discord from 'discord.js';
import { parseNextWord } from '../shared/utils';
import { Config } from '../../../clients/configuration';
import { getLogger } from '../../../logger';
import type { CommandCategory } from '../../../types';

const logger = getLogger('discord');

const singletonClient = new discord.Client();

export type MsgHandler = (msg: discord.Message, param?: string) => Promise<string>;
// param input in the handler is the parsed message content after trimming the prepended command.
// Return the string content for replying to the message, or an empty string if a general reply is not desired.
export interface DiscordCommand {
  cmd: string;
  category: CommandCategory;
  shortDescription: string;
  usageInfo: string;
  handler: MsgHandler;
}

export class DiscordClient {
  public static client = singletonClient;
  public static cmdPrefix = Config.getConfig().discord_bot_cmd_prefix || '!';
  private static commands: {
    [cmd: string]: {
      category: CommandCategory;
      desc: string;
      usage: string;
      handler: MsgHandler;
    };
  } = {};

  public static async connect() {
    DiscordClient.registerCommand(DiscordClient.helpCommand);
    await DiscordClient.client.login(Config.getConfig().discord_token);
    await DiscordClient.client.user?.setPresence({ activity: { type: 'PLAYING', name: `on the net - ${DiscordClient.cmdPrefix}help` } });
  }

  public static async nowReady() {
    logger.info(`Discord client ready. Invite: ${await DiscordClient.client.generateInvite({ permissions: [discord.Permissions.FLAGS.ADMINISTRATOR] })}`);
  }

  public static async sendMessage(channelId: string, message: string) {
    const channel = DiscordClient.client.channels.cache.get(channelId) as discord.TextChannel;
    if (!channel) throw new Error(`Discord channel ${channelId} could not be found when trying to send a message`);
    if (!channel.isText()) throw new Error(`Trying to send message to discord channel ${channelId} which is not a text channel!`);
    await channel.send(message);
  }

  public static async handleMessage(message: discord.Message) {
    if (message.content.startsWith(DiscordClient.cmdPrefix)) {
      const { word: cmd, remain: param } = parseNextWord(message.content, DiscordClient.cmdPrefix.length);
      logger.trace(`cmd: '${cmd}' params: '${param}' user: ${message.member?.user.username}#${message.member?.user.discriminator}`);
      if (DiscordClient.commands[cmd]) {
        // Start typing if reply takes time to generate (over 100ms)
        let typing = false;
        const timeout = setTimeout(() => {
          message.channel.startTyping().catch();
          typing = true;
        }, 100);
        try {
          const reply = await DiscordClient.commands[cmd].handler(message, param);
          clearTimeout(timeout);
          if (reply) await message.channel.send(reply);
          if (typing) message.channel.stopTyping(true);
        } catch (e) {
          logger.error(e);
          await message.channel.send('Internal Error');
        }
      }
    }
  }

  public static registerCommand(command: DiscordCommand) {
    if (DiscordClient.commands[command.cmd]) throw new Error(`Command handler for cmd ${command.cmd} already registered!`);
    DiscordClient.commands[command.cmd] = {
      category: command.category,
      desc: command.shortDescription,
      usage: command.usageInfo,
      handler: command.handler,
    };
  }

  public static doesCommandExist(cmd: string) {
    return Boolean(DiscordClient.commands[cmd]);
  }

  public static removeCommand(cmd: string) {
    delete DiscordClient.commands[cmd];
  }

  private static helpCommand: DiscordCommand = {
    cmd: 'help',
    category: 'Help',
    shortDescription: 'Get list of commands or help for a specific command (help [cmd])',
    usageInfo: `usage: help [cmd]
  help - list all commands with their descriptions
  help [cmd] - get the description and usage information for [cmd]`,
    handler: async (_msg, param) => {
      const requestAdmin = param?.toLowerCase() === 'admin'; // special case for asking command 'admin'
      if (param && !requestAdmin) {
        // if help for a specific command
        if (DiscordClient.commands[param]) {
          return `\`\`\`${param} - ${DiscordClient.commands[param].desc}\n\n${DiscordClient.commands[param].usage}\`\`\``;
        } else {
          return `Unknown command '${param}'`;
        }
      } else {
        // no specific command specified, list all commands
        const cmdHelpByCategory: { [index: string]: string[] } = {};
        Object.entries(DiscordClient.commands).forEach(([cmd, data]) => {
          if (!cmdHelpByCategory[data.category]) cmdHelpByCategory[data.category] = [];
          cmdHelpByCategory[data.category].push(`${DiscordClient.cmdPrefix}${cmd} - ${data.desc}`);
        });
        let replyText = `\`\`\`Commands:\n`;
        const separator = '\n  ';
        Object.entries(cmdHelpByCategory).forEach(([category, data]) => {
          if (!requestAdmin) {
            // Filter 'Simple' and 'Admin' commands from general help display
            if (category !== 'Simple' && category !== 'Admin') replyText += `\n${category}:${separator}${data.join(separator)}\n`;
          } else {
            if (category === 'Admin') replyText += `\n${category}:${separator}${data.join(separator)}\n`;
          }
        });
        return replyText.trimEnd() + '```';
      }
    },
  };

  public static async shutdown() {
    DiscordClient.client.destroy();
  }
}

singletonClient.on('ready', DiscordClient.nowReady);
singletonClient.on('message', DiscordClient.handleMessage);
singletonClient.on('rateLimit', (r) => logger.warn(`Rate limit: ${r}`));
singletonClient.on('error', logger.error);
