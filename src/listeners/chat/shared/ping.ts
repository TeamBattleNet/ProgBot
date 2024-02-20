import { CommonAnonymousCommand } from './common.js';

export const ping: CommonAnonymousCommand = {
  cmd: 'ping',
  category: 'Help',
  shortDescription: 'Check if I am online',
  usageInfo: 'usage: ping',
  options: [],
  handler: async () => 'pong!',
};
