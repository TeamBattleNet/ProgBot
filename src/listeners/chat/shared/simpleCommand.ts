import { CommonAnonymousCommand, CommonAdminCommand, registerCommonAnonymousCommand } from './common';
import { wrap, parseNextWord, getEmote, getDiscordChannelId } from './utils';
import { DiscordClient } from '../discord/discordBot';
import { TwitchIRCClient } from '../twitch/twitchIRC';
import { SimpleCommand } from '../../../models/simpleCommand';

const emoteReplaceRegex = /emote:[^ ]+/gm;

const SIMPLE_MSG_LAST_SENT_CACHE: { [cmd: string]: { [chan: string]: Date | undefined } } = {};

function simpleCommandToCommonAnonymousCommand(cmd: SimpleCommand): CommonAnonymousCommand {
  SIMPLE_MSG_LAST_SENT_CACHE[cmd.cmd] = {}; // Setup cache for this new cmd
  return {
    cmd: cmd.cmd,
    category: 'Simple',
    shortDescription: cmd.cmd,
    usageInfo: `usage: ${cmd.cmd}`,
    options: [],
    handler: async (ctx) => {
      const chan = (ctx.chatType === 'discord' ? getDiscordChannelId(ctx.discordMsg!) : ctx.twitchMsg?.target) || '';
      const lastSent = SIMPLE_MSG_LAST_SENT_CACHE[cmd.cmd][chan];
      const now = new Date();
      // Don't re-send simple response if this cmd has been used in this channel in the last 5 seconds
      if (lastSent && now.getTime() - lastSent.getTime() < 5000) return '';
      SIMPLE_MSG_LAST_SENT_CACHE[cmd.cmd][chan] = now;
      const matches = cmd.reply.match(emoteReplaceRegex);
      if (!matches) return cmd.reply;
      let reply = cmd.reply;
      matches.forEach((match) => {
        const emoteName = match.substring(6);
        reply = reply.replace(match, getEmote(ctx, emoteName));
      });
      return reply;
    },
  };
}

export async function getAllSimpleCommands(): Promise<CommonAnonymousCommand[]> {
  const commands = await SimpleCommand.getAllCommands();
  return commands.map(simpleCommandToCommonAnonymousCommand);
}

export const listSimpleCommands: CommonAnonymousCommand = {
  cmd: 'listsimplecmds',
  category: 'General',
  shortDescription: 'View all of the simple commands that progbot currently has',
  usageInfo: 'usage: listsimplecommands',
  options: [],
  handler: async (ctx) => {
    const cmdPrefix = ctx.chatType === 'discord' ? DiscordClient.cmdPrefix : TwitchIRCClient.cmdPrefix;
    const commands = await SimpleCommand.getAllCommands();
    return `Available Simple Commands:\n${cmdPrefix}${commands.map((cmd) => cmd.cmd).join(`, ${cmdPrefix}`)}`;
  },
};

export const addSimpleCommand: CommonAdminCommand = {
  cmd: 'addsimplecmd',
  shortDescription: 'Add a simple static response command to progbot',
  usageInfo: `usage: addsimplecommand <cmd> <response>
  In order to add an emote, use 'emote:MyEmoteName' in the response.
  This will be replaced with the appropriate discord or twitch emote.

  example: addsimplecommand bn3notes Find notes for speedrunning BN3 here: https://totally.a.real.link
  example (with emote): addsimplecommand prog Hello emote:ProgChamp emote:TalkToDad`,
  options: [
    { name: 'command', desc: 'Name of the simple command to remove', required: true },
    { name: 'response', desc: 'Text of the response for this new command', required: true },
  ],
  handler: async (ctx, _user, param) => {
    let cmd = '';
    let reply = '';
    if (ctx.discordMsg?.cmd) {
      cmd = ctx.discordMsg?.cmd.options.getString('command', true);
      reply = ctx.discordMsg?.cmd.options.getString('response', true);
    } else {
      const invalidSyntaxMessage = 'Invalid syntax. Try help addsimplecommand for usage information';
      if (!param) return invalidSyntaxMessage;
      const parsed = parseNextWord(param);
      if (!parsed.remain) return invalidSyntaxMessage;
      cmd = parsed.word;
      reply = parsed.remain;
    }
    // Ensure this command does not already exist on a bot
    if (TwitchIRCClient.doesCommandExist(cmd) || DiscordClient.doesCommandExist(cmd)) return `Command ${wrap(ctx, cmd)} already exists. Will not overwrite.`;
    for (const match of reply.match(emoteReplaceRegex) || []) {
      const emoteName = match.substring(6);
      if (!getEmote({ chatType: 'discord' }, emoteName) || !getEmote({ chatType: 'twitch' }, emoteName)) return `Error: Could not find emote ${wrap(ctx, emoteName)}`;
    }
    // Create the command, saving it to the db
    const newCmd = await SimpleCommand.createNewCommand(cmd, reply);
    // Register the new command handler immediately after saving to db
    await registerCommonAnonymousCommand(simpleCommandToCommonAnonymousCommand(newCmd));
    return `New command ${wrap(ctx, cmd)} created!`;
  },
};

export const removeSimpleCommand: CommonAdminCommand = {
  cmd: 'removesimplecmd',
  shortDescription: 'Remove a simple command from progbot',
  usageInfo: `usage: removesimplecommand <cmd>
  example: removesimplecommand bn3notes`,
  options: [{ name: 'command', desc: 'Name of the simple command to remove', required: true }],
  handler: async (ctx, _user, param) => {
    let cmd = param;
    if (ctx.discordMsg?.cmd) cmd = ctx.discordMsg?.cmd.options.getString('command', true);
    if (!cmd) return 'Please provide a command to remove';
    const existingCmd = await SimpleCommand.getByCmd(cmd);
    if (!existingCmd) return `Could not find simple command ${wrap(ctx, cmd)} to remove`;
    await existingCmd.remove();
    TwitchIRCClient.removeCommand(cmd);
    DiscordClient.removeCommand(cmd);
    return `Removed simple command ${wrap(ctx, cmd)} with reply:\n${existingCmd.reply}`;
  },
};
