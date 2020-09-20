import { CommonAnonymousCommand, CommonAdminCommand } from './common';
import { parseNextWord } from './utils';
import { Literally } from '../../../models/literally';

export const literally: CommonAnonymousCommand = {
  cmd: 'literally',
  category: 'General',
  shortDescription: 'You LITERALLY can not die',
  usageInfo: `usage: literally [filter]
  literally - get a random 'literally' clip
  literally [filter] - get a random 'literally' clip for death by [filter]`,
  handler: async (_, param) => {
    const litObj = await Literally.getRandomLiterally(param);
    if (!litObj) return `Nothing found for death by ${param}!`;
    return `You LITERALLY can not die to ${litObj.what}: ${litObj.clip}`;
  },
};

export const addLiterally: CommonAdminCommand = {
  cmd: 'addliterally',
  shortDescription: 'Add a clip for the literally command',
  usageInfo: `usage: addliterally <what> <clip/video link>
  example: addliterally gregar https://real.link`,
  handler: async (ctx, user, param) => {
    const { word: what, remain: link } = parseNextWord(param || '');
    if (!link) return 'Invalid syntax. Try help addliterally for usage information';
    if (await Literally.isDuplicate(what, link)) return 'This is a duplicate entry! Not adding';
    const litObj = new Literally();
    litObj.what = what;
    litObj.clip = link;
    await litObj.save();
    return 'New entry added for literally successfully';
  },
};
