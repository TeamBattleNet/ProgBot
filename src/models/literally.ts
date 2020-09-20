import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity()
export class Literally extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ collation: 'NOCASE' })
  what: string;

  @Column()
  clip: string;

  public static async getRandomLiterally(filter?: string) {
    const query = Literally.createQueryBuilder('q');
    if (filter) query.where('q.what = :filter', { filter });
    return query.orderBy('RANDOM()').limit(1).getOne();
  }

  public static async isDuplicate(what: string, clip: string) {
    return Boolean(await Literally.findOne({ where: { what, clip } }));
  }
}
