import { CommonAnonymousCommand, CommonAdminCommand } from './common.js';
import { parseNextWord, wrap } from './utils.js';
import { Quote } from '../../../models/quote.js';

const optionalDateRegex = /^\[(.*)\](.*)/;

export const quote: CommonAnonymousCommand = {
  cmd: 'quote',
  category: 'General',
  shortDescription: 'Get a random quote!',
  usageInfo: `usage: quote [filter]
  quote - get a random quote!
  quote [filter] - get a random quote that contains, or is from [filter]`,
  options: [{ name: 'filter', desc: 'Text to search and filter results with', required: false }],
  handler: async (ctx, param) => {
    let filter = param;
    if (ctx.discordMsg?.cmd) filter = ctx.discordMsg?.cmd.options.getString('filter', false) || undefined;
    const quoteObj = await Quote.getRandomQuote(filter);
    if (!quoteObj) return `No quotes found containing, or from ${wrap(ctx, filter)}!`;
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
  options: [
    { name: 'user', desc: 'Username of the source of the quote', required: true },
    { name: 'quote', desc: 'Text of the quote', required: true },
    { name: 'date', desc: 'Date of the quote (i.e. 2020)', required: false },
  ],
  handler: async (ctx, user, param) => {
    let quotee = '';
    let quoteStr = '';
    let date = '';
    if (ctx.discordMsg?.cmd) {
      quotee = ctx.discordMsg?.cmd.options.getString('user', true);
      quoteStr = ctx.discordMsg?.cmd.options.getString('quote', true);
      date = ctx.discordMsg?.cmd.options.getString('date', false) || '';
    } else {
      const invalidSyntaxMessage = 'Invalid syntax. Try help addquote for usage information';
      const parsed = parseNextWord(param || '');
      if (!parsed.remain) return invalidSyntaxMessage;
      quotee = parsed.word;
      quoteStr = parsed.remain;
      // Parse out the optional date if it exists
      const match = parsed.remain.match(optionalDateRegex);
      if (match) {
        date = match[1];
        quoteStr = match[2].trim();
        if (!quoteStr) return invalidSyntaxMessage;
      }
    }
    // Create the new quote
    await Quote.createNewQuote(quotee, quoteStr, date);
    return 'New quote added successfully';
  },
};
