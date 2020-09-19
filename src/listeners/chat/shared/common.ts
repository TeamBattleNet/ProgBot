import { DiscordClient, MsgHandler as DiscordMessageHandler } from '../discord/discordBot';
import { TwitchClient, MsgHandler as TwitchMessageHandler } from '../twitch/twitchBot';
import { User } from '../../../models/user';
import type { CommandCategory } from '../../../types';
import type { PrivateMessage as TwitchMessage } from 'twitch-chat-client';
import type { Message as DiscordMessage } from 'discord.js';

// If chat type is twitch, twitchMsg will be defined
// If chat type is discord, discordMsg will be defined
interface ChatContext {
  chatType: 'twitch' | 'discord';
  twitchMsg?: TwitchMessage;
  discordMsg?: DiscordMessage;
}

type commonAnonymousMessageHandler = (chatContext: ChatContext, param?: string) => Promise<string>;
type commonRegisteredMessageHandler = (chatContext: ChatContext, user: User, param?: string) => Promise<string>;

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
    handler: async (msg, param) => command.handler({ chatType: 'discord', discordMsg: msg }, param),
  });
  TwitchClient.registerCommand({
    cmd: command.cmd,
    category: command.category,
    shortDescription: command.shortDescription,
    usageInfo: command.usageInfo,
    handler: async (msg, param) => command.handler({ chatType: 'twitch', twitchMsg: msg }, param),
  });
}

export function registerCommonRegisteredCommand(command: CommonRegisteredCommand) {
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
    return handler({ chatType: 'discord', discordMsg: msg }, user, param);
  };
}

function twitchMessageWrapper(handler: commonRegisteredMessageHandler): TwitchMessageHandler {
  return async (msg, param) => {
    const userId = msg.userInfo.userId;
    if (!userId) throw new Error(`Couldn't find twitch user id for message by ${msg.userInfo.userName}`);
    const user = await User.findByTwitchUserId(userId);
    if (!user) return `You must be registered to use this function. Try ${TwitchClient.cmdPrefix}register first`;
    return handler({ chatType: 'twitch', twitchMsg: msg }, user, param);
  };
}
