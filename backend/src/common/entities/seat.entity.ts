import {
  Entity,
  ObjectIdColumn,
  ObjectId,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Concert } from './concert.entity';
import { Booking } from './booking.entity';

@Entity('seats')
export class Seat {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  seatNumber: string;

  @Column()
  row: string;

  @Column()
  section: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'available' })
  status: 'available' | 'reserved' | 'sold';

  @Column({ type: 'uuid' })
  concertId: string;

  @Column({ type: 'timestamp', nullable: true })
  reservedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  reservedUntil?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Concert, (concert) => concert.seats)
  @JoinColumn({ name: 'concertId' })
  concert: Concert;

  @OneToMany(() => Booking, (booking) => booking.seat)
  bookings: Booking[];
}
