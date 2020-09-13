import { DiscordClient, MsgHandler as DiscordMessageHandler } from '../discord/discordBot';
import { TwitchClient, MsgHandler as TwitchMessageHandler } from '../twitch/twitchBot';
import { User } from '../../../models/user';
import type { CommandCategory } from '../../../types';

type chatType = 'twitch' | 'discord';
type commonAnonymousMessageHandler = (chatType: chatType, param?: string) => Promise<string>;
type commonRegisteredMessageHandler = (chatType: chatType, user: User, param?: string) => Promise<string>;

// For chatbot commands that don't require being registered with progbot
export interface CommonAnonymousCommand {
  cmd: string;
  category: CommandCategory;
  shortDescription: string;
  usageInfo: string;
  handler: commonAnonymousMessageHandler;
}

// For chatbot commands that require being registered with progbot (handler will get User object of caller)
export interface CommonRegisteredCommand {
  cmd: string;
  category: CommandCategory;
  shortDescription: string;
  usageInfo: string;
  handler: commonRegisteredMessageHandler;
}

export function registerCommonAnonymousCommand(command: CommonAnonymousCommand) {
  DiscordClient.registerCommand({
    cmd: command.cmd,
    category: command.category,
    shortDescription: command.shortDescription,
    usageInfo: command.usageInfo,
    handler: async (_msg, param) => command.handler('discord', param),
  });
  TwitchClient.registerCommand({
    cmd: command.cmd,
    category: command.category,
    shortDescription: command.shortDescription,
    usageInfo: command.usageInfo,
    handler: async (_chan, _user, _msg, param) => command.handler('twitch', param),
  });
}

export function registerCommonRegisteredHandler(command: CommonRegisteredCommand) {
  DiscordClient.registerCommand({
    cmd: command.cmd,
    category: command.category,
    shortDescription: command.shortDescription,
    usageInfo: command.usageInfo,
    handler: discordMessageWrapper(command.handler),
  });
  TwitchClient.registerCommand({
    cmd: command.cmd,
    category: command.category,
    shortDescription: command.shortDescription,
    usageInfo: command.usageInfo,
    handler: twitchMessageWrapper(command.handler),
  });
}

function discordMessageWrapper(handler: commonRegisteredMessageHandler): DiscordMessageHandler {
  return async (msg, param) => {
    const user = await User.findByDiscordId(msg.author.id);
    if (!user) return `You must be registered to use this function. Try ${DiscordClient.cmdPrefix}register first`;
    return handler('discord', user, param);
  };
}

function twitchMessageWrapper(handler: commonRegisteredMessageHandler): TwitchMessageHandler {
  return async (_chan, username, _msg, param) => {
    const user = await User.findByTwitchUsername(username);
    if (!user) return `You must be registered to use this function. Try ${TwitchClient.cmdPrefix}register first`;
    return handler('twitch', user, param);
  };
}
