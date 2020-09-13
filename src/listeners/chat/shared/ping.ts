import { CommonAnonymousCommand } from './common';

export const ping: CommonAnonymousCommand = {
  cmd: 'ping',
  category: 'Help',
  shortDescription: 'Check if I am online',
  usageInfo: 'usage: ping',
  handler: async () => 'pong!',
};
