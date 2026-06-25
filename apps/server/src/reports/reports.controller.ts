import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(AdminGuard)
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('overview')
  overview(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.overview({ from, to });
  }
  @Get('users/:userId')
  user(@Param('userId') userId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.service.userDetail(userId, { from, to });
  }
  @Get('prompts')
  prompts(@Query() q: any) {
    return this.service.prompts({ userId: q.userId, from: q.from, to: q.to, project: q.project, q: q.q, cursor: q.cursor, limit: q.limit ? Number(q.limit) : undefined });
  }
  @Get('tokens')
  tokens(@Query('groupBy') groupBy: 'day' | 'user' | 'model' = 'day', @Query('from') from?: string, @Query('to') to?: string) {
    return this.service.tokens({ groupBy, from, to });
  }
}
