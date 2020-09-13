import { DiscordClient, DiscordCommand } from '../discord/discordBot';
import { TwitchClient, TwitchCommand } from '../twitch/twitchBot';
import { User } from '../../../models/user';

const discordUsernameCheckRegex = /^.+?#\d{4}$/;

const startLinkCmd = 'startlink';
const confirmLinkCmd = 'confirmlink';
const startLinkDescription = 'Link your twitch and discord ProgBot accounts';
const confirmLinkDescription = 'Confirm the linking of your twitch and discord ProgBot accounts';
const confirmLinkUsage = `usage: confirmlink <linkToken>
  example: confirmlink 9cd69476-4af1-4d49-8a92-30858290d4c5

  If the link is valid and you are using the account specified when starting the link, your accounts will be combined`;

const notRegisteredMessage = 'You are not registered and have no account to link';
const successfullyLinkedMessage = 'Your discord and twitch accounts are now linked! Note: If you were using an api key, it has been reset.';

export const startLinkDiscord: DiscordCommand = {
  cmd: startLinkCmd,
  category: 'Accounts',
  shortDescription: startLinkDescription,
  usageInfo: `usage: startlink <twitchUsername>
  example: ${DiscordClient.cmdPrefix}startlink lansdad

  This will provide a token which you must then use from your twitch account to finish the link`,
  handler: async (msg, param) => {
    if (!param) return `You must specify the twitch username you wish to link (${DiscordClient.cmdPrefix}help startlink)`;
    const twitchUsername = param.toLowerCase();
    const user = await User.findByDiscordId(msg.author.id);
    if (!user) return notRegisteredMessage;
    const randomToken = await user.generateNewLinkToken(twitchUsername);
    return `Link started! Type \`${TwitchClient.cmdPrefix}confirmlink ${randomToken}\` from the twitch account '${twitchUsername}' in my chat: https://www.twitch.tv/${TwitchClient.username}`;
  },
};

export const startLinkTwitch: TwitchCommand = {
  cmd: startLinkCmd,
  category: 'Accounts',
  shortDescription: startLinkDescription,
  usageInfo: `usage: startlink <discordUsername#1234>
  example: ${TwitchClient.cmdPrefix}startlink lansdad#1234

  This will provide a token which you must then use from your discord account to finish the link`,
  handler: async (_chan, username, msg, param) => {
    const discordUsername = param?.toLowerCase() || '';
    if (!discordUsername.match(discordUsernameCheckRegex)) return `You must specify the discord username you wish to link with (${TwitchClient.cmdPrefix}help startlink)`;
    const user = await User.findByTwitchUsername(username);
    if (!user) return notRegisteredMessage;
    const randomToken = await user.generateNewLinkToken(discordUsername);
    return `Link started! Type '${DiscordClient.cmdPrefix}confirmlink ${randomToken}' from the discord account ${discordUsername} in the teambn discord server https://discord.teambn.net`;
  },
};

export const confirmLinkDiscord: DiscordCommand = {
  cmd: confirmLinkCmd,
  category: 'Accounts',
  shortDescription: confirmLinkDescription,
  usageInfo: confirmLinkUsage,
  handler: async (msg, param) => {
    if (!param) return `You must specify the token provided when starting the link from twitch (${DiscordClient.cmdPrefix}help confirmlink)`;
    const user = await User.findByDiscordId(msg.author.id);
    if (!user) return notRegisteredMessage;
    const twitchUser = await User.findByLinkToken(`${msg.author.username.toLowerCase()}#${msg.author.discriminator}`, param);
    if (!twitchUser) return 'Could not find twitch account to link. Did you start the link on your twitch account?';
    await User.linkAccounts(twitchUser, user);
    return successfullyLinkedMessage;
  },
};

export const confirmLinkTwitch: TwitchCommand = {
  cmd: confirmLinkCmd,
  category: 'Accounts',
  shortDescription: confirmLinkDescription,
  usageInfo: confirmLinkUsage,
  handler: async (_chan, username, msg, param) => {
    if (!param) return `You must specify the token provided when starting the link from discord (${TwitchClient.cmdPrefix}help confirmlink)`;
    const user = await User.findByTwitchUsername(username);
    if (!user) return notRegisteredMessage;
    const discordUser = await User.findByLinkToken(username, param);
    if (!discordUser) return 'Could not find discord account to link. Did you start the link on your discord account?';
    await User.linkAccounts(user, discordUser);
    return successfullyLinkedMessage;
  },
};
