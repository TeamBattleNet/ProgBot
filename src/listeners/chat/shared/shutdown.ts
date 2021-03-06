import { CommonAdminCommand } from './common';
import { shutdown } from '../../../index';

export const shutdownCmd: CommonAdminCommand = {
  cmd: 'shutdown',
  shortDescription: 'Shutdown the bot (may reboot bot if it is ran with some sort of restarting process manager)',
  usageInfo: `usage: shutdown`,
  handler: async () => {
    await shutdown();
    return '';
  },
};
