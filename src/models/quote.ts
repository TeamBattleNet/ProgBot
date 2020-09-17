import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity()
export class Quote extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ collation: 'NOCASE' })
  user: string;

  @Column({ collation: 'NOCASE' })
  quote: string;

  @Column({ default: '' })
  date?: string;

  public static async getRandomQuote(filter?: string) {
    const query = Quote.createQueryBuilder('q');
    if (filter) query.where('q.quote LIKE :filter OR q.user LIKE :filter', { filter: `%${filter}%` });
    return query.orderBy('RANDOM()').limit(1).getOne();
  }
}
