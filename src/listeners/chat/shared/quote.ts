import { CommonAnonymousCommand, CommonAdminCommand } from './common';
import { parseNextWord, wrap } from './utils';
import { Quote } from '../../../models/quote';

const optionalDateRegex = /^\[(.*)\](.*)/;

export const quote: CommonAnonymousCommand = {
  cmd: 'quote',
  category: 'General',
  shortDescription: 'Get a random quote!',
  usageInfo: `usage: quote [filter]
  quote - get a random quote!
  quote [filter] - get a random quote that contains, or is from [filter]`,
  handler: async (ctx, param) => {
    const quoteObj = await Quote.getRandomQuote(param);
    if (!quoteObj) return `No quotes found containing, or from ${wrap(ctx, param)}!`;
    let quoteStr = `${quoteObj.quote} - ${quoteObj.user}`;
    if (quoteObj.date) quoteStr += ` ${quoteObj.date}`;
    return quoteStr;
  },
};

export const addQuote: CommonAdminCommand = {
  cmd: 'addquote',
  shortDescription: 'Add a quote for the quote command',
  usageInfo: `usage: addquote <user> [date] <quote>
  The date is optional, and if added, must be between [] brackets after the user and before the quote
    example (no date): addquote cheeseandcereal this is my quote
    example (with date): addquote cheeseandcereal [2020] this is my quote from 2020`,
  handler: async (ctx, user, param) => {
    const invalidSyntaxMessage = 'Invalid syntax. Try help addquote for usage information';
    const { word: quotee, remain } = parseNextWord(param || '');
    if (!remain) return invalidSyntaxMessage;
    let date = '';
    let quoteStr = remain;
    // Parse out the optional date if it exists
    const match = remain.match(optionalDateRegex);
    if (match) {
      date = match[1];
      quoteStr = match[2].trim();
      if (!quoteStr) return invalidSyntaxMessage;
    }
    // Create the new quote and save it
    const newQuote = new Quote();
    newQuote.user = quotee;
    newQuote.quote = quoteStr;
    newQuote.date = date;
    await newQuote.save();
    return 'New quote added successfully';
  },
};
