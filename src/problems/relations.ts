import { relations } from "drizzle-orm";
import { assignmentProblems, assignments, labAssignments, problemDetails, problems, problemsTestcases, testcases } from "./tables";
import { labs } from "../lab_assistant/tables";
import { runCollection, submitCollection } from "../execute/tables";

export const problemRelations = relations(problems, ({ one, many }) => ({
  problemDetails: one(problemDetails, {
    fields: [problems.problemDetailsId],
    references: [problemDetails.id],
  }),

  assignmentProblems: many(assignmentProblems),
  runCollections: many(runCollection),
  submitCollections: many(submitCollection),
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
