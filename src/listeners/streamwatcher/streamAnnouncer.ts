import { DiscordClient } from '../chat/discord/discordBot';
import { AnnounceChannel } from '../../models/announceChannel';
import { TwitchApi } from '../../clients/twitch';
import { getLogger } from '../../logger';
const logger = getLogger('StreamAnnouncer');

const ANNOUNCE_CHECK_PERIOD_MS = 15000;
let interval: any = undefined;
const startTime = new Date();
// Keyed by stream id where number value is a miss-count for this stream when querying the api
const announcedStreams: { [streamId: string]: number } = {};

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
  logger.debug('Starting check for streams');
  try {
    const twitchChannels = (await AnnounceChannel.getStreamDetectionChannels()).map((chan) => chan.channel);
    // Fetch all streams and filter out streams that started before the bot was started (prevent duplicates if/when rebooting bot)
    let streams = (await TwitchApi.getStreamsOfUsers(twitchChannels)).concat(await TwitchApi.getStreamsOfGames(mmbnGameTwitchIds)).filter((stream) => startTime < stream.start);
    logger.trace(`Streams before filtering: ${streams}`);
    // Clean the announced cache by counting misses and removing streams that have been offline for some time
    Object.keys(announcedStreams).forEach((streamId) => {
      // Add miss-count to already announced stream if it didn't appear in our twitch api request
      if (!streams.some((stream) => stream.id === streamId)) announcedStreams[streamId] += 1;
      // Clear out streams from our announce cache that have been excluded from the API for the last few calls (are offline/completed)
      if (announcedStreams[streamId] > 5) delete announcedStreams[streamId];
    });
    // Filter out streams that have already been announced
    streams = streams.filter((stream) => announcedStreams[stream.id] === undefined);
    if (streams.length > 0) {
      logger.debug(`${streams.length} stream(s) to announce`);
      const announceChannels = await AnnounceChannel.getLiveAnnounceChannels();
      if (announceChannels.length > 0) {
        for (const stream of streams) {
          if (announcedStreams[stream.id] === undefined) {
            // Check if we have already announced again because there can be duplicates in our streams array
            const announceMessage = `${stream.user} is live playing: ${stream.game}\n<${stream.url}>\n${stream.title}`;
            await Promise.all(announceChannels.map((chan) => DiscordClient.sendMessage(chan.channel, announceMessage)));
            announcedStreams[stream.id] = 0;
          }
        }
      } else {
        logger.info('Found new streams with no announce channels');
        // Mark as announced so we don't incidentally build up a backlog if no announce channel is set
        streams.forEach((stream) => (announcedStreams[stream.id] = 0));
      }
    }
    logger.debug('Stream discovery/announce complete');
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
