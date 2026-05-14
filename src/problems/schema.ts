import { relations } from 'drizzle-orm';
import { pgEnum,serial,boolean,integer,text,uuid,pgTable,primaryKey } from 'drizzle-orm/pg-core';


export const problemsType = pgEnum('type', ['Easy', 'Medium', 'Hard']);

export const problems = pgTable('problems', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  type: problemsType('type').notNull(),
  points: integer('points').notNull(),
  serialNo: serial('serial_no').notNull(),
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
  isTestcasesAvailable: boolean('is_testcases_available').default(true).notNull(),
});

export const testcases = pgTable('testcases', {
    id: uuid('id').defaultRandom().primaryKey(),
    input: text('input').notNull(),
    output: text('output').notNull(),
    isPublic:boolean('is_public').default(false),
})

export const problemsTestcases = pgTable('problem_testcases', {
    problemDetailsId: uuid('problem_detail_id').references(()=>problemDetails.id,{onDelete:"cascade"}).notNull(),
    testcaseId:uuid('testcase_id').references(()=>testcases.id,{onDelete:"cascade"}).notNull()
},
    (table) => ({
        pk: primaryKey({
        columns:[table.problemDetailsId,table.testcaseId]
    })
    })
)


export const problemRelations = relations(problems, ({ one }) => ({
  problemDetails: one(problemDetails, {
    fields: [problems.problemDetailsId],
    references: [problemDetails.id],
  }),
}));

export const problemDetailsRelation = relations(problemDetails, ({ many }) => ({
    problemTestcases:many(problemsTestcases)
}))

export const testcasesRelation = relations(testcases, ({ many }) => ({
  problemTestcases: many(problemsTestcases),
}));

export const problemsTestcasesRelations = relations(problemsTestcases, ({ one }) => ({
    problemDetails: one(problemDetails, {
        fields: [problemsTestcases.problemDetailsId],
        references:[problemDetails.id]
    }),
    testcase: one(testcases, {
        fields: [problemsTestcases.testcaseId],
        references:[testcases.id],
    })
}))
