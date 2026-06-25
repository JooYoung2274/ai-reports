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

  // Keyset-test fixture constants
  const SAME_TS = '2026-06-21T03:00:00.000Z';
  const KS_SESSION_ID = 'rs-keyset-1';
  const KS_MSG_IDS = ['keyset-msg-aaa', 'keyset-msg-bbb', 'keyset-msg-ccc'];

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

    // Clean up keyset fixtures
    for (const id of KS_MSG_IDS) await messageRepo.delete({ id });
    await sessionRepo.delete({ id: KS_SESSION_ID });
    const ksUser = await userRepo.findOneBy({ email: 'keyset@co' });
    if (ksUser) {
      await messageRepo.createQueryBuilder().delete().where('"user_id" = :uid', { uid: ksUser.id }).execute();
      await sessionRepo.createQueryBuilder().delete().where('"user_id" = :uid', { uid: ksUser.id }).execute();
      await userRepo.delete({ email: 'keyset@co' });
    }

    await ingest.ingest({ uploadedBy: 'rep@co', lines: [
      { sourceFile: 'r.jsonl', rawJson: { uuid: 'rp1', sessionId: 'rs1', type: 'user',
        timestamp: '2026-06-20T05:00:00.000Z', cwd: '/p', message: { role: 'user', content: 'find bugs please' } } },
      { sourceFile: 'r.jsonl', rawJson: { uuid: 'ra1', sessionId: 'rs1', type: 'assistant',
        timestamp: '2026-06-20T05:00:01.000Z', message: { role: 'assistant', model: 'claude-opus-4-8',
          content: [{ type: 'text', text: 'ok' }], usage: { input_tokens: 50, output_tokens: 7 } } } },
    ]});
    await parser.processUnparsed();

    // Seed keyset fixtures: a user + session + 3 prompts all sharing the SAME event_at
    const newKsUser = await userRepo.save(userRepo.create({ email: 'keyset@co', displayName: 'Keyset Test' }));
    await sessionRepo.save(sessionRepo.create({
      id: KS_SESSION_ID,
      userId: newKsUser.id,
      projectPath: '/keyset-project',
    }));
    for (let i = 0; i < KS_MSG_IDS.length; i++) {
      await messageRepo.save(messageRepo.create({
        id: KS_MSG_IDS[i],
        sessionId: KS_SESSION_ID,
        userId: newKsUser.id,
        role: 'user',
        type: 'user',
        isPrompt: true,
        text: `keyset prompt ${i + 1}`,
        eventAt: new Date(SAME_TS),
      }));
    }
  });

  afterAll(async () => {
    // Clean up keyset fixtures
    for (const id of KS_MSG_IDS) await messageRepo.delete({ id });
    await sessionRepo.delete({ id: KS_SESSION_ID });
    const ksUser = await userRepo.findOneBy({ email: 'keyset@co' });
    if (ksUser) {
      await messageRepo.createQueryBuilder().delete().where('"user_id" = :uid', { uid: ksUser.id }).execute();
      await sessionRepo.createQueryBuilder().delete().where('"user_id" = :uid', { uid: ksUser.id }).execute();
      await userRepo.delete({ email: 'keyset@co' });
    }
    await moduleRef.close();
  });

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

  it('paginates same-timestamp rows with no overlap and no skipped rows', async () => {
    const ksUser = await userRepo.findOneBy({ email: 'keyset@co' });
    const userId = ksUser!.id;

    // Page 1: limit=2, expect 2 items + a nextCursor
    const page1 = await reports.prompts({ userId, limit: 2 });
    expect(page1.items).toHaveLength(2);
    expect(page1.nextCursor).not.toBeNull();

    // Page 2: use the cursor from page 1
    const page2 = await reports.prompts({ userId, limit: 2, cursor: page1.nextCursor! });
    expect(page2.items.length).toBeGreaterThanOrEqual(1);

    const allIds = [...page1.items.map((i: any) => i.id), ...page2.items.map((i: any) => i.id)];

    // No duplicates across pages
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);

    // All 3 seeded same-timestamp rows appear across the two pages
    for (const id of KS_MSG_IDS) {
      expect(uniqueIds.has(id)).toBe(true);
    }
  });
});
