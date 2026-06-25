import { Module, Controller, Get } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from './data-source';

@Controller('health')
class HealthController {
  @Get()
  health() { return { status: 'ok' }; }
}

@Module({
  imports: [TypeOrmModule.forRoot({ ...AppDataSource.options, autoLoadEntities: true })],
  controllers: [HealthController],
})
export class AppModule {}
