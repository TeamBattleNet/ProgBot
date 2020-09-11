import { CommonAnonymousCommand } from './common';

export const ping: CommonAnonymousCommand = {
  cmd: 'ping',
  shortDescription: 'Check if I am online',
  usageInfo: 'usage: ping',
  handler: async () => 'pong!',
};
