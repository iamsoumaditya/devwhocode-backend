import { relations } from 'drizzle-orm';
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
import { labAssistants, labs } from '../lab_assistant/schema';

export const problemsType = pgEnum('type', ['Easy', 'Medium', 'Hard']);

export const problems = pgTable('problems', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  type: problemsType('type').notNull(),
  points: integer('points').notNull(),
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
    createdAt: timestamp('created_at').defaultNow().notNull()
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
      .references(() => assignments.id),
    isActive: boolean('is_active').default(false).notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.assignmentId, table.labId],
    }),
  }),
);

export const problemRelations = relations(problems, ({ one, many }) => ({
  problemDetails: one(problemDetails, {
    fields: [problems.problemDetailsId],
    references: [problemDetails.id],
  }),

  assignmentProblems: many(assignmentProblems),
}));

export const problemDetailsRelation = relations(problemDetails, ({ many }) => ({
  problemTestcases: many(problemsTestcases),
}));

export const testcasesRelation = relations(testcases, ({ many }) => ({
  problemTestcases: many(problemsTestcases),
}));

export const problemsTestcasesRelations = relations(
  problemsTestcases,
  ({ one }) => ({
    problemDetails: one(problemDetails, {
      fields: [problemsTestcases.problemDetailsId],
      references: [problemDetails.id],
    }),
    testcase: one(testcases, {
      fields: [problemsTestcases.testcaseId],
      references: [testcases.id],
    }),
  }),
);

export const assignmentsProblemsRelations = relations(
  assignmentProblems,
  ({ one }) => ({
    assignment: one(assignments, {
      fields: [assignmentProblems.assignmentId],
      references: [assignments.id],
    }),
    problem: one(problems, {
      fields: [assignmentProblems.problemId],
      references: [problems.id],
    }),
  }),
);

export const assignmentsRelations = relations(assignments, ({ many }) => ({
  assignmentProblems: many(assignmentProblems),
  labAssignments: many(labAssignments),
}));

export const labRelations = relations(labs, ({ one,many }) => ({
  labAssistant: one(labAssistants, {
    fields: [labs.id],
    references: [labAssistants.labId],
  }),

  labAssignments: many(labAssignments),
}));

export const labAssignmentsRelations = relations(labAssignments, ({ one }) => ({
  assignment: one(assignments, {
    fields: [labAssignments.assignmentId],
    references: [assignments.id],
  }),
  lab: one(labs, {
    fields: [labAssignments.labId],
    references: [labs.id],
  }),
}));