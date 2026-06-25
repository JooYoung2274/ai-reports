import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';

type Range = { from?: string; to?: string };

@Injectable()
export class ReportsService {
  constructor(@InjectRepository(Message) private messages: Repository<Message>) {}

  private applyRange<T>(qb: any, range: Range) {
    if (range.from) qb.andWhere('m.event_at >= :from', { from: range.from });
    if (range.to) qb.andWhere('m.event_at < (:to::date + 1)', { to: range.to });
    return qb;
  }

  async overview(range: Range) {
    const totalsRow = await this.applyRange(
      this.messages.createQueryBuilder('m')
        .select('count(*) FILTER (WHERE m.is_prompt)', 'prompts')
        .addSelect('coalesce(sum(m.input_tokens),0)', 'input')
        .addSelect('coalesce(sum(m.output_tokens),0)', 'output')
        .addSelect('coalesce(sum(m.cache_creation_tokens)+sum(m.cache_read_tokens),0)', 'cache')
        .addSelect('count(distinct m.user_id)', 'users'), range).getRawOne();

    const dailyPrompts = await this.applyRange(
      this.messages.createQueryBuilder('m')
        .select("to_char(m.event_at,'YYYY-MM-DD')", 'date')
        .addSelect('count(*)', 'count')
        .where('m.is_prompt = true'), range)
      .groupBy('date').orderBy('date').getRawMany();

    const dailyTokens = await this.applyRange(
      this.messages.createQueryBuilder('m')
        .select("to_char(m.event_at,'YYYY-MM-DD')", 'date')
        .addSelect('coalesce(sum(m.input_tokens),0)', 'input')
        .addSelect('coalesce(sum(m.output_tokens),0)', 'output')
        .addSelect('coalesce(sum(m.cache_creation_tokens)+sum(m.cache_read_tokens),0)', 'cache'),
      range).groupBy('date').orderBy('date').getRawMany();

    const ranking = await this.applyRange(
      this.messages.createQueryBuilder('m')
        .leftJoin('users', 'u', 'u.id = m.user_id')
        .select('m.user_id', 'userId').addSelect('u.email', 'email')
        .addSelect('count(*) FILTER (WHERE m.is_prompt)', 'prompts')
        .addSelect('coalesce(sum(m.input_tokens)+sum(m.output_tokens),0)', 'tokens'),
      range).groupBy('m.user_id').addGroupBy('u.email')
      .orderBy('prompts', 'DESC').getRawMany();

    return {
      totals: {
        prompts: Number(totalsRow.prompts), inputTokens: Number(totalsRow.input),
        outputTokens: Number(totalsRow.output), cacheTokens: Number(totalsRow.cache),
        activeUsers: Number(totalsRow.users),
      },
      dailyPrompts: dailyPrompts.map((r: any) => ({ date: r.date, count: Number(r.count) })),
      dailyTokens: dailyTokens.map((r: any) => ({ date: r.date, input: Number(r.input), output: Number(r.output), cache: Number(r.cache) })),
      ranking: ranking.map((r: any) => ({ userId: r.userId, email: r.email, prompts: Number(r.prompts), tokens: Number(r.tokens) })),
    };
  }

  async userDetail(userId: string, range: Range) {
    const daily = await this.applyRange(
      this.messages.createQueryBuilder('m')
        .select("to_char(m.event_at,'YYYY-MM-DD')", 'date')
        .addSelect('count(*) FILTER (WHERE m.is_prompt)', 'prompts')
        .addSelect('coalesce(sum(m.input_tokens),0)', 'input')
        .addSelect('coalesce(sum(m.output_tokens),0)', 'output')
        .addSelect('coalesce(sum(m.cache_creation_tokens)+sum(m.cache_read_tokens),0)', 'cache')
        .where('m.user_id = :userId', { userId }), range)
      .groupBy('date').orderBy('date').getRawMany();
    const byModel = await this.applyRange(
      this.messages.createQueryBuilder('m')
        .select('m.model', 'model')
        .addSelect('coalesce(sum(m.input_tokens),0)', 'input')
        .addSelect('coalesce(sum(m.output_tokens),0)', 'output')
        .where('m.user_id = :userId AND m.model IS NOT NULL', { userId }), range)
      .groupBy('m.model').getRawMany();
    const byProject = await this.applyRange(
      this.messages.createQueryBuilder('m')
        .leftJoin('sessions', 's', 's.id = m.session_id')
        .select('s.project_path', 'projectPath')
        .addSelect('count(*) FILTER (WHERE m.is_prompt)', 'prompts')
        .where('m.user_id = :userId', { userId }), range)
      .groupBy('s.project_path').getRawMany();
    return {
      daily: daily.map((r: any) => ({ date: r.date, prompts: Number(r.prompts), input: Number(r.input), output: Number(r.output), cache: Number(r.cache) })),
      byModel: byModel.map((r: any) => ({ model: r.model, input: Number(r.input), output: Number(r.output) })),
      byProject: byProject.map((r: any) => ({ projectPath: r.projectPath, prompts: Number(r.prompts) })),
    };
  }

  async prompts(opts: Range & { userId?: string; project?: string; q?: string; cursor?: string; limit?: number }) {
    const limit = Math.min(opts.limit ?? 50, 200);
    const qb = this.messages.createQueryBuilder('m')
      .leftJoin('users', 'u', 'u.id = m.user_id')
      .leftJoin('sessions', 's', 's.id = m.session_id')
      .select(['m.id AS id', 'm.event_at AS "eventAt"', 'u.email AS email',
        's.project_path AS "projectPath"', 'm.session_id AS "sessionId"', 'm.text AS text',
        'm.input_tokens AS "inputTokens"', 'm.output_tokens AS "outputTokens"'])
      .where('m.is_prompt = true');
    this.applyRange(qb, opts);
    if (opts.userId) qb.andWhere('m.user_id = :userId', { userId: opts.userId });
    if (opts.project) qb.andWhere('s.project_path = :project', { project: opts.project });
    if (opts.q) qb.andWhere('m.text ILIKE :q', { q: `%${opts.q}%` });
    if (opts.cursor) {
      const [cursorEventAt, cursorId] = opts.cursor.split('|');
      qb.andWhere('(m.event_at < :cEventAt OR (m.event_at = :cEventAt AND m.id < :cId))', { cEventAt: cursorEventAt, cId: cursorId });
    }
    qb.orderBy('m.event_at', 'DESC').addOrderBy('m.id', 'DESC').limit(limit + 1);
    const rows = await qb.getRawMany();
    const items = rows.slice(0, limit);
    const lastItem = items[items.length - 1];
    const nextCursor = rows.length > limit
      ? `${lastItem.eventAt instanceof Date ? lastItem.eventAt.toISOString() : lastItem.eventAt}|${lastItem.id}`
      : null;
    return { items, nextCursor };
  }

  async tokens(opts: Range & { groupBy: 'day' | 'user' | 'model' }) {
    const keyExpr = opts.groupBy === 'day' ? "to_char(m.event_at,'YYYY-MM-DD')"
      : opts.groupBy === 'user' ? 'm.user_id::text' : "coalesce(m.model,'(none)')";
    const rows = await this.applyRange(
      this.messages.createQueryBuilder('m')
        .select(keyExpr, 'key')
        .addSelect('coalesce(sum(m.input_tokens),0)', 'input')
        .addSelect('coalesce(sum(m.output_tokens),0)', 'output')
        .addSelect('coalesce(sum(m.cache_creation_tokens),0)', 'cacheCreation')
        .addSelect('coalesce(sum(m.cache_read_tokens),0)', 'cacheRead'), opts)
      .groupBy('key').orderBy('key').getRawMany();
    return { rows: rows.map((r: any) => ({ key: r.key, input: Number(r.input), output: Number(r.output), cacheCreation: Number(r.cacheCreation), cacheRead: Number(r.cacheRead) })) };
  }
}
