import type { TwitchCommand } from './twitchBot';
import { User } from '../../../models/user';

export const registerTwitch: TwitchCommand = {
  cmd: 'register',
  category: 'Accounts',
  shortDescription: 'Register with ProgBot!',
  usageInfo: 'usage: register',
  handler: async (msg) => {
    const userId = msg.userInfo.userId;
    if (!userId) throw new Error(`Couldn't find twitch user id for message by ${msg.userInfo.userName}`);
    const existingUser = await User.findByTwitchUserId(userId);
    if (existingUser) return `${msg.userInfo.userName}: You are already registered!`;
    await User.createNewUser({ twitchUserId: userId });
    return `${msg.userInfo.userName}: You are now registered!`;
  },
};
