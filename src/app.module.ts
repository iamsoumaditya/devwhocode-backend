import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validationSchema } from './config/validations.schema';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProblemsModule } from './problems/problems.module';
import { LabAssistantModule } from './lab_assistant/lab_assistant.module';
import { ExecuteModule } from './execute/execute.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema,
      validationOptions: {
        allowUnknown: false,
        abortEarly: true, 
      },
      validatePredefined: false,
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    ProblemsModule,
    LabAssistantModule,
    ExecuteModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
