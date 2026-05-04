import { Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { DATABASE_CONNECTION } from './database-connection';
import * as userSchema from '../users/schema';
import * as labAssiantSchema from '../lab_assistant/schema';

@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const pool = new Pool({
          connectionString: config.get<string>('DATABASE_URL'),
        });

        return drizzle(pool, {
          schema: {
            ...userSchema,
            ...labAssiantSchema,
          },
        });
      },
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
