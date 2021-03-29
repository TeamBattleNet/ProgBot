import { DiscordCommand } from './discordBot';
import { AnnounceChannel } from '../../../models/announceChannel';
import { User } from '../../../models/user';

export const makeAnnounceChannel: DiscordCommand = {
  cmd: 'makeannouncechannel',
  category: 'Admin',
  shortDescription: 'Mark the channel where this cmd is sent for use when announcing livestreams',
  usageInfo: 'usage: makeannouncechannel',
  handler: async (msg) => {
    const user = await User.findByDiscordId(msg.author.id);
    if (!user || !user.isAdmin()) return 'Permission denied';
    const existingChannel = await AnnounceChannel.getChannel(msg.channel.id);
    if (existingChannel && existingChannel.announceTypes.has('live')) return 'This channel is already being used for livestream announcements!';
    await AnnounceChannel.addNewLiveChannel(msg.channel.id);
    return 'This channel will be used when announcing livestreams';
  },
};

export const removeAnnounceChannel: DiscordCommand = {
  cmd: 'removeannouncechannel',
  category: 'Admin',
  shortDescription: 'Remove the channel where this cmd is sent from use when announcing livestreams',
  usageInfo: 'usage: removeannouncechannel',
  handler: async (msg) => {
    const user = await User.findByDiscordId(msg.author.id);
    if (!user || !user.isAdmin()) return 'Permission denied';
    const channel = await AnnounceChannel.getChannel(msg.channel.id);
    if (!channel || !channel.announceTypes.has('live')) return 'This channel is not currently used to announce livestreams!';
    channel.announceTypes.delete('live');
    if (channel.announceTypes.size === 0) await channel.remove();
    else await channel.save();
    return 'This channel will no longer be used for livestream announcements';
  },
};
