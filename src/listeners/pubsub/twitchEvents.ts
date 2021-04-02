import { ApiClient } from 'twitch';
import { TwitchChannel } from '../../models/twitchChannel';
import { getLogger } from '../../logger';
import { PubSubClient, PubSubListener, PubSubRedemptionMessage } from 'twitch-pubsub-client';

const logger = getLogger('twitchPubSub');

const singletonClient = new PubSubClient();

export class TwitchEventClient {
  public static client = singletonClient;
  private static listeners: { [userId: string]: PubSubListener } = {};

  public static async connect() {
    const channels = await TwitchChannel.getChannelPointChannels();
    await Promise.all(channels.map(TwitchEventClient.addNewChannelPointsListener));
  }

  public static async addNewChannelPointsListener(channel: TwitchChannel) {
    const user = await singletonClient.registerUserListener(new ApiClient({ authProvider: channel.getAuthProvider() }));
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
    // placeholder for now
    logger.info(msg);
  }

  public static async shutdown() {
    await Promise.all(Object.values(TwitchEventClient.listeners).map((listener) => listener.remove()));
    TwitchEventClient.listeners = {};
  }
}
