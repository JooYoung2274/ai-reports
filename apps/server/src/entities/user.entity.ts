import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id!: string;
  @Index({ unique: true })
  @Column() email!: string;
  @Column({ name: 'display_name', type: 'varchar', nullable: true }) displayName!: string | null;
  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' }) createdAt!: Date;
}
