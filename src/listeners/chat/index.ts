import { registerCommonAnonymousCommand } from './shared/common';
import * as accountLink from './shared/accountLink';
import { DiscordClient } from './discord/discordBot';
import { TwitchClient } from './twitch/twitchBot';
import { registerDiscord } from './discord/register';
import { generateApiKey } from './discord/apiKey';
import { registerTwitch } from './twitch/register';
import { ping } from './shared/ping';

export function initializeChatBotHandlers() {
  registerCommonAnonymousCommand(ping);
  DiscordClient.registerCommand(generateApiKey);
  // cannot whisper with twitch bots right now, so we can't privately send api keys to users in twitch Ref: https://github.com/tmijs/tmi.js/issues/333
  DiscordClient.registerCommand(registerDiscord);
  TwitchClient.registerCommand(registerTwitch);
  DiscordClient.registerCommand(accountLink.startLinkDiscord);
  TwitchClient.registerCommand(accountLink.startLinkTwitch);
  DiscordClient.registerCommand(accountLink.confirmLinkDiscord);
  TwitchClient.registerCommand(accountLink.confirmLinkTwitch);
}
