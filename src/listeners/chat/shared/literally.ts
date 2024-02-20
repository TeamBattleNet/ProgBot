import { CommonAnonymousCommand, CommonAdminCommand } from './common.js';
import { parseNextWord } from './utils.js';
import { Literally } from '../../../models/literally.js';

export const literally: CommonAnonymousCommand = {
  cmd: 'literally',
  category: 'General',
  shortDescription: 'You LITERALLY can not ...',
  usageInfo: `usage: literally [filter]
  literally - get a random 'literally' clip
  literally [filter] - get a random 'literally' clip with [filter]`,
  options: [{ name: 'filter', desc: 'Text to search and filter results with', required: false }],
  handler: async (ctx, param) => {
    let filter = param;
    if (ctx.discordMsg?.cmd) filter = ctx.discordMsg?.cmd.options.getString('filter', false) || undefined;
    const litObj = await Literally.getRandomLiterally(filter);
    if (!litObj) return `I literally can not find a clip of that!`;
    return `You LITERALLY can not ${litObj.what}: ${litObj.clip}`;
  },
};

export const addLiterally: CommonAdminCommand = {
  cmd: 'addliterally',
  shortDescription: 'Add a clip for the literally command',
  usageInfo: `usage: addliterally <clip/video link> <action>
  example: addliterally https://real.link die to gregar`,
  options: [
    { name: 'link', desc: 'Link to the clip/video for this "literally"', required: true },
    { name: 'action', desc: 'Text that you "literally can not" i.e. "die to gregar"', required: true },
  ],
  handler: async (ctx, user, param) => {
    let what = '';
    let link = '';
    if (ctx.discordMsg?.cmd) {
      what = ctx.discordMsg?.cmd.options.getString('action', true);
      link = ctx.discordMsg?.cmd.options.getString('link', true);
    } else {
      const parsed = parseNextWord(param || '');
      link = parsed.word;
      what = parsed.remain || '';
      if (!what) return 'Invalid syntax. Try help addliterally for usage information';
    }
    if (await Literally.isDuplicate(what, link)) return 'This is a duplicate entry! Not adding';
    await Literally.createNewLiterally(what, link);
    return 'New entry added for literally successfully';
  },
};
