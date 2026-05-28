import {
  pgEnum,
  serial,
  boolean,
  integer,
  text,
  uuid,
  pgTable,
  primaryKey,
  timestamp,
} from 'drizzle-orm/pg-core';
import { PROBLEM_TYPE } from './constant';
import { labs } from '../lab_assistant/tables';

export const problemsType = pgEnum('type', PROBLEM_TYPE);

export const problems = pgTable('problems', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  type: problemsType('type').notNull(),
  problemDetailsId: uuid('problem_details_id').references(
    () => problemDetails.id,
    { onDelete: 'cascade' },
  ),
});

export const problemDetails = pgTable('problem_details', {
  id: uuid('id').defaultRandom().primaryKey(),
  content: text('content').notNull(),
  hint: text('hint'),
  canAttachFile: boolean('can_attach_file').default(false).notNull(),
  isTestcasesAvailable: boolean('is_testcases_available')
    .default(true)
    .notNull(),
});

export const testcases = pgTable('testcases', {
  id: uuid('id').defaultRandom().primaryKey(),
  input: text('input').notNull(),
  output: text('output').notNull(),
  isPublic: boolean('is_public').default(false),
});

export const problemsTestcases = pgTable(
  'problem_testcases',
  {
    problemDetailsId: uuid('problem_detail_id')
      .references(() => problemDetails.id, { onDelete: 'cascade' })
      .notNull(),
    testcaseId: uuid('testcase_id')
      .references(() => testcases.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.problemDetailsId, table.testcaseId],
    }),
  }),
);

export const assignments = pgTable('assignments', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
});

export const assignmentProblems = pgTable(
  'assignment_Problems',
  {
    assignmentId: integer('assignment_id')
      .notNull()
      .references(() => assignments.id, {
        onDelete: 'cascade',
      }),
    problemId: uuid('problem_id')
      .notNull()
      .references(() => problems.id, { onDelete: 'cascade' }),
    order: integer('order').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.assignmentId, table.problemId],
    }),
  }),
);

export const labAssignments = pgTable(
  'lab_assignments',
  {
    labId: integer('lab_id')
      .notNull()
      .references(() => labs.id, { onDelete: 'cascade' }),
    assignmentId: integer('assignment_id')
      .notNull()
      .references(() => assignments.id, { onDelete: 'cascade' }),
    isActive: boolean('is_active').default(false).notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.assignmentId, table.labId],
    }),
  }),
);
