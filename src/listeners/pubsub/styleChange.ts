import { User } from '../../models/user';
import { TwitchApi } from '../../clients/twitchApi';
import { TwitchIRCClient } from '../../listeners/chat/twitch/twitchIRC';
import { TwitchReward } from './twitchEvents';

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
