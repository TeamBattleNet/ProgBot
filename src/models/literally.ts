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
    if (filter) query.where('q.what LIKE :filter', { filter: `%${filter}%` });
    return query.orderBy('RANDOM()').limit(1).getOne();
  }

  public static async isDuplicate(what: string, clip: string) {
    return Boolean(await Literally.findOne({ where: { what, clip } }));
  }

  public static async createNewLiterally(what: string, clip: string) {
    const newLit = new Literally();
    newLit.what = what;
    newLit.clip = clip;
    await newLit.save();
    return newLit;
  }
}
