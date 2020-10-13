import { CommonAdminCommand } from './common';
import { shutdown } from '../../../index';

export const addLiterally: CommonAdminCommand = {
  cmd: 'shutdown',
  shortDescription: 'Shutdown the bot (may reboot bot is ran with a process manager',
  usageInfo: `usage: shutdown`,
  handler: async () => {
    await shutdown();
    return '';
  }
};