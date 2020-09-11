import type { DiscordCommand } from './bot';
import { User } from '../../../models/user';

export const registerDiscord: DiscordCommand = {
  cmd: 'register',
  shortDescription: 'Register with ProgBot!',
  usageInfo: 'usage: register',
  handler: async (msg) => {
    const existingUser = await User.findByDiscordId(msg.author.id);
    if (existingUser) return `<@${msg.author.id}> You are already registered!`;
    const newUser = new User();
    newUser.discordUserId = msg.author.id;
    await newUser.save();
    return `<@${msg.author.id}> You are now registered!`;
  },
};
