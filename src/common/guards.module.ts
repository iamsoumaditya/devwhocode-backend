import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { StudentGuard } from './guards/student.guard';
import { AssistantGuard } from './guards/assistant.guard';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), ConfigModule],
  providers: [JwtStrategy, JwtAuthGuard, StudentGuard, AssistantGuard],
  exports: [JwtAuthGuard, StudentGuard, AssistantGuard],
})
export class GuardsModule {}
