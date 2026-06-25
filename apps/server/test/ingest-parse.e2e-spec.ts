import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ParserService } from '../src/parser/parser.service';
import { Message } from '../src/entities/message.entity';
import { Session } from '../src/entities/session.entity';
import { User } from '../src/entities/user.entity';
import { RawUpload } from '../src/entities/raw-upload.entity';

describe('Ingest+Parse e2e', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();

    // Clean up this spec's own fixtures in FK-safe order before running tests
    const messageRepo: Repository<Message> = app.get(getRepositoryToken(Message));
    const sessionRepo: Repository<Session> = app.get(getRepositoryToken(Session));
    const userRepo: Repository<User> = app.get(getRepositoryToken(User));
    const rawUploadRepo: Repository<RawUpload> = app.get(getRepositoryToken(RawUpload));

    // Delete messages referencing our fixture session
    await messageRepo.delete({ sessionId: 'e2e-s' });
    // Delete the fixture session
    await sessionRepo.delete({ id: 'e2e-s' });
    // Delete the fixture user
    await userRepo.delete({ email: 'e2e@co' });
    // Delete any raw_uploads from our fixture user
    await rawUploadRepo.delete({ uploadedBy: 'e2e@co' });
  });

  afterAll(async () => { await app.close(); });

  it('ingest -> parse -> overview', async () => {
    await request(app.getHttpServer()).post('/ingest').send({
      uploadedBy: 'e2e@co',
      lines: [{ sourceFile: 'e.jsonl', rawJson: { uuid: 'e2e-1', sessionId: 'e2e-s', type: 'user',
        timestamp: '2026-06-22T00:00:00.000Z', cwd: '/e', message: { role: 'user', content: 'e2e prompt' } } }],
    }).expect(201);
    await app.get(ParserService).processUnparsed();
    const res = await request(app.getHttpServer()).get('/reports/prompts?q=e2e prompt').expect(200);
    expect(res.body.items.some((i: any) => i.text === 'e2e prompt')).toBe(true);
  });
});
