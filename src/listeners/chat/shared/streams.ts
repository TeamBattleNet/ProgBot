import { CommonAnonymousCommand } from './common.js';
import { getActiveStreams } from '../../streamwatcher/streamAnnouncer.js';

export const streams: CommonAnonymousCommand = {
  cmd: 'streams',
  category: 'General',
  shortDescription: 'View the currently active BN-related streams',
  usageInfo: `usage: streams`,
  options: [],
  handler: async (ctx) => {
    const isDiscord = ctx.chatType === 'discord';
    const streams = await getActiveStreams();
    if (streams.length === 0) return 'There are no active streams!';
    // Special escape considerations for discord
    if (isDiscord)
      streams.forEach((stream) => {
        stream.displayName = stream.displayName.replace('_', '\\_');
        stream.url = `<${stream.url}>`;
      });
    const separator = isDiscord ? '!\n' : ': ';
    return streams.map((stream) => `${stream.displayName} is streaming ${stream.game}${separator}${stream.url}`).join(isDiscord ? '\n' : ' | ');
  },
};
