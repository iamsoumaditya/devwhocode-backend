CREATE TYPE "public"."type" AS ENUM('Easy', 'Medium', 'Hard');--> statement-breakpoint
CREATE TABLE "problem_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"hint" text,
	"can_attach_file" boolean DEFAULT false,
	"is_testcases_available" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "problems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" "type" NOT NULL,
	"score" integer NOT NULL,
	"serial_no" serial NOT NULL,
	"problem_details_id" uuid
);
--> statement-breakpoint
CREATE TABLE "problem_testcases" (
	"problems_details_id" uuid NOT NULL,
	"testcase_id" uuid NOT NULL,
	CONSTRAINT "problem_testcases_problems_details_id_testcase_id_pk" PRIMARY KEY("problems_details_id","testcase_id")
);
--> statement-breakpoint
CREATE TABLE "testcases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"input" text NOT NULL,
	"output" text NOT NULL,
	"is_public" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "problems" ADD CONSTRAINT "problems_problem_details_id_problem_details_id_fk" FOREIGN KEY ("problem_details_id") REFERENCES "public"."problem_details"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_testcases" ADD CONSTRAINT "problem_testcases_problems_details_id_problem_details_id_fk" FOREIGN KEY ("problems_details_id") REFERENCES "public"."problem_details"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_testcases" ADD CONSTRAINT "problem_testcases_testcase_id_testcases_id_fk" FOREIGN KEY ("testcase_id") REFERENCES "public"."testcases"("id") ON DELETE cascade ON UPDATE no action;