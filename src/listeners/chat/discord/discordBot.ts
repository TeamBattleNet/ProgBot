import discord from 'discord.js';
import { parseNextWord } from '../shared/utils';
import { Config } from '../../../clients/configuration';
import { getLogger } from '../../../logger';
import type { CommandCategory } from '../../../types';

const logger = getLogger('discord');

// TODO re-add discord/erlpack as dependency once it's working again: https://github.com/discord/erlpack/pull/41
const singletonClient = new discord.Client({
  partials: [discord.Partials.Channel], // required for DMs: https://discordjs.guide/additional-info/changes-in-v13.html#dm-channels
  intents: [discord.GatewayIntentBits.Guilds, discord.GatewayIntentBits.GuildMessages, discord.GatewayIntentBits.DirectMessages, discord.GatewayIntentBits.MessageContent],
});

export class DiscordMsgOrCmd {
  public msg?: discord.Message;
  public cmd?: discord.ChatInputCommandInteraction;
  public constructor(msg?: discord.Message, cmd?: discord.ChatInputCommandInteraction) {
    if (msg) this.msg = msg;
    if (cmd) this.cmd = cmd;
  }
}
export type MsgHandler = (msg: DiscordMsgOrCmd, param?: string) => Promise<string>;
// param input in the handler is the parsed message content after trimming the prepended command.
// Return the string content for replying to the message, or an empty string if a general reply is not desired.
export interface DiscordCommand {
  cmd: string;
  category: CommandCategory;
  shortDescription: string;
  usageInfo: string;
  options: { name: string; desc: string; required: boolean }[];
  handler: MsgHandler;
}

export class DiscordClient {
  public static client = singletonClient;
  public static cmdPrefix = Config.getConfig().discord_bot_cmd_prefix || '!';
  private static commands: {
    [cmd: string]: {
      cmd: string;
      category: CommandCategory;
      desc: string;
      usage: string;
      opts: { name: string; desc: string; required: boolean }[];
      handler: MsgHandler;
    };
  } = {};

  public static async connect() {
    DiscordClient.registerCommand(DiscordClient.helpCommand);
    await DiscordClient.client.login(Config.getConfig().discord_token);
  }

  public static async nowReady() {
    if (!DiscordClient.client.isReady()) throw new Error('nowReady called before discord client was ready!');
    const normalCmds = Object.values(DiscordClient.commands).filter((cmd) => cmd.category !== 'Admin' && cmd.category !== 'Simple');
    const adminCmds = Object.values(DiscordClient.commands).filter((cmd) => cmd.category === 'Admin');
    const allDiscordCmds: discord.ApplicationCommandData[] = normalCmds.map((data) => {
      return {
        name: data.cmd,
        description: data.desc,
        options: data.opts.map((opts) => {
          return { type: discord.ApplicationCommandOptionType.String, name: opts.name, description: opts.desc, required: opts.required };
        }),
      };
    });
    allDiscordCmds.push({
      name: 'admin',
      description: 'Admin commands',
      options: adminCmds.map((data) => {
        return {
          name: data.cmd,
          description: data.desc,
          type: discord.ApplicationCommandOptionType.Subcommand,
          options: data.opts.map((opts) => {
            return { type: discord.ApplicationCommandOptionType.String, name: opts.name, description: opts.desc, required: opts.required };
          }),
        };
      }),
    });
    await DiscordClient.client.application.commands.set(allDiscordCmds);
    DiscordClient.client.user?.setPresence({ activities: [{ type: discord.ActivityType.Playing, name: `on the net - /help` }] });
    logger.info(
      `Discord client ready. Invite: ${DiscordClient.client.generateInvite({
        scopes: [discord.OAuth2Scopes.Bot, discord.OAuth2Scopes.ApplicationsCommands],
        permissions: [discord.PermissionsBitField.Flags.Administrator],
      })}`,
    );
  }

  public static async sendMessage(channelId: string, message: string) {
    const channel = DiscordClient.client.channels.cache.get(channelId);
    if (!channel) throw new Error(`Discord channel ${channelId} could not be found when trying to send a message`);
    if (!channel.isTextBased()) throw new Error(`Trying to send message to discord channel ${channelId} which is not a text channel!`);
    await channel.send(message);
  }

  public static async handleMessage(message: discord.Message) {
    if (message.content.startsWith(DiscordClient.cmdPrefix)) {
      const { word: cmd, remain: param } = parseNextWord(message.content, DiscordClient.cmdPrefix.length);
      logger.trace(`cmd: '${cmd}' params: '${param}' user: ${message.member?.user.username}#${message.member?.user.discriminator}`);
      const lowerCmd = cmd.toLowerCase();
      if (DiscordClient.commands[lowerCmd]) {
        // Start typing if reply takes time to generate (over 100ms)
        const timeout = setTimeout(() => {
          message.channel.sendTyping().catch();
        }, 100);
        try {
          const reply = await DiscordClient.commands[lowerCmd].handler(new DiscordMsgOrCmd(message, undefined), param);
          clearTimeout(timeout);
          if (reply) await message.channel.send(reply);
        } catch (e) {
          logger.error(e);
          await message.channel.send('Internal Error');
        }
      }
    }
  }

  public static async handleInteraction(interaction: discord.Interaction) {
    if (DiscordClient.client.application?.id === interaction.applicationId && interaction.isChatInputCommand()) {
      logger.trace(
        `slash cmd: '${interaction.commandName}' params: '${interaction.options.data}' user: ${interaction.member?.user.username}#${interaction.member?.user.discriminator}`,
      );
      let lowerCmd = interaction.commandName.toLowerCase();
      if (lowerCmd === 'admin') lowerCmd = interaction.options.getSubcommand(true).toLowerCase();
      if (DiscordClient.commands[lowerCmd]) {
        try {
          const reply = await DiscordClient.commands[lowerCmd].handler(new DiscordMsgOrCmd(undefined, interaction));
          if (reply) await interaction.reply(reply);
        } catch (e) {
          logger.error(e);
          await interaction.reply('Internal Error');
        }
      }
    }
  }

  public static registerCommand(command: DiscordCommand) {
    const lowerCmd = command.cmd.toLowerCase();
    if (DiscordClient.commands[lowerCmd]) throw new Error(`Command handler for cmd ${command.cmd} already registered!`);
    DiscordClient.commands[lowerCmd] = {
      cmd: lowerCmd,
      category: command.category,
      desc: command.shortDescription,
      usage: command.usageInfo,
      opts: command.options,
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
    options: [{ name: 'command', desc: 'Command name to get help and usage information for', required: false }],
    handler: async (msg, param) => {
      let cmd = param;
      if (msg.cmd) cmd = msg.cmd.options.getString('command', false) || undefined;
      const requestAdmin = cmd?.toLowerCase() === 'admin'; // special case for asking command 'admin'
      if (cmd && !requestAdmin) {
        // if help for a specific command
        if (DiscordClient.commands[cmd]) {
          return `\`\`\`${cmd} - ${DiscordClient.commands[cmd].desc}\n\n${DiscordClient.commands[cmd].usage}\`\`\``;
        } else {
          return `Unknown command '${cmd}'`;
        }
      } else {
        // no specific command specified, list all commands
        const cmdHelpByCategory: { [index: string]: string[] } = {};
        Object.entries(DiscordClient.commands).forEach(([cmd, data]) => {
          if (!cmdHelpByCategory[data.category]) cmdHelpByCategory[data.category] = [];
          cmdHelpByCategory[data.category].push(`${cmd} - ${data.desc}`);
        });
        let replyText = `\`\`\`Commands:\n`;
        const separator = '\n  ';
        Object.entries(cmdHelpByCategory).forEach(([category, data]) => {
          if (!requestAdmin) {
            // Filter 'Simple' and 'Admin' commands from general help display
            if (category !== 'Simple' && category !== 'Admin') replyText += `\n${category}:${separator}/${data.join(`${separator}/`)}\n`;
          } else {
            if (category === 'Admin') replyText += `\n${category}:${separator}/admin ${data.join(`${separator}/admin `)}\n`;
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
singletonClient.on('messageCreate', DiscordClient.handleMessage);
singletonClient.on('interactionCreate', DiscordClient.handleInteraction);
singletonClient.on('rateLimit', (r) => logger.warn(`Rate limit: ${r}`));
singletonClient.on('error', logger.error);
