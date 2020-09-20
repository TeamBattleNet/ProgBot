import { Entity, PrimaryColumn, Column, BaseEntity } from 'typeorm';

@Entity()
export class SimpleCommand extends BaseEntity {
  @PrimaryColumn()
  cmd: string;

  @Column()
  reply: string;

  public static async getAllCommands() {
    return SimpleCommand.find();
  }

  public static async getByCmd(cmd: string) {
    return SimpleCommand.findOne({ where: { cmd } });
  }
}
