import { CommonAnonymousCommand } from './common';
import { Quote } from '../../../models/quote';

export const quote: CommonAnonymousCommand = {
  cmd: 'quote',
  category: 'General',
  shortDescription: 'Get a random quote!',
  usageInfo: `usage: quote [filter]
  quote - get a random quote!
  quote [filter] - get a random quote that contains, or is from [filter]`,
  handler: async (_, param) => {
    const quoteObj = await Quote.getRandomQuote(param);
    if (!quoteObj) return `No quotes found containing, or from ${param}!`;
    let quoteStr = `${quoteObj.quote} - ${quoteObj.user}`;
    if (quoteObj.date) quoteStr += ` ${quoteObj.date}`;
    return quoteStr;
  },
};
