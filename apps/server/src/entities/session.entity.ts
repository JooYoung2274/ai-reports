import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('sessions')
export class Session {
  @PrimaryColumn() id!: string;
  @Index()
  @Column({ name: 'user_id', type: 'bigint' }) userId!: string;
  @Column({ name: 'project_path', type: 'varchar', nullable: true }) projectPath!: string | null;
  @Column({ name: 'git_branch', type: 'varchar', nullable: true }) gitBranch!: string | null;
  @Column({ name: 'cc_version', type: 'varchar', nullable: true }) ccVersion!: string | null;
  @Column({ name: 'started_at', type: 'timestamptz', nullable: true }) startedAt!: Date | null;
  @Column({ name: 'last_event_at', type: 'timestamptz', nullable: true }) lastEventAt!: Date | null;
}
