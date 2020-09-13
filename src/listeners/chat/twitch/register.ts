import type { TwitchCommand } from './twitchBot';
import { User } from '../../../models/user';

export const registerTwitch: TwitchCommand = {
  cmd: 'register',
  category: 'Accounts',
  shortDescription: 'Register with ProgBot!',
  usageInfo: 'usage: register',
  handler: async (_chan, user) => {
    const existingUser = await User.findByTwitchUsername(user);
    if (existingUser) return `${user}: You are already registered!`;
    const newUser = new User();
    newUser.twitchUsername = user;
    await newUser.save();
    return `${user}: You are now registered!`;
  },
};
