import { Entity, PrimaryGeneratedColumn, Column, Generated, BaseEntity } from 'typeorm';
import { Database } from '../clients/database';
import { v4 as uuidv4 } from 'uuid';
import { getRandomStyle } from '../utils';
import { StyleType } from '../types';

const isUUID = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

export type UserClass = 'user' | 'admin';
// Used when combining accounts to determine and keep the 'higher ranked' user class
const userClassRank: UserClass[] = ['user', 'admin'];
function pickHigherUserClass(userClass1: UserClass, userClass2: UserClass) {
  if (userClassRank.indexOf(userClass1) > userClassRank.indexOf(userClass2)) return userClass1;
  return userClass2;
}

class BattleChips {
  private battleChipCounts: { [chipId: string]: number };

  constructor(fromString?: string) {
    if (fromString) this.battleChipCounts = JSON.parse(fromString);
    else this.battleChipCounts = {};
  }

  public getCount(chipId: string | number) {
    if (chipId in this.battleChipCounts) return this.battleChipCounts[chipId];
    return 0;
  }

  public setCount(chipId: string | number, count: number) {
    this.battleChipCounts[chipId] = count;
  }

  public getAllCounts() {
    return Object.entries(this.battleChipCounts);
  }

  public toString() {
    return JSON.stringify(this.battleChipCounts);
  }
}

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Generated('uuid') // if not defined, random useless uuid is used (for uniqueness)
  twitchUserId: string;

  @Column({ unique: true })
  @Generated('uuid') // if not defined, random useless uuid is used (for uniqueness)
  discordUserId: string;

  @Column({ default: 0 })
  zenny: number;

  @Column({ default: 0 })
  bugfrags: number;

  @Column({
    type: 'varchar',
    default: '{}',
    transformer: {
      from: (val: string) => new BattleChips(val),
      to: (val: BattleChips) => val.toString(),
    },
  })
  battlechips: BattleChips;

  @Column({ nullable: true })
  style?: StyleType;

  @Column()
  lastBrowseTime: Date;

  @Column({ unique: true })
  @Generated('uuid')
  apiKey: string;

  @Column({ default: 'user' })
  userClass: UserClass;

  @Column({ nullable: true })
  linkToken?: string;

  public isAdmin() {
    return this.userClass === 'admin';
  }

  public hasTwitchId() {
    return !this.twitchUserId.match(isUUID);
  }

  public hasDiscordId() {
    return !this.discordUserId.match(isUUID);
  }

  public async getNewApiKey() {
    this.apiKey = uuidv4();
    await this.save();
    return this.apiKey;
  }

  public async generateNewLinkToken(usernameToLink: string) {
    const randomToken = uuidv4();
    this.linkToken = `${usernameToLink} ${randomToken}`;
    await this.save();
    return randomToken;
  }

  public async assignRandomStyle() {
    this.style = getRandomStyle();
    await this.save();
    return this.style;
  }

  public static async findByDiscordId(discordId: string) {
    return User.findOne({ where: { discordUserId: discordId } });
  }

  public static async findByTwitchUserId(twitchUserId: string) {
    return User.findOne({ where: { twitchUserId } });
  }

  public static async findByLinkToken(username: string, randomToken: string) {
    return User.findOne({ where: { linkToken: `${username} ${randomToken}` } });
  }

  public static async combineUsers(twitchUser: User, discordUser: User) {
    const combinedUser = new User();
    combinedUser.twitchUserId = twitchUser.twitchUserId;
    combinedUser.discordUserId = discordUser.discordUserId;
    // Combine any other properties (i.e. owned chips) here
    combinedUser.userClass = pickHigherUserClass(twitchUser.userClass, discordUser.userClass);
    combinedUser.zenny = twitchUser.zenny + discordUser.zenny;
    combinedUser.bugfrags = twitchUser.bugfrags + discordUser.bugfrags;
    const combinedBattleChips = new BattleChips();
    [twitchUser.battlechips, discordUser.battlechips].forEach((battlechips) =>
      battlechips.getAllCounts().forEach(([id, count]) => combinedBattleChips.setCount(id, combinedBattleChips.getCount(id) + count))
    );
    combinedUser.battlechips = combinedBattleChips;
    // Always take style from twitch user
    combinedUser.style = twitchUser.style;
    combinedUser.lastBrowseTime = twitchUser.lastBrowseTime > discordUser.lastBrowseTime ? twitchUser.lastBrowseTime : discordUser.lastBrowseTime;
    // Delete the old users and save the new combined one
    await Database.connection.transaction(async (transactionManager) => {
      await transactionManager.delete(User, [twitchUser.id, discordUser.id]);
      await transactionManager.save(combinedUser);
    });
    return combinedUser;
  }

  public static async createNewUser(options: { twitchUserId?: string; discordUserId?: string }) {
    if (!options.twitchUserId && !options.discordUserId) throw new Error('Must provide either a twitchUserId or discordUserId to create a new user');
    const newUser = new User();
    if (options.twitchUserId) newUser.twitchUserId = options.twitchUserId;
    if (options.discordUserId) newUser.discordUserId = options.discordUserId;
    newUser.battlechips = new BattleChips();
    newUser.lastBrowseTime = new Date();
    // Set last browse time for new users back 1 day from now to let them have a good first browse
    newUser.lastBrowseTime.setUTCDate(newUser.lastBrowseTime.getUTCDate() - 1);
    await newUser.save();
    return newUser;
  }
}
