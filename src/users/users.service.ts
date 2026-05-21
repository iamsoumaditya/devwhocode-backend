import { Inject, Injectable, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { NodePgDatabase } from 'drizzle-orm/node-postgres/driver';
import * as userSchema from './schema';

@Injectable()
@UseGuards(JwtAuthGuard)
export class UsersService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof userSchema>,
  ) {}
}
