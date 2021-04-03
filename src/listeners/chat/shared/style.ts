import { CommonRegisteredCommand } from './common';

export const styleIn: CommonRegisteredCommand = {
  cmd: 'stylin',
  category: 'General',
  shortDescription: 'Show off your style!',
  usageInfo: 'usage: stylein',
  handler: async (ctx, user) => {
    let userRef = `<@${user.discordUserId}>`;
    if (ctx.chatType === 'twitch') {
      userRef = ctx.twitchMsg?.userInfo.displayName || '';
    }
    return `${userRef} is ${user.style}!`;
  },
};
