import { TwitchChannel } from '../../models/twitchChannel.js';
import { getLogger } from '../../logger.js';
import { ApiClient } from '@twurple/api';
import { EventSubWsListener } from '@twurple/eventsub-ws';
import type { EventSubChannelRedemptionAddEvent, EventSubSubscription } from '@twurple/eventsub-base';

const logger = getLogger('twitchPubSub');

export type ChannelPointHandler = (msg: EventSubChannelRedemptionAddEvent) => void;

export interface TwitchReward {
  rewardTitle: string;
  handler: ChannelPointHandler;
}

export class TwitchEventClient {
  private static channelPointHandlers: { [rewardTitle: string]: ChannelPointHandler | undefined } = {};
  private static listeners: { [userId: string]: EventSubSubscription } = {};

  public static async connect() {
    const channels = await TwitchChannel.getChannelPointChannels();
    await Promise.all(
      channels.map(async (channel) => {
        try {
          await TwitchEventClient.addNewChannelPointsListener(channel);
        } catch (e) {
          logger.error(`Could not enable channel points listener for ${channel.channel}: ${e}`);
        }
      }),
    );
  }

  public static async addNewChannelPointsListener(channel: TwitchChannel) {
    const authProvider = await channel.getAuthProvider();
    const channelToken = await authProvider.getAccessTokenForIntent('auth');
    if (!channelToken || !channelToken.userId) throw new Error("Couldn't get userId from channel auth provider");
    const eventSubClient = new EventSubWsListener({ apiClient: new ApiClient({ authProvider }) });
    eventSubClient.start();
    if (TwitchEventClient.listeners[channelToken.userId]) TwitchEventClient.listeners[channelToken.userId].stop();
    delete TwitchEventClient.listeners[channelToken.userId];
    TwitchEventClient.listeners[channelToken.userId] = eventSubClient.onChannelRedemptionAdd(channelToken.userId, TwitchEventClient.redemptionHandler);
    logger.info(`Now listening for channel point redemptions on ${channel.channel}`);
  }

  public static async removeChannelPointsListener(userId: string) {
    if (TwitchEventClient.listeners[userId]) await TwitchEventClient.listeners[userId].stop();
    delete TwitchEventClient.listeners[userId];
  }

  public static async redemptionHandler(event: EventSubChannelRedemptionAddEvent) {
    try {
      logger.trace(`${event.userDisplayName} redeemed ${event.rewardTitle} in ${event.broadcasterId}`);
      await TwitchEventClient.channelPointHandlers[event.rewardTitle]?.(event);
    } catch (e) {
      logger.error(e);
    }
  }

  public static registerChannelPointHandler(reward: TwitchReward) {
    if (TwitchEventClient.channelPointHandlers[reward.rewardTitle]) throw new Error(`Handler for reward ${reward.rewardTitle} already registered!`);
    TwitchEventClient.channelPointHandlers[reward.rewardTitle] = reward.handler;
  }

  public static async shutdown() {
    await Promise.all(Object.values(TwitchEventClient.listeners).map((listener) => listener.stop()));
    TwitchEventClient.listeners = {};
  }
}
