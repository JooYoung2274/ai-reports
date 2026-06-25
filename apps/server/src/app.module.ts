import { Module, Controller, Get } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from './data-source';
import { IngestModule } from './ingest/ingest.module';
import { ParserModule } from './parser/parser.module';
import { ReportsModule } from './reports/reports.module';

@Controller('health')
class HealthController {
  @Get()
  health() { return { status: 'ok' }; }
}

@Module({
  imports: [TypeOrmModule.forRoot({ ...AppDataSource.options, autoLoadEntities: true }), IngestModule, ParserModule, ReportsModule],
  controllers: [HealthController],
})
export class AppModule {}
