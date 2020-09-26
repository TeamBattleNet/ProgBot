import { CommonAnonymousCommand } from './common';
import { getEmote } from './utils';

export const blame: CommonAnonymousCommand = {
  cmd: 'blame',
  category: 'General',
  shortDescription: 'Who to blame?',
  usageInfo: `usage: blame`,
  handler: async (ctx) => {
    const progChamp = getEmote(ctx, 'ProgChamp');
    if (Math.random() < 0.99) return `${progChamp} xKilios!`;
    const username = ctx.chatType === 'discord' ? ctx.discordMsg?.member?.displayName : ctx.twitchMsg?.userInfo.userName;
    return `${progChamp} ${username}!`;
  },
};
