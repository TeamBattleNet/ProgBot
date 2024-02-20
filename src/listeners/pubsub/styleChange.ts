import { User } from '../../models/user.js';
import { TwitchApi } from '../../clients/twitchApi.js';
import { TwitchIRCClient } from '../../listeners/chat/twitch/twitchIRC.js';
import { TwitchReward } from './twitchEvents.js';

export const styleChange: TwitchReward = {
  rewardTitle: '!StyleChange',
  handler: async (reward) => {
    let user = await User.findByTwitchUserId(reward.userId);
    // Register twitch user as a new user if they aren't already registered
    if (!user) user = await User.createNewUser({ twitchUserId: reward.userId });
    const newStyle = await user.assignRandomStyle();
    await TwitchIRCClient.sendMessage(await TwitchApi.getTwitchLoginName(reward.channelId), `${reward.userDisplayName} activated a Style Change! They are now... ${newStyle}!`);
  },
};
