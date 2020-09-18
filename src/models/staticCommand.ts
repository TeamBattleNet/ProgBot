import { Entity, PrimaryColumn, Column, BaseEntity } from 'typeorm';

@Entity()
export class StaticCommand extends BaseEntity {
  @PrimaryColumn()
  cmd: string;

  @Column()
  reply: string;

  public static async getAllCommands() {
    return StaticCommand.find();
  }
}
