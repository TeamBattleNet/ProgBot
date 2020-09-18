import { CommonAnonymousCommand } from './common';
import { StaticCommand } from '../../../models/staticCommand';

export async function getAllStaticCommands(): Promise<CommonAnonymousCommand[]> {
  const commands = await StaticCommand.getAllCommands();
  return commands.map((cmdObj) => {
    return {
      cmd: cmdObj.cmd,
      category: 'Static',
      shortDescription: cmdObj.cmd,
      usageInfo: `usage: ${cmdObj.cmd}`,
      handler: async () => cmdObj.reply,
    };
  });
}
