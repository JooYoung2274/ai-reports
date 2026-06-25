import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('messages')
@Index(['userId', 'eventAt'])
@Index(['isPrompt', 'eventAt'])
@Index(['role', 'eventAt'])
export class Message {
  @PrimaryColumn() id!: string;
  @Index()
  @Column({ name: 'session_id' }) sessionId!: string;
  @Column({ name: 'user_id', type: 'bigint' }) userId!: string;
  @Column({ name: 'parent_uuid', type: 'varchar', nullable: true }) parentUuid!: string | null;
  @Column() role!: string;
  @Column() type!: string;
  @Column({ name: 'is_prompt' }) isPrompt!: boolean;
  @Column({ type: 'text', nullable: true }) text!: string | null;
  @Column({ type: 'varchar', nullable: true }) model!: string | null;
  @Column({ name: 'input_tokens', type: 'int', nullable: true }) inputTokens!: number | null;
  @Column({ name: 'output_tokens', type: 'int', nullable: true }) outputTokens!: number | null;
  @Column({ name: 'cache_creation_tokens', type: 'int', nullable: true }) cacheCreationTokens!: number | null;
  @Column({ name: 'cache_read_tokens', type: 'int', nullable: true }) cacheReadTokens!: number | null;
  @Column({ name: 'event_at', type: 'timestamptz' }) eventAt!: Date;
}
