ALTER TABLE "problems" RENAME COLUMN "score" TO "points";--> statement-breakpoint
ALTER TABLE "problem_details" ALTER COLUMN "can_attach_file" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "problem_details" ALTER COLUMN "is_testcases_available" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "score" integer DEFAULT 0 NOT NULL;