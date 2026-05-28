import { relations } from 'drizzle-orm';
import { departments, users } from './tables';
import { runCollection, submitCollection } from '../execute/tables';

export const usersRelation = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  runCollections: many(runCollection),
  submitCollections: many(submitCollection),
}));

export const departmentsRelation = relations(departments, ({ many }) => ({
  user: many(users),
}));
