import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Admin guard', () => {
  let app: INestApplication;
  let priorToken: string | undefined;

  beforeAll(async () => {
    priorToken = process.env.ADMIN_TOKEN;
    process.env.ADMIN_TOKEN = 'secret';
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    if (priorToken === undefined) {
      delete process.env.ADMIN_TOKEN;
    } else {
      process.env.ADMIN_TOKEN = priorToken;
    }
  });

  it('401 without token', () => request(app.getHttpServer()).get('/reports/overview').expect(401));
  it('200 with token', () => request(app.getHttpServer()).get('/reports/overview').set('x-admin-token', 'secret').expect(200));
});
