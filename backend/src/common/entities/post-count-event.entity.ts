import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('post_count_events')
export class PostCountEvent {
  @PrimaryColumn('uuid')
  event_id: string;

  @Column({ type: 'bigint' })
  post_id: number;

  @Column({ type: 'int' })
  delta: number; // +1 for like, -1 for unlike

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string;

  @Column({ type: 'int', default: 0 })
  retry_count: number;

  @CreateDateColumn()
  processed_at: Date;
}
