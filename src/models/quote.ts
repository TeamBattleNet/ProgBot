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

  public static async createNewQuote(user: string, quote: string, date?: string) {
    const newQuote = new Quote();
    newQuote.user = user;
    newQuote.quote = quote;
    if (date) newQuote.date = date;
    await newQuote.save();
    return newQuote;
  }
}
