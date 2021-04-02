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
  handler: async (ctx, user, param) => {
    if (!param) return 'Invalid syntax, must provide a channel to join';
    let channel: TwitchChannel | undefined = undefined;
    // Check if channel is in cache or db first
    try {
      channel = TwitchIRCClient.getTwitchChannelFromCache(param);
    } catch {
      channel = await TwitchChannel.getChannel(param);
    }
    if (channel) return `Channel ${param} is already allowed. If progbot is not currently in this channel, try the reloadtwitchchannels command`;
    // Create the new channel now that we confirmed it isn't already allowed
    channel = await TwitchChannel.createNewChannel(param);
    try {
      await TwitchIRCClient.joinChannel(channel);
    } catch {
      // Failed to join the specified channel, remove it from the DB and return an error message
      await channel.remove();
      return `Error joining channel ${param}, It will not be allowed`;
    }
    return `Allowed and joined twitch channel ${param}`;
  },
};

export const removeAllowedTwitchChannel: CommonAdminCommand = {
  cmd: 'removetwitchchannel',
  shortDescription: 'Remove a previously allowed twitch channel from progbot',
  usageInfo: 'usage: removetwitchchannel <channel>',
  handler: async (ctx, user, param) => {
    if (!param) return 'Invalid syntax, must provide a channel to leave';
    let channel: TwitchChannel | undefined = undefined;
    // Retrieve channel from cache (or db if cache misses)
    try {
      channel = TwitchIRCClient.getTwitchChannelFromCache(param);
    } catch {
      channel = await TwitchChannel.getChannel(param);
    }
    if (!channel) return `Channel ${param} is not a currently allowed channel. Nothing to do`;
    TwitchIRCClient.leaveChannel(channel.channel);
    await channel.remove();
    return `Left twitch channel ${param} and removed it from the allowed list`;
  },
};

export const listAllowedTwitchChannels: CommonAdminCommand = {
  cmd: 'listtwitchchannels',
  shortDescription: 'List the allowed twitch channels of progbot',
  usageInfo: 'usage: listtwitchchannels',
  handler: async () => {
    const channels = await TwitchChannel.getAllChannels();
    return `Channels: ${channels.map((x) => x.channel).join(', ') || 'none'}`;
  },
};

export const reloadAllowedTwitchChannels: CommonAdminCommand = {
  cmd: 'reloadtwitchchannels',
  shortDescription: 'Leave all the twitch channels that progbot should be connected to, and rejoin them',
  usageInfo: 'usage: reloadtwitchchannels',
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

export const addChannelPointsIntegration: CommonAdminCommand = {
  cmd: 'addchannelpointsintegration',
  shortDescription: 'Enable channel points integration for an allowed twitch channel',
  usageInfo: 'usage: addchannelpointsintegration <channel>',
  handler: async (ctx, user, param) => {
    if (!param) return 'Invalid syntax, must provide a channel to join';
    const channel = await TwitchChannel.getChannel(param);
    if (!channel) return `${param} is not an allowed twitch channel. Please use addtwitchchannel first`;
    if (channel.channelPointsIntegration) return `Channel ${param} already has channel point integration enabled. Nothing to do`;
    if (!channel.accessToken || !channel.refreshToken)
      return `Channel needs authorization before this can be enabled. Use this URL to authorize while logged into ${param}: ${await channel.getOauthURL()}`;
    await channel.setChannelPointIntegration();
    await TwitchEventClient.addNewChannelPointsListener(channel);
    return `Channel point integrations have been successfully enabled for ${param}`;
  },
};

export const removeChannelPointsIntegration: CommonAdminCommand = {
  cmd: 'removechannelpointsintegration',
  shortDescription: 'Remove channel points integration from a twitch channel',
  usageInfo: 'usage: removechannelpointsintegration <channel>',
  handler: async (ctx, user, param) => {
    if (!param) return 'Invalid syntax, must provide a channel to remove';
    const channel = await TwitchChannel.getChannel(param);
    if (!channel || !channel.channelPointsIntegration) return `Channel ${param} does not currently have channel points integration enabled. Nothing to do`;
    const userId = await TwitchApi.getTwitchUserID(channel.channel);
    await channel.setChannelPointIntegration(false);
    await TwitchEventClient.removeChannelPointsListener(userId);
    return `Turned off channel point integration for: ${param}`;
  },
};

export const listChannelPointsIntegrations: CommonAdminCommand = {
  cmd: 'listchannelpointsintegrations',
  shortDescription: 'List the twitch channels which have channel point integration enabled',
  usageInfo: 'usage: listchannelpointsintegrations',
  handler: async () => {
    const channels = await TwitchChannel.getChannelPointChannels();
    return `Channels: ${channels.map((x) => x.channel).join(', ') || 'none'}`;
  },
};
