import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { LabAssistantController } from './lab_assistant.controller';
import { LabAssistantService } from './lab_assistant.service';
import { AuthService } from '../auth/auth.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [DatabaseModule, JwtModule],
  controllers: [LabAssistantController],
  providers: [LabAssistantService, AuthService],
})
export class LabAssistantModule {}
