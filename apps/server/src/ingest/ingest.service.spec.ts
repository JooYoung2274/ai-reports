import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from '../data-source';
import { RawUpload } from '../entities/raw-upload.entity';
import { IngestService } from './ingest.service';

describe('IngestService', () => {
  let service: IngestService;
  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ ...AppDataSource.options, autoLoadEntities: true }),
        TypeOrmModule.forFeature([RawUpload]),
      ],
      providers: [IngestService],
    }).compile();
    service = mod.get(IngestService);
  });

  it('dedupes identical lines', async () => {
    const line = { sourceFile: 'a.jsonl', rawJson: { uuid: 'x', type: 'user' } };
    const first = await service.ingest({ uploadedBy: 'me@co', lines: [line] });
    const second = await service.ingest({ uploadedBy: 'me@co', lines: [line] });
    expect(first.inserted).toBe(1);
    expect(second.duplicates).toBe(1);
    expect(second.inserted).toBe(0);
  });
});
