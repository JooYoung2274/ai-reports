import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RawUpload } from '../entities/raw-upload.entity';
import { User } from '../entities/user.entity';
import { Session } from '../entities/session.entity';
import { Message } from '../entities/message.entity';
import { ParserService } from './parser.service';

@Module({
  imports: [TypeOrmModule.forFeature([RawUpload, User, Session, Message])],
  providers: [ParserService],
  exports: [ParserService],
})
export class ParserModule {}
