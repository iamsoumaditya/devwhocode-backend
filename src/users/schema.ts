import { relations } from 'drizzle-orm';
import { text, integer, pgTable, pgEnum, uuid } from 'drizzle-orm/pg-core';

export const batchEnum = pgEnum('batch', ['X', 'Y']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  sem: integer('sem').notNull(),
  roll: text('roll').notNull(),
  departmentId: uuid('department_id')
    .references(() => departments.id, { onDelete: 'set null' }),
  section: integer('section').notNull(),
  batch: batchEnum('batch').notNull(),
});

export const departments = pgTable('departments', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
});

export const usersRelation = relations(users, ({ one }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
}));

export const departmentsRelation = relations(departments, ({ many }) => ({
  user: many(users),
}));
