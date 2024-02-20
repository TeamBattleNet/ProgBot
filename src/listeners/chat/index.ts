import { registerCommonAnonymousCommand, registerCommonRegisteredCommand, registerCommonAdminCommand } from './shared/common.js';
import * as accountLink from './shared/accountLink.js';
import { DiscordClient } from './discord/discordBot.js';
import { TwitchIRCClient } from './twitch/twitchIRC.js';
import {
  enableCmdOnChannel,
  disableCmdOnChannel,
  listDisabledCmdsOnChannel,
  setMinBrowseTime,
  addAllowedTwitchChannel,
  listAllowedTwitchChannels,
  reloadAllowedTwitchChannels,
  removeAllowedTwitchChannel,
  authTwitchChannel,
  addChannelPointsIntegration,
  removeChannelPointsIntegration,
  listChannelPointsIntegrations,
} from './twitch/twitchChannel.js';
import { registerDiscord } from './discord/register.js';
import { generateApiKey } from './discord/apiKey.js';
import { makeAnnounceChannel, makeSpeedrunAnnounceChannel, removeAnnounceChannel } from './discord/liveAnnounce.js';
import { addTwitchStreamLiveChannel, removeTwitchStreamLiveChannel, listTwitchStreamLiveChannel } from './shared/liveChannel.js';
import { streams } from './shared/streams.js';
import { registerTwitch } from './twitch/register.js';
import { shutdownCmd } from './shared/shutdown.js';
import { ping } from './shared/ping.js';
import { getAllSimpleCommands, addSimpleCommand, removeSimpleCommand, listSimpleCommands } from './shared/simpleCommand.js';
import { quote, addQuote } from './shared/quote.js';
import { literally, addLiterally } from './shared/literally.js';
import { blame } from './shared/blame.js';
import { stylin } from './shared/style.js';

export async function initializeChatBotHandlers() {
  // Help
  registerCommonAnonymousCommand(ping);

  // General
  registerCommonAnonymousCommand(quote);
  registerCommonAdminCommand(addQuote);
  registerCommonAnonymousCommand(literally);
  registerCommonAdminCommand(addLiterally);
  registerCommonAnonymousCommand(blame);
  registerCommonRegisteredCommand(stylin);

  // Livestream Announcements
  DiscordClient.registerCommand(makeAnnounceChannel);
  DiscordClient.registerCommand(makeSpeedrunAnnounceChannel);
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
  TwitchIRCClient.registerCommand(registerTwitch);
  registerCommonRegisteredCommand(accountLink.startLinkCommon);
  registerCommonRegisteredCommand(accountLink.confirmLinkCommon);

  // Twitch Channels
  TwitchIRCClient.registerCommand(enableCmdOnChannel);
  TwitchIRCClient.registerCommand(disableCmdOnChannel);
  TwitchIRCClient.registerCommand(listDisabledCmdsOnChannel);
  TwitchIRCClient.registerCommand(setMinBrowseTime);
  registerCommonAdminCommand(addAllowedTwitchChannel);
  registerCommonAdminCommand(removeAllowedTwitchChannel);
  registerCommonAdminCommand(listAllowedTwitchChannels);
  registerCommonAdminCommand(reloadAllowedTwitchChannels);
  registerCommonAdminCommand(authTwitchChannel);
  registerCommonAdminCommand(addChannelPointsIntegration);
  registerCommonAdminCommand(removeChannelPointsIntegration);
  registerCommonAdminCommand(listChannelPointsIntegrations);
}
