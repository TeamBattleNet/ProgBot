import { registerCommonAnonymousCommand, registerCommonRegisteredCommand, registerCommonAdminCommand } from './shared/common';
import * as accountLink from './shared/accountLink';
import { DiscordClient } from './discord/discordBot';
import { TwitchClient } from './twitch/twitchBot';
import {
  enableCmdOnChannel,
  disableCmdOnChannel,
  listDisabledCmdsOnChannel,
  setMinBrowseTime,
  addAllowedTwitchChannel,
  listAllowedTwitchChannels,
  reloadAllowedTwitchChannels,
  removeAllowedTwitchChannel,
} from './twitch/twitchChannel';
import { registerDiscord } from './discord/register';
import { generateApiKey } from './discord/apiKey';
import { makeAnnounceChannel, removeAnnounceChannel } from './discord/liveAnnounce';
import { addTwitchStreamLiveChannel, removeTwitchStreamLiveChannel, listTwitchStreamLiveChannel } from './shared/liveChannel';
import { streams } from './shared/streams';
import { registerTwitch } from './twitch/register';
import { shutdownCmd } from './shared/shutdown';
import { ping } from './shared/ping';
import { getAllSimpleCommands, addSimpleCommand, removeSimpleCommand, listSimpleCommands } from './shared/simpleCommand';
import { quote, addQuote } from './shared/quote';
import { literally, addLiterally } from './shared/literally';
import { blame } from './shared/blame';

export async function initializeChatBotHandlers() {
  // Help
  registerCommonAnonymousCommand(ping);

  // General
  registerCommonAnonymousCommand(quote);
  registerCommonAdminCommand(addQuote);
  registerCommonAnonymousCommand(literally);
  registerCommonAdminCommand(addLiterally);
  registerCommonAnonymousCommand(blame);

  // Livestream Announcements
  DiscordClient.registerCommand(makeAnnounceChannel);
  DiscordClient.registerCommand(removeAnnounceChannel);
  registerCommonAdminCommand(addTwitchStreamLiveChannel);
  registerCommonAdminCommand(removeTwitchStreamLiveChannel);
  registerCommonAdminCommand(listTwitchStreamLiveChannel);
  registerCommonAnonymousCommand(streams);

  // Misc
  registerCommonAdminCommand(shutdownCmd);

  // Simple Commands
  (await getAllSimpleCommands()).forEach(registerCommonAnonymousCommand);
  registerCommonAnonymousCommand(listSimpleCommands);
  registerCommonAdminCommand(addSimpleCommand);
  registerCommonAdminCommand(removeSimpleCommand);

  // Accounts
  DiscordClient.registerCommand(generateApiKey);
  // cannot whisper with twitch bots right now, so we can't privately send api keys to users in twitch Ref: https://github.com/tmijs/tmi.js/issues/333
  DiscordClient.registerCommand(registerDiscord);
  TwitchClient.registerCommand(registerTwitch);
  registerCommonRegisteredCommand(accountLink.startLinkCommon);
  registerCommonRegisteredCommand(accountLink.confirmLinkCommon);

  // Twitch Channels
  TwitchClient.registerCommand(enableCmdOnChannel);
  TwitchClient.registerCommand(disableCmdOnChannel);
  TwitchClient.registerCommand(listDisabledCmdsOnChannel);
  TwitchClient.registerCommand(setMinBrowseTime);
  registerCommonAdminCommand(addAllowedTwitchChannel);
  registerCommonAdminCommand(removeAllowedTwitchChannel);
  registerCommonAdminCommand(listAllowedTwitchChannels);
  registerCommonAdminCommand(reloadAllowedTwitchChannels);
}
