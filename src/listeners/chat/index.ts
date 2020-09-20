import { registerCommonAnonymousCommand, registerCommonRegisteredCommand } from './shared/common';
import * as accountLink from './shared/accountLink';
import { DiscordClient } from './discord/discordBot';
import { TwitchClient } from './twitch/twitchBot';
import { registerDiscord } from './discord/register';
import { generateApiKey } from './discord/apiKey';
import { registerTwitch } from './twitch/register';
import { ping } from './shared/ping';
import { getAllStaticCommands } from './shared/staticCommands';
import { quote } from './shared/quote';
import { literally } from './shared/literally';
import { blame } from './shared/blame';

export async function initializeChatBotHandlers() {
  // Help
  registerCommonAnonymousCommand(ping);

  // General
  registerCommonAnonymousCommand(quote);
  registerCommonAnonymousCommand(literally);
  registerCommonAnonymousCommand(blame);

  // Static
  (await getAllStaticCommands()).forEach(registerCommonAnonymousCommand);

  // Accounts
  DiscordClient.registerCommand(generateApiKey);
  // cannot whisper with twitch bots right now, so we can't privately send api keys to users in twitch Ref: https://github.com/tmijs/tmi.js/issues/333
  DiscordClient.registerCommand(registerDiscord);
  TwitchClient.registerCommand(registerTwitch);
  registerCommonRegisteredCommand(accountLink.startLinkCommon);
  registerCommonRegisteredCommand(accountLink.confirmLinkCommon);
}
