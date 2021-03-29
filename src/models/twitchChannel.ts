import { Entity, PrimaryColumn, Column, BaseEntity } from 'typeorm';

@Entity()
export class TwitchChannel extends BaseEntity {
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
  disabledCommands: Set<string>;

  @Column({ default: 0 })
  minimumBrowseSeconds: number;

  public isDisabledCommand(cmd: string) {
    return this.disabledCommands.has(cmd);
  }

  public canBrowse(lastBrowseTime: Date) {
    return (new Date().getTime() - lastBrowseTime.getTime()) / 1000 > this.minimumBrowseSeconds;
  }

  public async addDisabledCommands(cmds: string[]) {
    const beforeSize = this.disabledCommands.size;
    cmds.forEach((cmd) => {
      if (cmd.indexOf(',') !== -1) throw Error('Cannot disable command with comma');
      this.disabledCommands.add(cmd);
    });
    // Only save if something has changed
    if (this.disabledCommands.size !== beforeSize) await this.save();
  }

  public async removeDisabledCommands(cmds: string[]) {
    const beforeSize = this.disabledCommands.size;
    cmds.forEach((cmd) => this.disabledCommands.delete(cmd));
    // Only save if something has changed
    if (this.disabledCommands.size !== beforeSize) await this.save();
  }

  public async setMinBrowseSeconds(seconds: number) {
    this.minimumBrowseSeconds = Math.max(0, Math.floor(seconds)); // Make sure an integer with a floor of 0
    await this.save();
  }

  public static async getAllChannels() {
    return TwitchChannel.find();
  }

  public static async getChannel(channel: string) {
    return TwitchChannel.findOne({ where: { channel: channel.toLowerCase() } });
  }

  public static async createNewChannel(channel: string) {
    const lowerChannel = channel.toLowerCase();
    if (await TwitchChannel.findOne({ where: { channel: lowerChannel } })) throw Error(`Channel ${channel} already exists`);
    const newChannel = new TwitchChannel();
    newChannel.channel = lowerChannel;
    newChannel.disabledCommands = new Set();
    await newChannel.save();
    return newChannel;
  }
}
