import {
  Entity,
  ObjectIdColumn,
  ObjectId,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Seat } from './seat.entity';

@Entity('bookings')
export class Booking {
  @ObjectIdColumn()
  id: ObjectId;

  @Column({ type: 'string' })
  userId: ObjectId;

  @Column({ type: 'string' })
  seatId: ObjectId;

  @Column()
  stripePaymentIntentId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'pending' })
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.bookings)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Seat, (seat) => seat.bookings)
  @JoinColumn({ name: 'seatId' })
  seat: Seat;
}
