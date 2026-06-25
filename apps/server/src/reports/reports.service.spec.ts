import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { RawUpload } from '../entities/raw-upload.entity';
import { User } from '../entities/user.entity';
import { Session } from '../entities/session.entity';
import { Message } from '../entities/message.entity';
import { IngestService } from '../ingest/ingest.service';
import { ParserService } from '../parser/parser.service';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let moduleRef: any;
  let ingest: IngestService; let parser: ParserService; let reports: ReportsService;
  let rawUploadRepo: Repository<RawUpload>;
  let userRepo: Repository<User>;
  let sessionRepo: Repository<Session>;
  let messageRepo: Repository<Message>;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ ...AppDataSource.options, autoLoadEntities: true }),
        TypeOrmModule.forFeature([RawUpload, User, Session, Message]),
      ],
      providers: [IngestService, ParserService, ReportsService],
    }).compile();
    moduleRef = mod;
    ingest = mod.get(IngestService); parser = mod.get(ParserService); reports = mod.get(ReportsService);
    rawUploadRepo = mod.get(getRepositoryToken(RawUpload));
    userRepo = mod.get(getRepositoryToken(User));
    sessionRepo = mod.get(getRepositoryToken(Session));
    messageRepo = mod.get(getRepositoryToken(Message));

    // Clean up this spec's own fixtures in FK-safe order so the test is repeatable
    await messageRepo.delete({ sessionId: 'rs1' });
    await sessionRepo.delete({ id: 'rs1' });
    const user = await userRepo.findOneBy({ email: 'rep@co' });
    if (user) {
      await messageRepo
        .createQueryBuilder()
        .delete()
        .where('"user_id" = :uid', { uid: user.id })
        .execute();
      await sessionRepo
        .createQueryBuilder()
        .delete()
        .where('"user_id" = :uid', { uid: user.id })
        .execute();
      await userRepo.delete({ email: 'rep@co' });
    }
    await rawUploadRepo.delete({ uploadedBy: 'rep@co' });

    await ingest.ingest({ uploadedBy: 'rep@co', lines: [
      { sourceFile: 'r.jsonl', rawJson: { uuid: 'rp1', sessionId: 'rs1', type: 'user',
        timestamp: '2026-06-20T05:00:00.000Z', cwd: '/p', message: { role: 'user', content: 'find bugs please' } } },
      { sourceFile: 'r.jsonl', rawJson: { uuid: 'ra1', sessionId: 'rs1', type: 'assistant',
        timestamp: '2026-06-20T05:00:01.000Z', message: { role: 'assistant', model: 'claude-opus-4-8',
          content: [{ type: 'text', text: 'ok' }], usage: { input_tokens: 50, output_tokens: 7 } } } },
    ]});
    await parser.processUnparsed();
  });

  afterAll(async () => { await moduleRef.close(); });

  it('overview aggregates prompts and tokens', async () => {
    const o = await reports.overview({});
    expect(o.totals.prompts).toBeGreaterThanOrEqual(1);
    expect(o.totals.inputTokens).toBeGreaterThanOrEqual(50);
    expect(o.dailyPrompts.find((d: { date: string; count: number }) => d.date === '2026-06-20')!.count).toBeGreaterThanOrEqual(1);
  });

  it('prompts returns human prompt text only', async () => {
    const p = await reports.prompts({ q: 'find bugs' });
    expect(p.items[0].text).toContain('find bugs');
  });
});
