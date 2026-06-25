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
import { ParserService } from './parser.service';

describe('ParserService', () => {
  let moduleRef: any;
  let ingest: IngestService; let parser: ParserService; let messages: any;
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
      providers: [IngestService, ParserService],
    }).compile();
    moduleRef = mod;
    ingest = mod.get(IngestService); parser = mod.get(ParserService);
    messages = mod.get('MessageRepository');
    rawUploadRepo = mod.get(getRepositoryToken(RawUpload));
    userRepo = mod.get(getRepositoryToken(User));
    sessionRepo = mod.get(getRepositoryToken(Session));
    messageRepo = mod.get(getRepositoryToken(Message));

    // Clean up this spec's fixtures in FK-safe order so the test is repeatable
    await messageRepo.delete({ id: 'p1' });
    await messageRepo.delete({ id: 'a1' });
    await sessionRepo.delete({ id: 'sess-A' });
    const user = await userRepo.findOneBy({ email: 'joo@co' });
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
      await userRepo.delete({ email: 'joo@co' });
    }
    await rawUploadRepo.delete({ uploadedBy: 'joo@co' });
  });

  afterAll(async () => { await moduleRef.close(); });

  it('normalizes a prompt + assistant pair', async () => {
    await ingest.ingest({ uploadedBy: 'joo@co', lines: [
      { sourceFile: 's1.jsonl', rawJson: { uuid: 'p1', sessionId: 'sess-A', type: 'user',
        timestamp: '2026-06-25T02:00:00.000Z', cwd: '/x', message: { role: 'user', content: 'hi there' } } },
      { sourceFile: 's1.jsonl', rawJson: { uuid: 'a1', sessionId: 'sess-A', type: 'assistant',
        timestamp: '2026-06-25T02:00:01.000Z', message: { role: 'assistant', model: 'claude-opus-4-8',
          content: [{ type: 'text', text: 'hello' }], usage: { input_tokens: 10, output_tokens: 2 } } } },
    ]});
    const n = await parser.processUnparsed();
    expect(n).toBeGreaterThanOrEqual(2);
    const prompt = await messages.findOneBy({ id: 'p1' });
    expect(prompt.isPrompt).toBe(true);
    expect(prompt.text).toBe('hi there');
    const asst = await messages.findOneBy({ id: 'a1' });
    expect(asst.inputTokens).toBe(10);
  });

  it('is idempotent on re-parse', async () => {
    const before = await messages.count();
    await parser.processUnparsed();
    expect(await messages.count()).toBe(before);
  });
});
