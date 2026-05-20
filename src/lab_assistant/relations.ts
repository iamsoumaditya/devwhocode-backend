import { relations } from "drizzle-orm";
import { labAssistants, labs } from "./tables";
import { labAssignments } from "../problems/tables";
import { submitCollection } from "../execute/tables";

export const labAssistantsRelation = relations(labAssistants, ({ one }) => ({
  lab: one(labs, {
    fields: [labAssistants.labId],
    references: [labs.id],
  }),
}));

export const labRelations = relations(labs, ({ one, many }) => ({
  labAssistant: one(labAssistants, {
    fields: [labs.id],
    references: [labAssistants.labId],
  }),

  labAssignments: many(labAssignments),
  submitCollections: many(submitCollection),
}));