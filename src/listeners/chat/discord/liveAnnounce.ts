import { DiscordCommand } from './discordBot';
import { AnnounceChannel } from '../../../models/announceChannel';
import { User } from '../../../models/user';

async function makeAnnounceChannelHandler(authorId: string, channelId: string, speedrunOnly: boolean) {
  const announceType = speedrunOnly ? 'speedrunlive' : 'live';
  const user = await User.findByDiscordId(authorId);
  if (!user || !user.isAdmin()) return 'Permission denied';
  const existingChannel = await AnnounceChannel.getChannel(channelId);
  if (existingChannel && existingChannel.announceTypes.has(announceType))
    return `This channel is already being used for${speedrunOnly ? ' speedrun' : ''} livestream announcements!`;
  await AnnounceChannel.addNewLiveChannel(channelId, speedrunOnly);
  return `This channel will be used when announcing${speedrunOnly ? ' speedrun' : ''} livestreams`;
}

export const makeAnnounceChannel: DiscordCommand = {
  cmd: 'makeannouncechannel',
  category: 'Admin',
  shortDescription: 'Mark the channel where this cmd is sent for use when announcing livestreams',
  usageInfo: 'usage: makeannouncechannel',
  handler: async (msg) => makeAnnounceChannelHandler(msg.author.id, msg.channel.id, false),
};

export const makeSpeedrunAnnounceChannel: DiscordCommand = {
  cmd: 'makespeedrunannouncechannel',
  category: 'Admin',
  shortDescription: 'Mark the channel where this cmd is sent for use when announcing speedrun livestreams',
  usageInfo: 'usage: makespeedrunannouncechannel',
  handler: async (msg) => makeAnnounceChannelHandler(msg.author.id, msg.channel.id, true),
};

export const removeAnnounceChannel: DiscordCommand = {
  cmd: 'removeannouncechannel',
  category: 'Admin',
  shortDescription: 'Remove the channel where this cmd is sent from use when announcing any livestreams',
  usageInfo: 'usage: removeannouncechannel',
  handler: async (msg) => {
    const user = await User.findByDiscordId(msg.author.id);
    if (!user || !user.isAdmin()) return 'Permission denied';
    const channel = await AnnounceChannel.getChannel(msg.channel.id);
    if (!channel || !['live', 'speedrunlive'].some(channel.announceTypes.has.bind(channel.announceTypes))) return 'This channel is not currently used to announce any livestreams!';
    channel.announceTypes.delete('live');
    channel.announceTypes.delete('speedrunlive');
    if (channel.announceTypes.size === 0) await channel.remove();
    else await channel.save();
    return 'This channel will no longer be used for any livestream announcements';
  },
};
