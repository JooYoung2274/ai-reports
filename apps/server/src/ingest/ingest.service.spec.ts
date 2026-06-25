import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { RawUpload } from '../entities/raw-upload.entity';
import { IngestService } from './ingest.service';
import { ParserService } from '../parser/parser.service';

describe('IngestService', () => {
  let moduleRef: any;
  let service: IngestService;
  let rawUploadRepo: Repository<RawUpload>;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ ...AppDataSource.options, autoLoadEntities: true }),
        TypeOrmModule.forFeature([RawUpload]),
      ],
      providers: [
        IngestService,
        { provide: ParserService, useValue: { processUnparsed: jest.fn().mockResolvedValue(0) } },
      ],
    }).compile();
    moduleRef = mod;
    service = mod.get(IngestService);
    rawUploadRepo = mod.get(getRepositoryToken(RawUpload));
    // Clean up rows this spec will create so the test is repeatable
    await rawUploadRepo.delete({ uploadedBy: 'me@co' });
  });

  afterAll(async () => { await moduleRef.close(); });

  it('dedupes identical lines', async () => {
    const line = { sourceFile: 'a.jsonl', rawJson: { uuid: 'x', type: 'user' } };
    const first = await service.ingest({ uploadedBy: 'me@co', lines: [line] });
    const second = await service.ingest({ uploadedBy: 'me@co', lines: [line] });
    expect(first.inserted).toBe(1);
    expect(second.duplicates).toBe(1);
    expect(second.inserted).toBe(0);
  });
});
