import { DiscordCommand } from './discordBot';
import { getDiscordUser } from '../shared/utils';
import { User } from '../../../models/user';

export const generateApiKey: DiscordCommand = {
  cmd: 'generateapikey',
  category: 'Accounts',
  shortDescription: "Create an api key (and revoke any existing ones) to use with ProgBot's http API",
  usageInfo: 'usage: generateapikey',
  options: [],
  handler: async (msg) => {
    const existingUser = await User.findByDiscordId(getDiscordUser(msg).id);
    if (!existingUser) return `You cannot create an apikey unless you are registered (/register)`;
    const newKey = await existingUser.getNewApiKey();
    // Don't reply in message source channel. Ensure we're sending a DM directly to user with their key
    getDiscordUser(msg).send(`Your new api key is: \`${newKey}\`\nAny previous api keys for this account have been revoked.`);
    return '';
  },
};
