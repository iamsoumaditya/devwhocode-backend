import { Module } from '@nestjs/common';
import { ExecuteController } from './execute.controller';
import { ExecuteService } from './execute.service';
import { DatabaseModule } from '../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { GuardsModule } from '../common/guards.module';

@Module({
  imports: [DatabaseModule, JwtModule, GuardsModule],
  controllers: [ExecuteController],
  providers: [ExecuteService],
})
export class ExecuteModule {}
