import { TwitchChannel } from '../../models/twitchChannel';
import { getLogger } from '../../logger';
import { PubSubClient, PubSubListener, PubSubRedemptionMessage } from '@twurple/pubsub';

const logger = getLogger('twitchPubSub');

const singletonClient = new PubSubClient();

export type ChannelPointHandler = (msg: PubSubRedemptionMessage) => any;

export interface TwitchReward {
  rewardTitle: string;
  handler: ChannelPointHandler;
}

export class TwitchEventClient {
  public static client = singletonClient;
  private static channelPointHandlers: { [rewardTitle: string]: ChannelPointHandler | undefined } = {};
  private static listeners: { [userId: string]: PubSubListener } = {};

  public static async connect() {
    const channels = await TwitchChannel.getChannelPointChannels();
    await Promise.all(
      channels.map(async (channel) => {
        try {
          await TwitchEventClient.addNewChannelPointsListener(channel);
        } catch (e) {
          logger.error(`Could not enable channel points listener for ${channel.channel}: ${e}`);
        }
      })
    );
  }

  public static async addNewChannelPointsListener(channel: TwitchChannel) {
    const user = await singletonClient.registerUserListener(channel.getAuthProvider());
    if (TwitchEventClient.listeners[user]) await TwitchEventClient.listeners[user].remove();
    delete TwitchEventClient.listeners[user];
    TwitchEventClient.listeners[user] = await singletonClient.onRedemption(user, TwitchEventClient.redemptionHandler);
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
