import 'source-map-support/register.js';
import 'reflect-metadata'; // for TypeORM
import { Database } from './clients/database.js';
import { TwitchApi } from './clients/twitchApi.js';
import { Chip } from './models/chip.js';
import { startWebserver, stopWebserver } from './listeners/webserver/server.js';
import { DiscordClient } from './listeners/chat/discord/discordBot.js';
import { TwitchIRCClient } from './listeners/chat/twitch/twitchIRC.js';
import { TwitchEventClient } from './listeners/pubsub/twitchEvents.js';
import { initializeChatBotHandlers } from './listeners/chat/index.js';
import { initializeChannelPointHandlers } from './listeners/pubsub/index.js';
import { scheduleStreamAnnouncer, unscheduleStreamAnnouncer } from './listeners/streamwatcher/streamAnnouncer.js';
import { getLogger } from './logger.js';
const logger = getLogger('main');

async function main() {
  logger.info('Starting progbot');
  await Database.initialize();
  logger.info('Loading chip cache');
  await Chip.loadCache();
  logger.info('Starting api server');
  await startWebserver();
  await initializeChatBotHandlers();
  logger.info('Connecting to twitch');
  await TwitchApi.initialize();
  await TwitchIRCClient.connect();
  initializeChannelPointHandlers();
  await TwitchEventClient.connect();
  logger.info('Connecting to discord');
  await DiscordClient.connect();
  scheduleStreamAnnouncer();
}

let stopSignalReceived = false;
export async function shutdown() {
  if (stopSignalReceived) {
    logger.error('Ungraceful forced termination - stop signal receieved multiple times');
    process.exit(1);
  }
  stopSignalReceived = true;
  logger.info('Shutting down - stop signal received');
  // Clean up and shutdown stuff here
  unscheduleStreamAnnouncer();
  await DiscordClient.shutdown();
  await TwitchEventClient.shutdown();
  await TwitchIRCClient.shutdown();
  await stopWebserver();
  await Database.shutdown();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((e) => {
  logger.error('Uncaught fatal error:', e);
  process.exit(1);
});
