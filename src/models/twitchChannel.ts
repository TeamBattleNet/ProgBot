import { Entity, PrimaryColumn, Column, BaseEntity } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Config } from '../clients/configuration';
import { getRedirectURI } from '../utils';
import { ApiClient } from 'twitch';
import { RefreshableAuthProvider, StaticAuthProvider, AccessToken } from 'twitch-auth';

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

  @Column({ default: false })
  channelPointsIntegration: boolean;

  @Column({ nullable: true, type: 'varchar' })
  oauthTokenState: string | null;

  @Column({ nullable: true, type: 'varchar' })
  accessToken: string | null;

  @Column({ nullable: true, type: 'varchar' })
  refreshToken: string | null;

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

  public async getOauthURL() {
    this.oauthTokenState = uuidv4();
    await this.save();
    return `https://id.twitch.tv/oauth2/authorize?client_id=${
      Config.getConfig().twitch_app_client_id
    }&redirect_uri=${getRedirectURI()}&response_type=code&scope=channel:read:redemptions&state=${this.oauthTokenState}`;
  }

  public async setAuthTokens(accessToken: string, refreshToken: string, checkOwnership = false) {
    if (checkOwnership) {
      const apiClient = new ApiClient({ authProvider: new StaticAuthProvider(Config.getConfig().twitch_app_client_id, accessToken) });
      const tokenUser = await apiClient.helix.users.getMe(false);
      if (tokenUser.name.toLowerCase() !== this.channel) return false;
    }
    this.oauthTokenState = null;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    await this.save();
    return true;
  }

  public getAuthProvider() {
    if (!this.accessToken || !this.refreshToken) throw new Error(`Twitch channel ${this.channel} has not authorized with progbot`);
    return new RefreshableAuthProvider(new StaticAuthProvider(Config.getConfig().twitch_app_client_id, this.accessToken), {
      clientSecret: Config.getConfig().twitch_app_client_secret,
      refreshToken: this.refreshToken,
      onRefresh: (async ({ accessToken, refreshToken }: AccessToken) => await this.setAuthTokens(accessToken, refreshToken)).bind(this),
    });
  }

  public async setChannelPointIntegration(enabled = true) {
    if (!this.accessToken || !this.refreshToken) throw new Error(`Twitch channel ${this.channel} has not authorized with progbot`);
    this.channelPointsIntegration = enabled;
    await this.save();
  }

  public static getChannelPointChannels() {
    return TwitchChannel.find({ where: { channelPointsIntegration: true } });
  }

  public static async getAllChannels() {
    return TwitchChannel.find();
  }

  public static async getChannel(channel: string) {
    return TwitchChannel.findOne({ where: { channel: channel.toLowerCase() } });
  }

  public static async getChannelByOauthState(oauthState: string) {
    return TwitchChannel.findOne({ where: { oauthTokenState: oauthState } });
  }

  public static async createNewChannel(channel: string) {
    if (await TwitchChannel.getChannel(channel)) throw new Error(`Channel ${channel} already exists`);
    const newChannel = new TwitchChannel();
    newChannel.channel = channel.toLowerCase();
    newChannel.disabledCommands = new Set();
    await newChannel.save();
    return newChannel;
  }
}
