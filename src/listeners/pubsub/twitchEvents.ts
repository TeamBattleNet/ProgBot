import { TwitchChannel } from '../../models/twitchChannel.js';
import { getLogger } from '../../logger.js';
import { PubSubClient, PubSubHandler, PubSubRedemptionMessage } from '@twurple/pubsub';

const logger = getLogger('twitchPubSub');

export type ChannelPointHandler = (msg: PubSubRedemptionMessage) => any;

export interface TwitchReward {
  rewardTitle: string;
  handler: ChannelPointHandler;
}

export class TwitchEventClient {
  private static channelPointHandlers: { [rewardTitle: string]: ChannelPointHandler | undefined } = {};
  private static listeners: { [userId: string]: PubSubHandler<never> } = {};

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
    const pubSubClient = new PubSubClient({ authProvider });
    if (TwitchEventClient.listeners[channelToken.userId]) TwitchEventClient.listeners[channelToken.userId].remove();
    delete TwitchEventClient.listeners[channelToken.userId];
    TwitchEventClient.listeners[channelToken.userId] = pubSubClient.onRedemption(channelToken.userId, TwitchEventClient.redemptionHandler);
    logger.info(`Now listening for channel point redemptions on ${channel.channel}`);
  }

  public static async removeChannelPointsListener(userId: string) {
    if (TwitchEventClient.listeners[userId]) await TwitchEventClient.listeners[userId].remove();
    delete TwitchEventClient.listeners[userId];
  }

  public static async redemptionHandler(msg: PubSubRedemptionMessage) {
    try {
      logger.trace(`${msg.userDisplayName} redeemed ${msg.rewardTitle} in ${msg.channelId}: ${msg.message}`);
      await TwitchEventClient.channelPointHandlers[msg.rewardTitle]?.(msg);
    } catch (e) {
      logger.error(e);
    }
  }

  public static registerChannelPointHandler(reward: TwitchReward) {
    if (TwitchEventClient.channelPointHandlers[reward.rewardTitle]) throw new Error(`Handler for reward ${reward.rewardTitle} already registered!`);
    TwitchEventClient.channelPointHandlers[reward.rewardTitle] = reward.handler;
  }

  public static async shutdown() {
    await Promise.all(Object.values(TwitchEventClient.listeners).map((listener) => listener.remove()));
    TwitchEventClient.listeners = {};
  }
}
