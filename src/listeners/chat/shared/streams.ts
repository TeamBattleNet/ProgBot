import { CommonAnonymousCommand } from './common';
import { getActiveStreams } from '../../streamwatcher/streamAnnouncer';

export const streams: CommonAnonymousCommand = {
  cmd: 'streams',
  category: 'General',
  shortDescription: 'View the currently active BN-related streams',
  usageInfo: `usage: streams`,
  handler: async (ctx) => {
    const isDiscord = ctx.chatType === 'discord';
    const streams = await getActiveStreams();
    if (streams.length === 0) return 'There are no active streams!';
    // Special escape considerations for discord
    if (isDiscord)
      streams.forEach((stream) => {
        stream.user = stream.user.replace('_', '\\_');
        stream.url = `<${stream.url}>`;
      });
    return streams.map((stream) => `${stream.user} is streaming ${stream.game}: ${stream.url}`).join(isDiscord ? '\n' : ' | ');
  },
};
