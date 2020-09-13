import 'source-map-support/register';
import 'reflect-metadata'; // for TypeORM
import { Database } from './clients/database';
import { startWebserver, stopWebserver } from './listeners/webserver/server';
import { DiscordClient } from './listeners/chat/discord/discordBot';
import { TwitchClient } from './listeners/chat/twitch/twitchBot';
import { initializeChatBotHandlers } from './listeners/chat';
import { getLogger } from './logger';
const logger = getLogger('main');

async function main() {
  logger.info('Starting progbot');
  await Database.initialize();
  logger.info('Starting api server');
  await startWebserver();
  initializeChatBotHandlers();
  logger.info('Connecting to twitch');
  await TwitchClient.connect();
  logger.info('Connecting to discord');
  await DiscordClient.connect();
}

let stopSignalReceived = false;
async function shutdown() {
  if (stopSignalReceived) {
    logger.error('Ungraceful forced termination - stop signal receieved multiple times');
    process.exit(1);
  }
  stopSignalReceived = true;
  logger.info('Shutting down - stop signal received');
  // Clean up and shutdown stuff here
  await DiscordClient.shutdown();
  await TwitchClient.shutdown();
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
