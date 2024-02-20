import { CommonAnonymousCommand } from './common.js';
import { getEmote, getDiscordUser } from './utils.js';

export const blame: CommonAnonymousCommand = {
  cmd: 'blame',
  category: 'General',
  shortDescription: 'Who to blame?',
  usageInfo: `usage: blame`,
  options: [],
  handler: async (ctx) => {
    const progChamp = getEmote(ctx, 'ProgChamp');
    if (Math.random() < 0.99) return `${progChamp} xKilios!`;
    const username = ctx.chatType === 'discord' ? `<@${getDiscordUser(ctx.discordMsg!).id}>` : ctx.twitchMsg?.userInfo.userName;
    return `${progChamp} ${username}!`;
  },
};
