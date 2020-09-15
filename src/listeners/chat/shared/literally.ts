import { CommonAnonymousCommand } from './common';
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
