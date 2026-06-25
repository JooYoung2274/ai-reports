import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RawUpload } from '../entities/raw-upload.entity';
import { IngestService } from './ingest.service';
import { IngestController } from './ingest.controller';
import { ParserModule } from '../parser/parser.module';

@Module({
  imports: [TypeOrmModule.forFeature([RawUpload]), ParserModule],
  controllers: [IngestController],
  providers: [IngestService],
  exports: [IngestService],
})
export class IngestModule {}
