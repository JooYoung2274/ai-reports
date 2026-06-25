import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('raw_uploads')
export class RawUpload {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id!: string;
  @Column({ name: 'uploaded_by' }) uploadedBy!: string;
  @Column({ name: 'source_file' }) sourceFile!: string;
  @Index({ unique: true })
  @Column({ name: 'line_hash' }) lineHash!: string;
  @Column({ name: 'raw_json', type: 'jsonb' }) rawJson!: Record<string, unknown>;
  @Column({ name: 'uploaded_at', type: 'timestamptz', default: () => 'now()' }) uploadedAt!: Date;
  @Column({ name: 'parsed_at', type: 'timestamptz', nullable: true }) parsedAt!: Date | null;
}
