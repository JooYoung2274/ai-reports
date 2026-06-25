import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { RawUpload } from '../entities/raw-upload.entity';
import { User } from '../entities/user.entity';
import { Session } from '../entities/session.entity';
import { Message } from '../entities/message.entity';
import { parseClaudeLine } from './claude-code.parser';

@Injectable()
export class ParserService {
  constructor(
    @InjectRepository(RawUpload) private raws: Repository<RawUpload>,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Session) private sessions: Repository<Session>,
    @InjectRepository(Message) private messages: Repository<Message>,
  ) {}

  private async userIdFor(email: string): Promise<string> {
    await this.users.createQueryBuilder().insert().into(User)
      .values({ email }).orIgnore().execute();
    const u = await this.users.findOneByOrFail({ email });
    return u.id;
  }

  async processUnparsed(): Promise<number> {
    const batch = await this.raws.find({ where: { parsedAt: IsNull() }, take: 500 });
    let count = 0;
    for (const raw of batch) {
      const ev = parseClaudeLine(raw.rawJson as any);
      if (ev) {
        const userId = await this.userIdFor(raw.uploadedBy);
        await this.sessions.createQueryBuilder().insert().into(Session)
          .values({ id: ev.sessionId, userId, projectPath: ev.projectPath,
            gitBranch: ev.gitBranch, ccVersion: ev.ccVersion,
            startedAt: ev.eventAt, lastEventAt: ev.eventAt })
          .orUpdate(['last_event_at'], ['id']).execute();
        await this.messages.createQueryBuilder().insert().into(Message)
          .values({ id: ev.messageUuid, sessionId: ev.sessionId, userId,
            parentUuid: ev.parentUuid, role: ev.role, type: ev.type, isPrompt: ev.isPrompt,
            text: ev.text, model: ev.model, inputTokens: ev.tokens.input, outputTokens: ev.tokens.output,
            cacheCreationTokens: ev.tokens.cacheCreation, cacheReadTokens: ev.tokens.cacheRead,
            eventAt: ev.eventAt })
          .orIgnore().execute();
        count++;
      }
      raw.parsedAt = new Date();
      await this.raws.save(raw);
    }
    return count;
  }
}
