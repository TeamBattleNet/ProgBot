import { CommonAnonymousCommand, CommonAdminCommand } from './common';
import { parseNextWord } from './utils';
import { Literally } from '../../../models/literally';

export const literally: CommonAnonymousCommand = {
  cmd: 'literally',
  category: 'General',
  shortDescription: 'You LITERALLY can not ...',
  usageInfo: `usage: literally [filter]
  literally - get a random 'literally' clip
  literally [filter] - get a random 'literally' clip with [filter]`,
  handler: async (_, param) => {
    const litObj = await Literally.getRandomLiterally(param);
    if (!litObj) return `Nothing found for ${param}!`;
    return `You LITERALLY can not ${litObj.what}: ${litObj.clip}`;
  },
};

export const addLiterally: CommonAdminCommand = {
  cmd: 'addliterally',
  shortDescription: 'Add a clip for the literally command',
  usageInfo: `usage: addliterally <clip/video link> <action>
  example: addliterally https://real.link die to gregar`,
  handler: async (ctx, user, param) => {
    const { word: link, remain: what } = parseNextWord(param || '');
    if (!what) return 'Invalid syntax. Try help addliterally for usage information';
    if (await Literally.isDuplicate(what, link)) return 'This is a duplicate entry! Not adding';
    await Literally.createNewLiterally(what, link);
    return 'New entry added for literally successfully';
  },
};
