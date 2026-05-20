import { relations } from 'drizzle-orm';
import { runCollection, submitCollection, languages, files } from './tables';
import { users } from '../users/tables';
import { problems } from '../problems/tables';
import { labs } from '../lab_assistant/tables';

export const languagesRelations = relations(languages, ({ many }) => ({
  runCollections: many(runCollection),
  submitCollections: many(submitCollection),
}));

export const filesRelations = relations(files, ({ many }) => ({
  runCollections: many(runCollection),
  submitCollections: many(submitCollection),
}));

export const runCollectionRelations = relations(runCollection, ({ one }) => ({
  language: one(languages, {
    fields: [runCollection.languageId],
    references: [languages.id],
  }),
  file: one(files, {
    fields: [runCollection.fileId],
    references: [files.id],
  }),
  user: one(users, {
    fields: [runCollection.userId],
    references: [users.id],
  }),
  problem: one(problems, {
    fields: [runCollection.problemId],
    references: [problems.id],
  }),
  lab: one(labs, {
    fields: [runCollection.labId],
    references: [labs.id],
  }),
}));


export const submitCollectionRelations = relations(
  submitCollection,
  ({ one }) => ({
    language: one(languages, {
      fields: [submitCollection.languageId],
      references: [languages.id],
    }),
    file: one(files, {
      fields: [submitCollection.fileId],
      references: [files.id],
    }),
    user: one(users, {
      fields: [submitCollection.userId],
      references: [users.id],
    }),
    problem: one(problems, {
      fields: [submitCollection.problemId],
      references: [problems.id],
    }),
    lab: one(labs, {
      fields: [submitCollection.labId],
      references: [labs.id],
    }),
  }),
);
