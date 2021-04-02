import { TwitchApi } from '../../../clients/twitchApi';
import { CommonAdminCommand } from './common';
import { AnnounceChannel } from '../../../models/announceChannel';

export const addTwitchStreamLiveChannel: CommonAdminCommand = {
  cmd: 'addtwitchstreamlivechannel',
  shortDescription: 'Add a twitch channel which should always be announced when going live (regardless of the game)',
  usageInfo: `usage: addtwitchstreamlivechannel <twitch_username>
  example: addtwitchstreamlivechannel teambn`,
  handler: async (ctx, user, param) => {
    if (!param) return 'Invalid syntax. Please provide a twitch channel username';
    const twitchID = await TwitchApi.getTwitchUserID(param);
    if (!twitchID) return `Could not find a twitch channel named '${param}'`;
    const existingChannel = await AnnounceChannel.getChannel(twitchID);
    if (existingChannel && existingChannel.announceTypes.has('stream')) return `Twitch channel '${param}' is already being announced for all livestreams!`;
    await AnnounceChannel.addNewStreamChannel(twitchID);
    return `Twitch channel '${param}' will have all livestreams announced`;
  },
};

export const removeTwitchStreamLiveChannel: CommonAdminCommand = {
  cmd: 'removetwitchstreamlivechannel',
  shortDescription: 'Remove a twitch channel so that non-mmbn streams from the channel are not announced',
  usageInfo: `usage: removetwitchstreamlivechannel <twitch_username>
  example: removetwitchstreamlivechannel teambn`,
  handler: async (ctx, user, param) => {
    if (!param) return 'Invalid syntax. Please provide a twitch channel username';
    const twitchID = await TwitchApi.getTwitchUserID(param);
    if (!twitchID) return `Could not find a twitch channel named '${param}'`;
    const channel = await AnnounceChannel.getChannel(twitchID);
    if (!channel || !channel.announceTypes.has('stream')) return `Twitch channel '${param}' is not being announced for all livestreams!`;
    channel.announceTypes.delete('stream');
    if (channel.announceTypes.size === 0) await channel.remove();
    else await channel.save();
    return `Twitch channel '${param}' will no longer be announced for all livestreams`;
  },
};

export const listTwitchStreamLiveChannel: CommonAdminCommand = {
  cmd: 'listtwitchstreamlivechannels',
  shortDescription: 'List the twitch channels whose livestreams will always be announced regardless of the game',
  usageInfo: `usage: listtwitchstreamlivechannels`,
  handler: async () => {
    const channels = await AnnounceChannel.getStreamDetectionChannels();
    const twitchUsernames = await TwitchApi.getTwitchUserNames(channels.map((chan) => chan.channel));
    if (twitchUsernames.length === 0) return 'There are no twitch channels currently set to announce all livestreams';
    return `The following twitch channels will have all livestreams announced regardless of game: ${twitchUsernames.join(', ')}`;
  },
};
