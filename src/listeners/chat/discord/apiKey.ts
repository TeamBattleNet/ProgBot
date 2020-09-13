import { DiscordClient, DiscordCommand } from './discordBot';
import { User } from '../../../models/user';

export const generateApiKey: DiscordCommand = {
  cmd: 'generateapikey',
  category: 'Accounts',
  shortDescription: "Create an api key (and revoke any existing ones) to use with ProgBot's http API",
  usageInfo: 'usage: generateapikey',
  handler: async (msg) => {
    const existingUser = await User.findByDiscordId(msg.author.id);
    if (!existingUser) return `You cannot create an apikey unless you are registered (${DiscordClient.cmdPrefix}register)`;
    const newKey = await existingUser.getNewApiKey();
    // Don't reply in message source channel. Ensure we're sending a DM directly to user with their key
    msg.author.send(`Your new api key is: \`${newKey}\`\nAny previous api keys for this account have been revoked.`);
    return '';
  },
};
