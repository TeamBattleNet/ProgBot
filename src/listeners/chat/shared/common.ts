import { DiscordClient } from '../discord/bot';
import { TwitchClient } from '../twitch/bot';

export type CommonChatBotMessageHandler = (param?: string) => Promise<string>;

export function registerCommonChatBotHandler(cmd: string, shortDescription: string, usageInfo: string, handler: CommonChatBotMessageHandler) {
  DiscordClient.registerCommandHandler(cmd, shortDescription, usageInfo, async (_msg, param) => handler(param));
  TwitchClient.registerCommandHandler(cmd, shortDescription, usageInfo, async (_chan, _user, _msg, param) => handler(param));
}
