import { Entity, PrimaryColumn, Column, BaseEntity } from 'typeorm';

@Entity()
export class AnnounceChannel extends BaseEntity {
  @PrimaryColumn()
  channel: string;

  // Disabled commands will be stored as a comma separated varchar string in the DB
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

  public static async getChannel(channel: string) {
    return AnnounceChannel.findOne({ where: { channel: channel.toLowerCase() } });
  }

  public static async addNewLiveChannel(channel: string) {
    const lowerChannel = channel.toLowerCase();
    let announceChannel = new AnnounceChannel();
    announceChannel.channel = lowerChannel;
    announceChannel.announceTypes = new Set();
    const existingChannel = await AnnounceChannel.getChannel(channel);
    if (existingChannel) announceChannel = existingChannel;
    announceChannel.announceTypes.add('live');
    await announceChannel.save();
  }
}
