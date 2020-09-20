import { CommonAnonymousCommand, CommonAdminCommand, registerCommonAnonymousCommand } from './common';
import { wrap, parseNextWord } from './utils';
import { DiscordClient } from '../discord/discordBot';
import { TwitchClient } from '../twitch/twitchBot';
import { SimpleCommand } from '../../../models/simpleCommand';

function simpleCommandToCommonAnonymousCommand(cmd: SimpleCommand): CommonAnonymousCommand {
  return {
    cmd: cmd.cmd,
    category: 'Simple',
    shortDescription: cmd.cmd,
    usageInfo: `usage: ${cmd.cmd}`,
    handler: async () => cmd.reply,
  };
}

export async function getAllSimpleCommands(): Promise<CommonAnonymousCommand[]> {
  const commands = await SimpleCommand.getAllCommands();
  return commands.map(simpleCommandToCommonAnonymousCommand);
}

export const listSimpleCommands: CommonAnonymousCommand = {
  cmd: 'listsimplecommands',
  category: 'General',
  shortDescription: 'View all of the simple commands that progbot currently has',
  usageInfo: 'usage: listsimplecommands',
  handler: async () => {
    const commands = await SimpleCommand.getAllCommands();
    return `Available Simple Commands:\n${commands.map(cmd => cmd.cmd).join(', ')}`;
  }
}

export const addSimpleCommand: CommonAdminCommand = {
  cmd: 'addsimplecommand',
  shortDescription: 'Add a simple static response command to progbot',
  usageInfo: `usage: addsimplecommand <cmd> <response>
  example: addsimplecommand bn3notes Find notes for speedrunning BN3 here: https://totally.a.real.link`,
  handler: async (ctx, _user, param) => {
    const invalidSyntaxMessage = 'Invalid syntax. Try help addsimplecommand for usage information';
    if (!param) return invalidSyntaxMessage;
    const { word: cmd, remain: reply } = parseNextWord(param);
    if (!reply) return invalidSyntaxMessage;
    // Ensure this command does not already exist on a bot
    if (TwitchClient.doesCommandExist(cmd) || DiscordClient.doesCommandExist(cmd)) return `Command ${wrap(ctx, cmd)} already exists. Will not overwrite.`;
    // Create the command, saving it to the db
    const newCmd = new SimpleCommand();
    newCmd.cmd = cmd;
    newCmd.reply = reply;
    await newCmd.save();
    // Register the new command handler immediately after saving to db
    registerCommonAnonymousCommand(simpleCommandToCommonAnonymousCommand(newCmd));
    return `New command ${wrap(ctx, cmd)} created!`;
  },
};

export const removeSimpleCommand: CommonAdminCommand = {
  cmd: 'removesimplecommand',
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
