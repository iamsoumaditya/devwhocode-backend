import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  serial,
  pgEnum,
  integer,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['lab_assistant', 'admin']);

export const labAssistants = pgTable('lab_assistants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  role: roleEnum('role').default('lab_assistant'),
  labId: integer('lab_id').references(() => labs.id, { onDelete: 'set null' }),
});

export const labs = pgTable('labs', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
});

export const labAssistantsRelation = relations(labAssistants, ({ one }) => ({
  lab: one(labs, {
    fields: [labAssistants.labId],
    references: [labs.id],
  }),
}));

export const labRelations = relations(labs, ({ one }) => ({
  labAssistant: one(labAssistants, {
    fields: [labs.id],
    references: [labAssistants.labId],
  }),
}));
