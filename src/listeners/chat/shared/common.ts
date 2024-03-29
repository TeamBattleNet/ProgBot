import { DiscordClient, MsgHandler as DiscordMessageHandler, DiscordMsgOrCmd } from '../discord/discordBot.js';
import { TwitchIRCClient, MsgHandler as TwitchMessageHandler } from '../twitch/twitchIRC.js';
import { User } from '../../../models/user.js';
import { getDiscordUser } from './utils.js';
import type { CommandCategory } from '../../../types.js';
import type { ChatMessage as TwitchMessage } from '@twurple/chat';

// If chat type is twitch, twitchMsg will be defined
// If chat type is discord, discordMsg will be defined
export interface ChatContext {
  chatType: 'twitch' | 'discord';
  twitchMsg?: TwitchMessage;
  discordMsg?: DiscordMsgOrCmd;
}

type commonAnonymousMessageHandler = (chatContext: ChatContext, param?: string) => Promise<string>;
type commonRegisteredMessageHandler = (chatContext: ChatContext, user: User, param?: string) => Promise<string>;

// For chatbot commands that don't require being registered with progbot
export interface CommonAnonymousCommand {
  cmd: string;
  category: CommandCategory;
  shortDescription: string;
  usageInfo: string;
  options: { name: string; desc: string; required: boolean }[];
  handler: commonAnonymousMessageHandler;
}

// For chatbot commands that require being registered with progbot (handler will get User object of caller)
export interface CommonRegisteredCommand {
  cmd: string;
  category: CommandCategory;
  shortDescription: string;
  usageInfo: string;
  options: { name: string; desc: string; required: boolean }[];
  handler: commonRegisteredMessageHandler;
}

// For chatbot commands that require being an admin of progbot (handler will get User object of caller)
export interface CommonAdminCommand {
  cmd: string;
  // No category because all admin commands will be considered category 'Admin'
  shortDescription: string;
  usageInfo: string;
  options: { name: string; desc: string; required: boolean }[];
  handler: commonRegisteredMessageHandler;
}

export function registerCommonAnonymousCommand(command: CommonAnonymousCommand) {
  DiscordClient.registerCommand({
    cmd: command.cmd,
    category: command.category,
    shortDescription: command.shortDescription,
    usageInfo: command.usageInfo,
    options: command.options,
    handler: async (msg, param) => command.handler({ chatType: 'discord', discordMsg: msg }, param),
  });
  TwitchIRCClient.registerCommand({
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
    options: command.options,
    handler: discordMessageWrapper(command.handler, false),
  });
  TwitchIRCClient.registerCommand({
    cmd: command.cmd,
    category: command.category,
    shortDescription: command.shortDescription,
    usageInfo: command.usageInfo,
    handler: twitchMessageWrapper(command.handler, false),
  });
}

export function registerCommonAdminCommand(command: CommonAdminCommand) {
  DiscordClient.registerCommand({
    cmd: command.cmd,
    category: 'Admin',
    shortDescription: command.shortDescription,
    usageInfo: command.usageInfo,
    options: command.options,
    handler: discordMessageWrapper(command.handler, true),
  });
  TwitchIRCClient.registerCommand({
    cmd: command.cmd,
    category: 'Admin',
    shortDescription: command.shortDescription,
    usageInfo: command.usageInfo,
    handler: twitchMessageWrapper(command.handler, true),
  });
}

function discordMessageWrapper(handler: commonRegisteredMessageHandler, adminRequired: boolean): DiscordMessageHandler {
  return async (msg, param) => {
    const user = await User.findByDiscordId(getDiscordUser(msg).id);
    if (!user) return `You must be registered to use this function. Try /register first`;
    if (adminRequired && !user.isAdmin()) return 'Permission denied';
    return handler({ chatType: 'discord', discordMsg: msg }, user, param);
  };
}

function twitchMessageWrapper(handler: commonRegisteredMessageHandler, adminRequired: boolean): TwitchMessageHandler {
  return async (msg, param) => {
    const userId = msg.userInfo.userId;
    if (!userId) throw new Error(`Couldn't find twitch user id for message by ${msg.userInfo.userName}`);
    const user = await User.findByTwitchUserId(userId);
    if (!user) return `You must be registered to use this function. Try ${TwitchIRCClient.cmdPrefix}register first`;
    if (adminRequired && !user.isAdmin()) return 'Permission denied';
    return handler({ chatType: 'twitch', twitchMsg: msg }, user, param);
  };
}
