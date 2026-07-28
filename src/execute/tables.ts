import {
  text,
  serial,
  integer,
  timestamp,
  uuid,
  pgTable,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { CODE_EXECUTION_STATUS } from './constant';
import { labs } from '../lab_assistant/schema';
import { problems } from '../problems/tables';
import { users } from '../users/tables';

export const statusType = pgEnum('status', CODE_EXECUTION_STATUS);
export const resultType = pgEnum('result', ['PASSED', 'FAILED']);

export const languages = pgTable('languages', {
  id: serial('id').primaryKey(),
  language: text('language').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export const files = pgTable('files', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  content: text('content'),
});
export const runCollection = pgTable('run_collections', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull(),
  languageId: integer('language_id').references(() => languages.id, {
    onDelete: 'set null',
  }),
  fileId: integer('file_id').references(() => files.id, {
    onDelete: 'set null',
  }),
  userId: uuid('user_id').references(() => users.id, {
    onDelete: 'cascade',
  }),
  problemId: uuid('problem_id')
    .notNull()
    .references(() => problems.id, {
      onDelete: 'cascade',
    }),
  runCount: integer('run_count').default(0).notNull(),
  status: statusType('status').default('EXECUTING').notNull(),
  result: resultType('result'),
  error: text('error'),
  executionTime: integer('execution_time'),
  labId: integer('lab_id')
    .references(() => labs.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export const submitCollection = pgTable('submit_collections', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull(),
  languageId: integer('language_id').references(() => languages.id, {
    onDelete: 'set null',
  }),
  fileId: integer('file_id').references(() => files.id, {
    onDelete: 'set null',
  }),
  userId: uuid('user_id').references(() => users.id, {
    onDelete: 'cascade',
  }),
  problemId: uuid('problem_id')
    .notNull()
    .references(() => problems.id, {
      onDelete: 'cascade',
    }),
  submitCount: integer('submit_count').default(0).notNull(),
  status: statusType('status').default('EXECUTING').notNull(),
  result: resultType('result'),
  error: text('error'),
  executionTime: integer('execution_time'),
  testcasesPassed: integer('testcases_passed'),
  totalTestcases: integer('total_testcases'),
  labId: integer('lab_id')
    .references(() => labs.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});
