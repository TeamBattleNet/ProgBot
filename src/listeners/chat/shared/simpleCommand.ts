import { CommonAnonymousCommand, CommonAdminCommand, registerCommonAnonymousCommand } from './common';
import { wrap, parseNextWord, getEmote } from './utils';
import { DiscordClient } from '../discord/discordBot';
import { TwitchClient } from '../twitch/twitchBot';
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
    handler: async (ctx) => {
      const chan = (ctx.chatType === 'discord' ? ctx.discordMsg?.channel.id : ctx.twitchMsg?.target.value) || '';
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
  handler: async () => {
    const commands = await SimpleCommand.getAllCommands();
    return `Available Simple Commands:\n${commands.map((cmd) => cmd.cmd).join(', ')}`;
  },
};

export const addSimpleCommand: CommonAdminCommand = {
  cmd: 'addsimplecmd',
  shortDescription: 'Add a simple static response command to progbot',
  usageInfo: `usage: addsimplecommand <cmd> <response>
  In order to add an emote, use 'emote:MyEmoteName' in the response. This will be replaced with the
  appropriate discord or twitch emote as appropriate.

  example: addsimplecommand bn3notes Find notes for speedrunning BN3 here: https://totally.a.real.link
  example (with emote): addsimplecommand prog Hello emote:ProgChamp emote:TalkToDad`,
  handler: async (ctx, _user, param) => {
    const invalidSyntaxMessage = 'Invalid syntax. Try help addsimplecommand for usage information';
    if (!param) return invalidSyntaxMessage;
    const { word: cmd, remain: reply } = parseNextWord(param);
    if (!reply) return invalidSyntaxMessage;
    // Ensure this command does not already exist on a bot
    if (TwitchClient.doesCommandExist(cmd) || DiscordClient.doesCommandExist(cmd)) return `Command ${wrap(ctx, cmd)} already exists. Will not overwrite.`;
    for (const match of reply.match(emoteReplaceRegex) || []) {
      const emoteName = match.substring(6);
      if (!getEmote({ chatType: 'discord' }, emoteName) || !getEmote({ chatType: 'twitch' }, emoteName)) return `Error: Could not find emote ${wrap(ctx, emoteName)}`;
    }
    // Create the command, saving it to the db
    const newCmd = await SimpleCommand.createNewCommand(cmd, reply);
    // Register the new command handler immediately after saving to db
    registerCommonAnonymousCommand(simpleCommandToCommonAnonymousCommand(newCmd));
    return `New command ${wrap(ctx, cmd)} created!`;
  },
};

export const removeSimpleCommand: CommonAdminCommand = {
  cmd: 'removesimplecmd',
  shortDescription: 'Remove a simple command from progbot',
  usageInfo: `usage: removesimplecommand <cmd>
  example: removesimplecommand bn3notes`,
  handler: async (ctx, _user, param) => {
    if (!param) return 'Please provide a command to remove';
    const existingCmd = await SimpleCommand.getByCmd(param);
    if (!existingCmd) return `Could not find simple command ${wrap(ctx, param)} to remove`;
    await existingCmd.remove();
    TwitchClient.removeCommand(param);
    DiscordClient.removeCommand(param);
    return `Removed simple command ${wrap(ctx, param)} with reply:\n${existingCmd.reply}`;
  },
};
