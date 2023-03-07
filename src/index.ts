import 'source-map-support/register';
import 'reflect-metadata'; // for TypeORM
import { Database } from './clients/database';
import { TwitchApi } from './clients/twitchApi';
import { Chip } from './models/chip';
import { startWebserver, stopWebserver } from './listeners/webserver/server';
import { DiscordClient } from './listeners/chat/discord/discordBot';
import { TwitchIRCClient } from './listeners/chat/twitch/twitchIRC';
import { TwitchEventClient } from './listeners/pubsub/twitchEvents';
import { initializeChatBotHandlers } from './listeners/chat';
import { initializeChannelPointHandlers } from './listeners/pubsub';
import { scheduleStreamAnnouncer, unscheduleStreamAnnouncer } from './listeners/streamwatcher/streamAnnouncer';
import { getLogger } from './logger';
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
