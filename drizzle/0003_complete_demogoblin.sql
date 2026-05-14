ALTER TABLE "problem_testcases" RENAME COLUMN "problems_details_id" TO "problem_detail_id";--> statement-breakpoint
ALTER TABLE "problem_testcases" DROP CONSTRAINT "problem_testcases_problems_details_id_problem_details_id_fk";
--> statement-breakpoint
ALTER TABLE "problem_testcases" DROP CONSTRAINT "problem_testcases_problems_details_id_testcase_id_pk";--> statement-breakpoint
ALTER TABLE "problem_testcases" ADD CONSTRAINT "problem_testcases_problem_detail_id_testcase_id_pk" PRIMARY KEY("problem_detail_id","testcase_id");--> statement-breakpoint
ALTER TABLE "problem_testcases" ADD CONSTRAINT "problem_testcases_problem_detail_id_problem_details_id_fk" FOREIGN KEY ("problem_detail_id") REFERENCES "public"."problem_details"("id") ON DELETE cascade ON UPDATE no action;