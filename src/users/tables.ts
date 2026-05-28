import { text, integer, pgTable, pgEnum, uuid } from 'drizzle-orm/pg-core';
import { BATCH_ENUM } from './constant';

export const batchEnum = pgEnum('batch', BATCH_ENUM);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  sem: integer('sem').notNull(),
  roll: text('roll').notNull(),
  departmentId: uuid('department_id').references(() => departments.id, {
    onDelete: 'set null',
  }),
  section: integer('section').notNull(),
  batch: batchEnum('batch').notNull(),
  score: integer('score').default(0).notNull(),
});

export const departments = pgTable('departments', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
});
