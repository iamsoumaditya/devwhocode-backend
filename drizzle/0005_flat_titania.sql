CREATE TYPE "public"."result" AS ENUM('PASSED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('EXECUTING', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"content" text
);
--> statement-breakpoint
CREATE TABLE "languages" (
	"id" serial PRIMARY KEY NOT NULL,
	"language" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "run_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"language_id" integer,
	"file_id" integer,
	"user_id" uuid,
	"problem_id" uuid,
	"run_count" integer DEFAULT 0 NOT NULL,
	"status" "status" DEFAULT 'EXECUTING' NOT NULL,
	"result" "result",
	"error" text,
	"execution_time" integer,
	"lab_id" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submit_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"language_id" integer,
	"file_id" integer,
	"user_id" uuid,
	"problem_id" uuid,
	"submit_count" integer DEFAULT 0 NOT NULL,
	"status" "status" DEFAULT 'EXECUTING' NOT NULL,
	"result" "result",
	"error" text,
	"execution_time" integer,
	"testcases_passed" integer,
	"total_testcases" integer,
	"lab_id" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lab_assignments" DROP CONSTRAINT "lab_assignments_assignment_id_assignments_id_fk";
--> statement-breakpoint
ALTER TABLE "run_collections" ADD CONSTRAINT "run_collections_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."languages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_collections" ADD CONSTRAINT "run_collections_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_collections" ADD CONSTRAINT "run_collections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_collections" ADD CONSTRAINT "run_collections_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_collections" ADD CONSTRAINT "run_collections_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submit_collections" ADD CONSTRAINT "submit_collections_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."languages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submit_collections" ADD CONSTRAINT "submit_collections_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submit_collections" ADD CONSTRAINT "submit_collections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submit_collections" ADD CONSTRAINT "submit_collections_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submit_collections" ADD CONSTRAINT "submit_collections_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_assignments" ADD CONSTRAINT "lab_assignments_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problems" DROP COLUMN "points";