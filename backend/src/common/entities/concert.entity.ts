import {
  Entity,
  ObjectIdColumn,
  ObjectId,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Seat } from './seat.entity';

@Entity('concerts')
export class Concert {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  artist: string;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column()
  venue: string;

  @Column()
  location: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ default: 0 })
  totalSeats: number;

  @Column({ default: 0 })
  availableSeats: number;

  @Column({ default: 'upcoming' })
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';

  @Column({ nullable: true })
  imageUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Seat, (seat) => seat.concert)
  seats: Seat[];
}
