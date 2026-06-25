import { Body, Controller, Post } from '@nestjs/common';
import { IngestService } from './ingest.service';
import { IngestDto } from './dto/ingest.dto';

@Controller('ingest')
export class IngestController {
  constructor(private service: IngestService) {}
  @Post()
  ingest(@Body() dto: IngestDto) { return this.service.ingest(dto); }
}
