import { CommonAdminCommand } from './common.js';
import { shutdown } from '../../../index.js';

export const shutdownCmd: CommonAdminCommand = {
  cmd: 'shutdown',
  shortDescription: 'Shutdown the bot (may reboot bot if it is ran with some sort of restarting process manager)',
  usageInfo: `usage: shutdown`,
  options: [],
  handler: async () => {
    await shutdown();
    return '';
  },
};
