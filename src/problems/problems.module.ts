import { Module } from '@nestjs/common';
import { ProblemsController } from './problems.controller';
import { ProblemsService } from './problems.service';
import { DatabaseModule } from '../database/database.module';
import { AssignmentController } from './assignment.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ProblemsController, AssignmentController],
  providers: [ProblemsService],
})
export class ProblemsModule {}
