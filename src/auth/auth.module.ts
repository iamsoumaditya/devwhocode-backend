import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DatabaseModule } from '../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { GuardsModule } from '../common/guards.module';

@Module({
  imports: [DatabaseModule, JwtModule,GuardsModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
