import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { RawUpload } from '../entities/raw-upload.entity';
import { IngestDto, IngestResult } from './dto/ingest.dto';

@Injectable()
export class IngestService {
  constructor(@InjectRepository(RawUpload) private repo: Repository<RawUpload>) {}

  async ingest(dto: IngestDto): Promise<IngestResult> {
    const rows = dto.lines.map((l) => ({
      uploadedBy: dto.uploadedBy,
      sourceFile: l.sourceFile,
      lineHash: createHash('sha256').update(JSON.stringify(l.rawJson)).digest('hex'),
      rawJson: l.rawJson as unknown as Record<string, unknown>,
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await this.repo
      .createQueryBuilder()
      .insert()
      .into(RawUpload)
      .values(rows as any)
      .orIgnore()
      .execute();
    // Use result.raw.length: ON CONFLICT DO NOTHING omits conflicted rows from RETURNING,
    // so raw only contains actually-inserted rows. result.identifiers may include empty {}
    // for conflicted rows (truthy), which would cause overcounting with .filter(Boolean).
    const inserted = result.raw?.length ?? 0;
    return { received: rows.length, inserted, duplicates: rows.length - inserted };
  }
}
