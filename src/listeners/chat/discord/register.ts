import type { DiscordCommand } from './discordBot.js';
import { getDiscordUser } from '../shared/utils.js';
import { User } from '../../../models/user.js';

export const registerDiscord: DiscordCommand = {
  cmd: 'register',
  category: 'Accounts',
  shortDescription: 'Register with ProgBot!',
  usageInfo: 'usage: register',
  options: [],
  handler: async (msg) => {
    const discordUserId = getDiscordUser(msg).id;
    const existingUser = await User.findByDiscordId(discordUserId);
    if (existingUser) return `<@${discordUserId}> You are already registered!`;
    await User.createNewUser({ discordUserId: discordUserId });
    return `<@${discordUserId}> You are now registered!`;
  },
};
