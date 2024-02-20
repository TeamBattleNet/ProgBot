import { TwitchApi } from '../../../clients/twitchApi.js';
import { CommonAdminCommand } from './common.js';
import { AnnounceChannel } from '../../../models/announceChannel.js';

export const addTwitchStreamLiveChannel: CommonAdminCommand = {
  cmd: 'addtwitchstreamlivechannel',
  shortDescription: 'Add a twitch channel which should always be announced when going live (regardless of the game)',
  usageInfo: `usage: addtwitchstreamlivechannel <twitch_username>
  example: addtwitchstreamlivechannel teambn`,
  options: [{ name: 'username', desc: 'The username of the twitch channel to add for livestream announcements', required: true }],
  handler: async (ctx, user, param) => {
    let username = param;
    if (ctx.discordMsg?.cmd) username = ctx.discordMsg?.cmd.options.getString('username', true);
    if (!username) return 'Invalid syntax. Please provide a twitch channel username';
    const twitchID = await TwitchApi.getTwitchUserID(username);
    if (!twitchID) return `Could not find a twitch channel named '${username}'`;
    const existingChannel = await AnnounceChannel.getChannel(twitchID);
    if (existingChannel && existingChannel.announceTypes.has('stream')) return `Twitch channel '${username}' is already being announced for all livestreams!`;
    await AnnounceChannel.addNewStreamChannel(twitchID);
    return `Twitch channel '${username}' will have all livestreams announced`;
  },
};

export const removeTwitchStreamLiveChannel: CommonAdminCommand = {
  cmd: 'removetwitchstreamlivechannel',
  shortDescription: 'Remove a twitch channel so that non-mmbn streams from the channel are not announced',
  usageInfo: `usage: removetwitchstreamlivechannel <twitch_username>
  example: removetwitchstreamlivechannel teambn`,
  options: [{ name: 'username', desc: 'The username of the twitch channel to remove from non-mmbn livestream announcements', required: true }],
  handler: async (ctx, user, param) => {
    let username = param;
    if (ctx.discordMsg?.cmd) username = ctx.discordMsg?.cmd.options.getString('username', true);
    if (!username) return 'Invalid syntax. Please provide a twitch channel username';
    const twitchID = await TwitchApi.getTwitchUserID(username);
    if (!twitchID) return `Could not find a twitch channel named '${username}'`;
    const channel = await AnnounceChannel.getChannel(twitchID);
    if (!channel || !channel.announceTypes.has('stream')) return `Twitch channel '${username}' is not being announced for all livestreams!`;
    channel.announceTypes.delete('stream');
    if (channel.announceTypes.size === 0) await channel.remove();
    else await channel.save();
    return `Twitch channel '${username}' will no longer be announced for all livestreams`;
  },
};

export const listTwitchStreamLiveChannel: CommonAdminCommand = {
  cmd: 'listtwitchstreamlivechannels',
  shortDescription: 'List the twitch channels whose livestreams will always be announced regardless of the game',
  usageInfo: `usage: listtwitchstreamlivechannels`,
  options: [],
  handler: async () => {
    const channels = await AnnounceChannel.getStreamDetectionChannels();
    const twitchUsernames = await TwitchApi.getTwitchUserNames(channels.map((chan) => chan.channel));
    if (twitchUsernames.length === 0) return 'There are no twitch channels currently set to announce all livestreams';
    return `The following twitch channels will have all livestreams announced regardless of game: ${twitchUsernames.join(', ')}`;
  },
};
