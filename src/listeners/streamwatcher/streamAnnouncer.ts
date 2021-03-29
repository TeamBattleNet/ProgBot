import { DiscordClient } from '../chat/discord/discordBot';
import { AnnounceChannel } from '../../models/announceChannel';
import { TwitchApi } from '../../clients/twitch';
import { getLogger } from '../../logger';
const logger = getLogger('StreamAnnouncer');

const ANNOUNCE_CHECK_PERIOD_MS = 15000;
let interval: any = undefined;
const startTime = new Date();
const announcedStreams = new Set<string>();

const mmbnGameTwitchIds = [
  '7542', // Mega Man Battle Network
  '24465', // Rockman EXE Operate Shooting Star
  '4682', // Mega Man Battle Network 2
  '12105', // Mega Man Battle Network 3
  '544992838', // Mega Man Battle Network 3 Blue & White
  '1388250717', // Mega Man Battle Network 3 Blue
  '1550736308', // Mega Man Battle Network 3 White
  '3108', // Mega Man Battle Network 4
  '115596254', // Mega Man Battle Network 4 Red Sun
  '581486297', // Mega Man Battle Network 4 Blue Moon
  '1206553196', // Mega Man Battle Network 4 Red Sun & Blue Moon
  '10763', // Mega Man Battle Network 4.5: Real Operation
  '11522', // Mega Man Battle Network 5
  '324568485', // Mega Man Battle Network 5: Team Colonel
  '1465689050', // Mega Man Battle Network 5: Team Colonel & Protoman
  '1984284718', // Mega Man Battle Network 5: Team Protoman
  '9009', // Mega Man Battle Network 5: Double Team
  '2020525577', // Mega Man Battle Network 5: Double Team DS
  '7325', // Mega Man Battle Network 6
  '740052011', // Mega Man Battle Network 6: Cybeast Falzar
  '1565051033', // Mega Man Battle Network 6: Cybeast Gregar
  '17587', // Mega Man Battle Chip Challenge
  '861766602', // RockMan EXE N1 Battle
  '5831', // Mega Man Network Transmission
  '22528', // Rockman EXE WS
  '416185', // Mega Man Battle Network Chrono X
  '457859481', // Rockman EXE Battle Chip Stadium
  '113768894', // Rockman EXE The Medal Operation
  '1350', // Mega Man Star Force: Leo
  '1155000360', // Mega Man Star Force: Dragon
  '1808999901', // Mega Man Star Force: Pegasus
  '18770', // Mega Man Star Force 2: Zerker x Ninja
  '210749169', // Mega Man Star Force 2: Zerker x Saurian
  '19495', // Mega Man Star Force 3: Red Joker
  '71553216', // Mega Man Star Force 3: Black Ace
  '172137957', // Ryūsei no Rockman: Denpa Henkan! On Air!
];

// Not intended to be called directly outside of this module, only exported for testing
export async function checkAndAnnounceStreams() {
  logger.trace('Starting check for streams');
  try {
    // Fetch all streams and filter out streams that were already announced, or started before the bot was started (prevent duplicates)
    const streams = (await TwitchApi.getStreamsOfGames(mmbnGameTwitchIds)).filter((stream) => startTime < stream.start && !announcedStreams.has(stream.id));
    if (streams.length > 0) {
      logger.debug(`${streams.length} stream(s) to announce`);
      const announceChannels = await AnnounceChannel.getLiveAnnounceChannels();
      if (announceChannels.length > 0) {
        for (const stream of streams) {
          const announceMessage = `${stream.user} is live playing ${stream.game}\n${stream.url}\n${stream.title}`;
          await Promise.all(announceChannels.map((chan) => DiscordClient.sendMessage(chan.channel, announceMessage)));
          announcedStreams.add(stream.id);
        }
      } else {
        logger.info('Found new streams with no announce channels');
      }
    }
    logger.trace('Stream discovery/announce complete');
  } catch (e) {
    logger.error('Unexpected error fetching/announcing streams:', e);
  }
}

export function scheduleStreamAnnouncer() {
  interval = setInterval(checkAndAnnounceStreams, ANNOUNCE_CHECK_PERIOD_MS);
  logger.info(`Now scheduled to check for streams every ${ANNOUNCE_CHECK_PERIOD_MS / 1000} seconds`);
}

export function unscheduleStreamAnnouncer() {
  if (interval) clearInterval(interval);
}
