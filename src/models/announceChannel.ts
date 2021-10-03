import { Entity, PrimaryColumn, Column, BaseEntity } from 'typeorm';

@Entity()
export class AnnounceChannel extends BaseEntity {
  // Discord channel id for discord or twitch user ID for twitch channel
  @PrimaryColumn()
  channel: string;

  // Announce types will be stored as a comma separated varchar string in the DB
  @Column({
    type: 'varchar',
    transformer: {
      from: (val: string) => new Set(val.split(',').filter(Boolean)),
      to: (val: Set<string>) => [...val].join(','),
    },
  })
  announceTypes: Set<string>;

  public static async getLiveAnnounceChannels() {
    const allChannels = await AnnounceChannel.find();
    return allChannels.filter((chan) => chan.announceTypes.has('live'));
  }

  public static async getSpeedrunLiveAnnounceChannels() {
    const allChannels = await AnnounceChannel.find();
    return allChannels.filter((chan) => chan.announceTypes.has('speedrunlive'));
  }

  public static async getStreamDetectionChannels() {
    const allChannels = await AnnounceChannel.find();
    return allChannels.filter((chan) => chan.announceTypes.has('stream'));
  }

  public static async getChannel(channel: string) {
    return AnnounceChannel.findOne({ where: { channel: channel.toLowerCase() } });
  }

  public static async addNewLiveChannel(discordChannel: string, speedrunOnly: boolean) {
    const announceType = speedrunOnly ? 'speedrunlive' : 'live';
    const lowerChannel = discordChannel.toLowerCase();
    let announceChannel = new AnnounceChannel();
    announceChannel.channel = lowerChannel;
    announceChannel.announceTypes = new Set();
    const existingChannel = await AnnounceChannel.getChannel(discordChannel);
    if (existingChannel) {
      if (existingChannel.announceTypes.has(announceType)) throw new Error(`Channel ${discordChannel} already marked for ${announceType} announcement`);
      announceChannel = existingChannel;
    }
    announceChannel.announceTypes.add(announceType);
    await announceChannel.save();
  }

  public static async addNewStreamChannel(twitchID: string) {
    const lowerChannel = twitchID.toLowerCase();
    let announceChannel = new AnnounceChannel();
    announceChannel.channel = lowerChannel;
    announceChannel.announceTypes = new Set();
    const existingChannel = await AnnounceChannel.getChannel(twitchID);
    if (existingChannel) {
      if (existingChannel.announceTypes.has('stream')) throw new Error(`Channel ${twitchID} already marked for stream detection`);
      announceChannel = existingChannel;
    }
    announceChannel.announceTypes.add('stream');
    await announceChannel.save();
  }
}
