import { TwitchIRCClient } from '../twitch/twitchIRC';
import { CommonRegisteredCommand } from './common';
import { getDiscordUser } from './utils';
import { User } from '../../../models/user';

const discordUsernameCheckRegex = /^.+?#\d{4}$/;

export const startLinkCommon: CommonRegisteredCommand = {
  cmd: 'startlink',
  category: 'Accounts',
  shortDescription: 'Link your twitch and discord ProgBot accounts',
  usageInfo: `usage: startlink <twitchUsername|discordUsername#1234>
  example: startlink lansdad

  This will provide a token which you must then use from your other (twitch/discord) account to finish the link`,
  // option description explicitly calls this a twitch username since these options are only used in discord chat
  options: [{ name: 'username', desc: 'Your twitch username to link', required: true }],
  handler: async (ctx, user, param) => {
    if (user.hasTwitchId() && user.hasDiscordId()) return 'You have already linked your twitch and discord accounts!';
    const otherService = ctx.chatType === 'twitch' ? 'discord' : 'twitch';
    const cmdPrefix = ctx.chatType === 'twitch' ? TwitchIRCClient.cmdPrefix : '/';
    let providedUsername = param?.toLowerCase() || '';
    if (ctx.discordMsg?.cmd) providedUsername = ctx.discordMsg?.cmd.options.getString('username', true);
    if ((ctx.chatType === 'discord' && !providedUsername) || (ctx.chatType === 'twitch' && !providedUsername.match(discordUsernameCheckRegex)))
      return `You must specify the ${otherService} username you wish to link (${cmdPrefix}help startlink)`;
    const randomToken = await user.generateNewLinkToken(providedUsername);
    if (ctx.chatType === 'twitch') {
      return `Link started! Type '/confirmlink ${randomToken}' from the discord account ${providedUsername} in the teambn discord server https://discord.teambn.net`;
    } else {
      return `Link started! Type \`${TwitchIRCClient.cmdPrefix}confirmlink ${randomToken}\` from the twitch account ${providedUsername} in my chat: https://www.twitch.tv/${TwitchIRCClient.username}`;
    }
  },
};

export const confirmLinkCommon: CommonRegisteredCommand = {
  cmd: 'confirmlink',
  category: 'Accounts',
  shortDescription: 'Confirm the linking of your twitch and discord ProgBot accounts',
  usageInfo: `usage: confirmlink <linkToken>
  example: confirmlink 9cd69476-4af1-4d49-8a92-30858290d4c5

  If the link is valid and you are using the account specified when starting the link, your accounts will be combined`,
  options: [{ name: 'linktoken', desc: `The link token received from the ${TwitchIRCClient.cmdPrefix}startlink cmd you performed in twitch chat`, required: true }],
  handler: async (ctx, user, param) => {
    if (user.hasTwitchId() && user.hasDiscordId()) return 'This account is already linked and cannot be re-linked!';
    const otherService = ctx.chatType === 'twitch' ? 'discord' : 'twitch';
    const cmdPrefix = ctx.chatType === 'twitch' ? TwitchIRCClient.cmdPrefix : '/';
    let linkToken = param;
    if (ctx.discordMsg?.cmd) linkToken = ctx.discordMsg?.cmd.options.getString('linktoken', true);
    if (!linkToken) return `You must specify the token provided when starting the link from ${otherService} (${cmdPrefix}help confirmlink)`;
    let twitchUser: User | null = null;
    let discordUser: User | null = null;
    if (ctx.chatType === 'twitch') {
      twitchUser = user;
      discordUser = await User.findByLinkToken(ctx.twitchMsg?.userInfo.userName.toLowerCase() || '', linkToken);
    } else {
      discordUser = user;
      twitchUser = await User.findByLinkToken(`${getDiscordUser(ctx.discordMsg!).username.toLowerCase()}#${getDiscordUser(ctx.discordMsg!).discriminator}`, linkToken);
    }
    if (!discordUser || !twitchUser) return `Could not find ${otherService} account to link. Did you start the link on your ${ctx.chatType} account?`;
    await User.combineUsers(twitchUser, discordUser);
    return 'Your discord and twitch accounts are now linked! Note: If you were using an api key, it has been reset.';
  },
};
