import { CommonAnonymousCommand, CommonAdminCommand, registerCommonAnonymousCommand } from './common';
import { wrap } from './utils';
import { DiscordClient } from '../discord/discordBot';
import { TwitchClient } from '../twitch/twitchBot';
import { StaticCommand } from '../../../models/staticCommand';

function staticCommandToCommonAnonymousCommand(cmd: StaticCommand): CommonAnonymousCommand {
  return {
    cmd: cmd.cmd,
    category: 'Static',
    shortDescription: cmd.cmd,
    usageInfo: `usage: ${cmd.cmd}`,
    handler: async () => cmd.reply,
  };
}

export async function getAllStaticCommands(): Promise<CommonAnonymousCommand[]> {
  const commands = await StaticCommand.getAllCommands();
  return commands.map(staticCommandToCommonAnonymousCommand);
}

export const addStaticCommand: CommonAdminCommand = {
  cmd: 'addcommandprog',
  shortDescription: 'Add a simple static response command to progbot',
  usageInfo: `usage: addcommandprog [cmd] [response]
  example: addcommandprog bn3notes Find notes for speedrunning BN3 here: https://totally.a.real.link`,
  handler: async (ctx, _user, param) => {
    const invalidSyntaxMessage = 'Invalid syntax. Try help addcommandprog for usage information';
    if (!param) return invalidSyntaxMessage;
    const sep = param.indexOf(' ');
    if (sep === -1) return invalidSyntaxMessage;
    const cmd = param.substring(0, sep);
    const reply = param.substring(sep).trim();
    if (!reply) return invalidSyntaxMessage;
    // Ensure this command does not already exist on a bot
    if (TwitchClient.doesCommandExist(cmd) || DiscordClient.doesCommandExist(cmd)) return `Command ${wrap(ctx, cmd)} already exists. Will not overwrite.`;
    // Create the command, saving it to the db
    const newCmd = new StaticCommand();
    newCmd.cmd = cmd;
    newCmd.reply = reply;
    await newCmd.save();
    // Register the new command handler immediately after saving to db
    registerCommonAnonymousCommand(staticCommandToCommonAnonymousCommand(newCmd));
    return `New command ${wrap(ctx, cmd)} created!`;
  },
};

export const removeStaticCommand: CommonAdminCommand = {
  cmd: 'removecommandprog',
  shortDescription: 'Remove a simple static response command from progbot',
  usageInfo: `usage: removecommandprog [cmd]
  example: removecommandprog bn3notes`,
  handler: async (ctx, _user, param) => {
    if (!param) return 'Please provide a command to remove';
    const existingCmd = await StaticCommand.getByCmd(param);
    if (!existingCmd) return `Could not find static command ${wrap(ctx, param)} to remove`;
    await existingCmd.remove();
    TwitchClient.removeCommand(param);
    DiscordClient.removeCommand(param);
    return `Removed static command ${wrap(ctx, param)} with reply:\n${existingCmd.reply}`;
  },
};
