CREATE TABLE "assignment_Problems" (
	"assignment_id" integer NOT NULL,
	"problem_id" uuid NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "assignment_Problems_assignment_id_problem_id_pk" PRIMARY KEY("assignment_id","problem_id")
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_assignments" (
	"lab_id" integer NOT NULL,
	"assignment_id" integer NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	CONSTRAINT "lab_assignments_assignment_id_lab_id_pk" PRIMARY KEY("assignment_id","lab_id")
);
--> statement-breakpoint
ALTER TABLE "assignment_Problems" ADD CONSTRAINT "assignment_Problems_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_Problems" ADD CONSTRAINT "assignment_Problems_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_assignments" ADD CONSTRAINT "lab_assignments_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_assignments" ADD CONSTRAINT "lab_assignments_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problems" DROP COLUMN "serial_no";