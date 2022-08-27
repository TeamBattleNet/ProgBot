import { TwitchApi } from '../../../clients/twitchApi';
import { TwitchEventClient } from '../../pubsub/twitchEvents';
import { TwitchIRCClient, TwitchCommand } from './twitchIRC';
import { CommonAdminCommand } from '../shared/common';
import { TwitchChannel } from '../../../models/twitchChannel';
import { sleep } from '../../../utils';
import { getLogger } from '../../../logger';

const logger = getLogger('TwitchChannels');

export const disableCmdOnChannel: TwitchCommand = {
  cmd: 'disablecmd',
  category: 'Channel',
  shortDescription: 'Disable a progbot command on this twitch channel',
  usageInfo: 'usage: disablecmd <cmd>',
  handler: async (msg, param) => {
    // Make action only available to channel owner (broadcaster) or channel mods
    if (!msg.userInfo.isBroadcaster && !msg.userInfo.isMod) return 'Permission denied';
    if (!param || param.indexOf(',') !== -1) return 'Invalid syntax. Please provide a command to disable';
    const channel = TwitchIRCClient.getTwitchChannelFromCache(msg.target.value);
    await channel.addDisabledCommands([param]);
    return `Command ${param} disabled on twitch channel ${channel.channel}`;
  },
};

export const enableCmdOnChannel: TwitchCommand = {
  cmd: 'enablecmd',
  category: 'Channel',
  shortDescription: 'Re-enable a disabled progbot command on this twitch channel',
  usageInfo: 'usage: enablecmd <cmd>',
  handler: async (msg, param) => {
    // Make action only available to channel owner (broadcaster) or channel mods
    if (!msg.userInfo.isBroadcaster && !msg.userInfo.isMod) return 'Permission denied';
    if (!param) return 'Invalid syntax. Please provide a command to enable';
    const channel = TwitchIRCClient.getTwitchChannelFromCache(msg.target.value);
    if (!channel.disabledCommands.has(param)) return `Command ${param} is not disabled!`;
    await channel.removeDisabledCommands([param]);
    return `Command ${param} re-enabled on twitch channel ${channel.channel}`;
  },
};

export const listDisabledCmdsOnChannel: TwitchCommand = {
  cmd: 'listdisabledcmds',
  category: 'Channel',
  shortDescription: 'List the disabled commands on this twitch channel',
  usageInfo: 'usage: listdisabledcmds',
  handler: async (msg) => {
    // Make action only available to channel owner (broadcaster) or channel mods
    if (!msg.userInfo.isBroadcaster && !msg.userInfo.isMod) return 'Permission denied';
    const channel = TwitchIRCClient.getTwitchChannelFromCache(msg.target.value);
    return `Disabled cmds: ${[...channel.disabledCommands].join(', ') || 'none'}`;
  },
};

export const setMinBrowseTime: TwitchCommand = {
  cmd: 'setminchannelbrowsetime',
  category: 'Channel',
  shortDescription: 'Set the minimum number of seconds allowed between browsing for this twitch channel',
  usageInfo: 'usage: setminchannelbrowsetime <seconds>',
  handler: async (msg, param) => {
    // Make action only available to channel owner (broadcaster) or channel mods
    if (!msg.userInfo.isBroadcaster && !msg.userInfo.isMod) return 'Permission denied';
    const channel = TwitchIRCClient.getTwitchChannelFromCache(msg.target.value);
    const num = Number.parseInt(param || '');
    if (isNaN(num)) return 'Please provide a valid number of seconds';
    await channel.setMinBrowseSeconds(num);
    return `Set minimum browse time for this channel to ${num} seconds`;
  },
};

export const addAllowedTwitchChannel: CommonAdminCommand = {
  cmd: 'addtwitchchannel',
  shortDescription: 'Add a new twitch channel that progbot should allow and join',
  usageInfo: 'usage: addtwitchchannel <channel>',
  options: [{ name: 'channel', desc: 'Username of twitch channel to allow and join', required: true }],
  handler: async (ctx, user, param) => {
    let chan = param;
    if (ctx.discordMsg?.cmd) chan = ctx.discordMsg?.cmd.options.getString('channel', true);
    if (!chan) return 'Invalid syntax, must provide a channel to join';
    let channel: TwitchChannel | null = null;
    // Check if channel is in cache or db first
    try {
      channel = TwitchIRCClient.getTwitchChannelFromCache(chan);
    } catch {
      channel = await TwitchChannel.getChannel(chan);
    }
    if (channel) return `Channel ${chan} is already allowed. If progbot is not currently in this channel, try the reloadtwitchchannels command`;
    // Create the new channel now that we confirmed it isn't already allowed
    channel = await TwitchChannel.createNewChannel(chan);
    try {
      await TwitchIRCClient.joinChannel(channel);
    } catch {
      // Failed to join the specified channel, remove it from the DB and return an error message
      await channel.remove();
      return `Error joining channel ${chan}, It will not be allowed`;
    }
    return `Allowed and joined twitch channel ${chan}`;
  },
};

export const removeAllowedTwitchChannel: CommonAdminCommand = {
  cmd: 'removetwitchchannel',
  shortDescription: 'Remove a previously allowed twitch channel from progbot',
  usageInfo: 'usage: removetwitchchannel <channel>',
  options: [{ name: 'channel', desc: 'Username of twitch channel to un-allow and leave', required: true }],
  handler: async (ctx, user, param) => {
    let chan = param;
    if (ctx.discordMsg?.cmd) chan = ctx.discordMsg?.cmd.options.getString('channel', true);
    if (!chan) return 'Invalid syntax, must provide a channel to leave';
    let channel: TwitchChannel | null = null;
    // Retrieve channel from cache (or db if cache misses)
    try {
      channel = TwitchIRCClient.getTwitchChannelFromCache(chan);
    } catch {
      channel = await TwitchChannel.getChannel(chan);
    }
    if (!channel) return `Channel ${chan} is not a currently allowed channel. Nothing to do`;
    TwitchIRCClient.leaveChannel(channel.channel);
    await channel.remove();
    return `Left twitch channel ${chan} and removed it from the allowed list`;
  },
};

export const listAllowedTwitchChannels: CommonAdminCommand = {
  cmd: 'listtwitchchannels',
  shortDescription: 'List the allowed twitch channels of progbot',
  usageInfo: 'usage: listtwitchchannels',
  options: [],
  handler: async () => {
    const channels = await TwitchChannel.getAllChannels();
    return `Channels: ${channels.map((x) => x.channel).join(', ') || 'none'}`;
  },
};

export const reloadAllowedTwitchChannels: CommonAdminCommand = {
  cmd: 'reloadtwitchchannels',
  shortDescription: 'Leave all the twitch channels that progbot should be connected to, and rejoin them',
  usageInfo: 'usage: reloadtwitchchannels',
  options: [],
  handler: async (ctx) => {
    logger.info('Reloading twitch channels due to admin request');
    const separator = ctx.chatType === 'discord' ? '\n' : ' | ';
    const channels = await TwitchChannel.getAllChannels();
    channels.forEach((chan) => TwitchIRCClient.leaveChannel(chan.channel));
    let response = `Left channels: ${channels.map((x) => x.channel).join(', ') || 'none'}${separator}`;
    await sleep(3000); // Wait some time after leaving channels to ensure proper PART
    const successfullyJoinedChannels: string[] = [];
    const failedJoinedChannels: string[] = [];
    await Promise.all(
      channels.map(async (chan) => {
        try {
          await TwitchIRCClient.joinChannel(chan);
          successfullyJoinedChannels.push(chan.channel);
        } catch {
          failedJoinedChannels.push(chan.channel);
        }
      })
    );
    response += `Successfully Joined Channels: ${successfullyJoinedChannels.join(', ') || 'none'}${separator}`;
    response += `Failed to Join Channels: ${failedJoinedChannels.join(', ') || 'none'}`;
    return response;
  },
};

export const authTwitchChannel: CommonAdminCommand = {
  cmd: 'authtwitchchannel',
  shortDescription: 'Get/refresh an oauth token for an allowed twitch channel',
  usageInfo: 'usage: authtwitchchannel <channel>',
  options: [{ name: 'channel', desc: 'Username of twitch channel to un-allow and leave', required: true }],
  handler: async (ctx, user, param) => {
    let chan = param;
    if (ctx.discordMsg?.cmd) chan = ctx.discordMsg?.cmd.options.getString('channel', true);
    if (!chan) return 'Invalid syntax, must provide a channel name to auth';
    const channel = await TwitchChannel.getChannel(chan);
    if (!channel) return `${chan} is not an allowed twitch channel. Please use addtwitchchannel first`;
    return `Use this URL to authorize while logged into ${chan}: ${await channel.getOauthURL()}`;
  },
};

export const addChannelPointsIntegration: CommonAdminCommand = {
  cmd: 'addchannelpointsintegration',
  shortDescription: 'Enable channel points integration for an allowed twitch channel',
  usageInfo: 'usage: addchannelpointsintegration <channel>',
  options: [{ name: 'channel', desc: 'Username of twitch channel to un-allow and leave', required: true }],
  handler: async (ctx, user, param) => {
    let chan = param;
    if (ctx.discordMsg?.cmd) chan = ctx.discordMsg?.cmd.options.getString('channel', true);
    if (!chan) return 'Invalid syntax, must provide a channel to join';
    const channel = await TwitchChannel.getChannel(chan);
    if (!channel) return `${chan} is not an allowed twitch channel. Please use addtwitchchannel first`;
    if (channel.channelPointsIntegration) return `Channel ${chan} already has channel point integration enabled. Nothing to do`;
    const needAuthMsg = 'Channel needs authorization before this can be enabled. Please use authtwitchchannel first';
    if (!channel.accessToken || !channel.refreshToken) return needAuthMsg;
    try {
      await TwitchEventClient.addNewChannelPointsListener(channel);
    } catch (e) {
      if (e?.name === 'InvalidTokenError') {
        return needAuthMsg;
      } else if (`${e}`.includes('ERR_BADAUTH')) {
        await TwitchEventClient.removeChannelPointsListener(await TwitchApi.getTwitchUserID(channel.channel));
        return needAuthMsg;
      }
      throw e;
    }
    await channel.setChannelPointIntegration();
    return `Channel point integrations have been successfully enabled for ${chan}`;
  },
};

export const removeChannelPointsIntegration: CommonAdminCommand = {
  cmd: 'removechannelpointsintegration',
  shortDescription: 'Remove channel points integration from a twitch channel',
  usageInfo: 'usage: removechannelpointsintegration <channel>',
  options: [{ name: 'channel', desc: 'Username of twitch channel to un-allow and leave', required: true }],
  handler: async (ctx, user, param) => {
    let chan = param;
    if (ctx.discordMsg?.cmd) chan = ctx.discordMsg?.cmd.options.getString('channel', true);
    if (!chan) return 'Invalid syntax, must provide a channel to remove';
    const channel = await TwitchChannel.getChannel(chan);
    if (!channel || !channel.channelPointsIntegration) return `Channel ${chan} does not currently have channel points integration enabled. Nothing to do`;
    const userId = await TwitchApi.getTwitchUserID(channel.channel);
    await channel.setChannelPointIntegration(false);
    await TwitchEventClient.removeChannelPointsListener(userId);
    return `Turned off channel point integration for: ${chan}`;
  },
};

export const listChannelPointsIntegrations: CommonAdminCommand = {
  cmd: 'listchannelpointsintegrations',
  shortDescription: 'List the twitch channels which have channel point integration enabled',
  usageInfo: 'usage: listchannelpointsintegrations',
  options: [],
  handler: async () => {
    const channels = await TwitchChannel.getChannelPointChannels();
    return `Channels: ${channels.map((x) => x.channel).join(', ') || 'none'}`;
  },
};
