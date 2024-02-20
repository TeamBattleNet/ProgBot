import { CommonRegisteredCommand } from './common.js';

export const stylin: CommonRegisteredCommand = {
  cmd: 'stylin',
  category: 'General',
  shortDescription: 'Show off your style!',
  usageInfo: 'usage: stylin',
  options: [],
  handler: async (ctx, user) => {
    let userRef = `<@${user.discordUserId}>`;
    if (ctx.chatType === 'twitch') {
      userRef = ctx.twitchMsg?.userInfo.displayName || '';
    }
    return `${userRef} is ${user.style}!`;
  },
};
