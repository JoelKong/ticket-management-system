import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('likes')
@Index(['post_id', 'user_id'], { unique: true })
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint' })
  @Index()
  post_id: number;

  @Column({ type: 'bigint' })
  @Index()
  user_id: number;

  @CreateDateColumn()
  created_at: Date;
}
