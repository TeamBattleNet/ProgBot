import { CommonAnonymousCommand } from './common';

export const blame: CommonAnonymousCommand = {
  cmd: 'blame',
  category: 'General',
  shortDescription: 'Who to blame?',
  usageInfo: `usage: blame`,
  handler: async (ctx) => {
    const progChamp = ctx.chatType === 'discord' ? '<:ProgChamp:281409807754461184>' : 'ProgChamp';
    if (Math.random() < 0.99) return `${progChamp} xKilios!`;
    const username = ctx.chatType === 'discord' ? ctx.discordMsg?.member?.displayName : ctx.twitchMsg?.userInfo.userName;
    return `${progChamp} ${username}!`;
  },
};
