import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as problemSchema from './schema';
import * as labSchema from '../lab_assistant/schema';
import {
  CreateProblemDto,
  ProblemWithDetailsResponseDto,
  ProblemResponseDto,
  ProblemDetailsResponseDto,
  ProblemDetailsWithTestcasesDto,
  UpdateProblemDto,
  TestcaseDto,
  TestcaseResponseDto,
  AssignmentDto,
  AssignmentResponseDto,
  AssignmentToLabResponseDto,
  AssignmentToLabDto,
  ProblemToAssignmentDto,
  ReorderProblemsDto,
  ProblemToAssignmentResponseDto,
  AssignmentProblemResponseDto,
  AssignmentFromLabResponseDto,
  ActivateAssignmentDto,
  ActivateAssignmentResponseDto,
} from './dto';
import { plainToInstance } from 'class-transformer';
import { and, asc, eq, inArray } from 'drizzle-orm';
import type { RequestUser } from '../common/strategies/jwt.strategy';
import { ProblemDetailsWithTestcasesAndCodeDto } from './dto/problem.reponse.dto';
import { runCollection, submitCollection } from '../execute/schema';

@Injectable()
export class ProblemsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<
      typeof problemSchema & typeof labSchema
    >,
  ) { }

  async create(dto: CreateProblemDto): Promise<ProblemWithDetailsResponseDto> {
    return this.db.transaction(async (tx) => {
      const [detail] = await tx
        .insert(problemSchema.problemDetails)
        .values({
          content: dto.content,
          hint: dto.hint,
          canAttachFile: dto.canAttachFile,
          isTestcasesAvailable: dto.isTestcasesAvailable,
        })
        .returning();

      const slug = dto.name.toLowerCase().replace(/\s+/g, '-');
      const [problem] = await tx
        .insert(problemSchema.problems)
        .values({
          name: dto.name,
          slug,
          type: dto.type,
          problemDetailsId: detail.id,
        })
        .returning();

      if (dto.testcases?.length) {
        const insertedTcs = await tx
          .insert(problemSchema.testcases)
          .values(dto.testcases)
          .returning();

        await tx.insert(problemSchema.problemsTestcases).values(
          insertedTcs.map((tc) => ({
            problemDetailsId: detail.id,
            testcaseId: tc.id,
          })),
        );
      }

      return { ...problem, problemDetails: detail };
    });
  }

  async findAll(): Promise<ProblemResponseDto[]> {
    const rows = await this.db.query.problems.findMany();

    return plainToInstance(ProblemResponseDto, rows, {
      excludeExtraneousValues: true,
    });
  }

  async findOne(id: string, user: RequestUser): Promise<ProblemDetailsWithTestcasesAndCodeDto> {
    const row = await this.db.query.problems.findFirst({
      where: eq(problemSchema.problems.id, id),
      with: {
        problemDetails: {
          with: {
            problemTestcases: {
              with: { testcase: true },
            },
          },
        },
      },
    });

    if (!row) throw new NotFoundException(`Problem ${id} not found`);

    let savedCode: string | null = null;

    const [submitRow] = await this.db
      .select({ code: submitCollection.code })
      .from(submitCollection)
      .where(
        and(
          eq(submitCollection.userId, user.id),
          eq(submitCollection.problemId, id),
        ),
      )
      .limit(1);

    if (submitRow) {
      savedCode = submitRow.code;
    } else {
      const [runRow] = await this.db
        .select({ code: runCollection.code })
        .from(runCollection)
        .where(
          and(
            eq(runCollection.userId, user.id),
            eq(runCollection.problemId, id),
          ),
        )
        .limit(1);

      if (runRow) savedCode = runRow.code;
    }


    const mapped = {
      ...row,
      code: savedCode,
      problemDetails: row.problemDetails
        ? {
          ...row.problemDetails,
        }
        : null,
      testcases: row.problemDetails
        ? row.problemDetails.problemTestcases.map((pt) => pt.testcase)
        : null,
    };
    const ret = plainToInstance(ProblemDetailsWithTestcasesAndCodeDto, mapped, {
      excludeExtraneousValues: true,
    });
    return ret;
  }

  async update(
    id: string,
    dto: UpdateProblemDto,
  ): Promise<ProblemDetailsWithTestcasesDto> {
    const existing = await this.db.query.problems.findFirst({
      where: eq(problemSchema.problems.id, id),
    });

    if (!existing) throw new NotFoundException(`Problem ${id} not found`);

    return this.db.transaction(async (tx) => {
      const {
        content,
        hint,
        canAttachFile,
        isTestcasesAvailable,
        testcases,
        ...problemFields
      } = dto;

      let updatedProblem = existing;

      if (Object.keys(problemFields).length) {
        if (problemFields.name) {
          problemFields['slug'] = problemFields.name
            .toLowerCase()
            .replace(/\s+/g, '-');
        }

        [updatedProblem] = await tx
          .update(problemSchema.problems)
          .set(problemFields)
          .where(eq(problemSchema.problems.id, id))
          .returning();
      }

      const detailFields = {
        content,
        hint,
        canAttachFile,
        isTestcasesAvailable,
      };
      const hasDetailFields = Object.values(detailFields).some(
        (v) => v !== undefined,
      );

      let updatedDetail: ProblemDetailsResponseDto | undefined;

      if (hasDetailFields) {
        if (!existing.problemDetailsId)
          throw new BadRequestException(
            `Problem ${id} has no details to update`,
          );

        // strip undefined keys so Drizzle doesn't overwrite with null
        const cleanDetailFields = Object.fromEntries(
          Object.entries(detailFields).filter(([, v]) => v !== undefined),
        );

        [updatedDetail] = await tx
          .update(problemSchema.problemDetails)
          .set(cleanDetailFields)
          .where(eq(problemSchema.problemDetails.id, existing.problemDetailsId))
          .returning();
      } else if (existing.problemDetailsId) {
        // fetch existing detail so we can return it even if nothing changed
        updatedDetail = await tx.query.problemDetails.findFirst({
          where: eq(problemSchema.problemDetails.id, existing.problemDetailsId),
        });
      }

      let newTestcases: (typeof problemSchema.testcases.$inferSelect)[] = [];

      if (testcases?.length) {
        if (!existing.problemDetailsId)
          throw new BadRequestException(
            `Problem ${id} has no details — cannot attach testcases`,
          );

        newTestcases = await tx
          .insert(problemSchema.testcases)
          .values(testcases)
          .returning();

        await tx.insert(problemSchema.problemsTestcases).values(
          newTestcases.map((tc) => ({
            problemDetailsId: existing.problemDetailsId!,
            testcaseId: tc.id,
          })),
        );
      }

      let allTestcases: (typeof problemSchema.testcases.$inferSelect)[] = [];

      if (existing.problemDetailsId) {
        const links = await tx.query.problemsTestcases.findMany({
          where: eq(
            problemSchema.problemsTestcases.problemDetailsId,
            existing.problemDetailsId,
          ),
          with: { testcase: true },
        });
        allTestcases = links.map((l) => l.testcase);
      }

      return plainToInstance(
        ProblemDetailsWithTestcasesDto,
        {
          ...updatedProblem,
          problemDetails: updatedDetail ? { ...updatedDetail } : null,
          testcases: allTestcases,
        },
        { excludeExtraneousValues: true },
      );
    });
  }

  async remove(id: string): Promise<void> {
    const existing = await this.db.query.problems.findFirst({
      where: eq(problemSchema.problems.id, id),
    });

    if (!existing) throw new NotFoundException(`Problem ${id} not found`);

    if (existing.problemDetailsId) {
      const linkedTcs = await this.db
        .select({ testcaseId: problemSchema.problemsTestcases.testcaseId })
        .from(problemSchema.problemsTestcases)
        .where(
          eq(
            problemSchema.problemsTestcases.problemDetailsId,
            existing.problemDetailsId,
          ),
        );

      await this.db
        .delete(problemSchema.problems)
        .where(eq(problemSchema.problems.id, id));

      await this.db
        .delete(problemSchema.problemDetails)
        .where(eq(problemSchema.problemDetails.id, existing.problemDetailsId));

      // Clean up orphaned testcase rows (no cascade from problem_testcases → testcases)
      if (linkedTcs.length) {
        await this.db.delete(problemSchema.testcases).where(
          inArray(
            problemSchema.testcases.id,
            linkedTcs.map((r) => r.testcaseId),
          ),
        );
      }
    } else {
      await this.db
        .delete(problemSchema.problems)
        .where(eq(problemSchema.problems.id, id));
    }
  }

  async updateTestcase(
    id: string,
    dto: TestcaseDto,
  ): Promise<TestcaseResponseDto> {
    const existing = await this.db.query.testcases.findFirst({
      where: eq(problemSchema.testcases.id, id),
    });

    if (!existing) throw new NotFoundException(`Testcase ${id} not found`);

    const [testcase] = await this.db
      .update(problemSchema.testcases)
      .set(dto)
      .where(eq(problemSchema.testcases.id, id))
      .returning();

    return plainToInstance(TestcaseResponseDto, testcase, {
      excludeExtraneousValues: true,
    });
  }

  async removeTestcases(ids: string[]): Promise<{ deleted: number }> {
    const existing = await this.db.query.testcases.findMany({
      where: inArray(problemSchema.testcases.id, ids),
    });

    if (existing.length !== ids.length) {
      const foundIds = existing.map((tc) => tc.id);
      const missing = ids.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(`Testcases not found: ${missing.join(', ')}`);
    }

    await this.db
      .delete(problemSchema.testcases)
      .where(inArray(problemSchema.testcases.id, ids));

    return { deleted: ids.length };
  }

  async createAssignment(dto: AssignmentDto): Promise<AssignmentResponseDto> {
    const [assignment] = await this.db
      .insert(problemSchema.assignments)
      .values({ name: dto.name })
      .returning();

    return assignment;
  }

  async updateAssignment(
    assignmentId: number,
    dto: AssignmentDto,
  ): Promise<AssignmentResponseDto> {
    const existing = await this.db.query.assignments.findFirst({
      where: eq(problemSchema.assignments.id, assignmentId),
    });

    if (!existing)
      throw new NotFoundException(`Assignment ${assignmentId} not found.`);

    const [assignment] = await this.db
      .update(problemSchema.assignments)
      .set(dto)
      .where(eq(problemSchema.assignments.id, assignmentId))
      .returning();
    return assignment;
  }

  async deleteAssignment(assignmentId: number): Promise<void> {
    const existing = await this.db.query.assignments.findFirst({
      where: eq(problemSchema.assignments.id, assignmentId),
    });

    if (!existing)
      throw new NotFoundException(`Assignment ${assignmentId} not found.`);

    await this.db
      .delete(problemSchema.assignments)
      .where(eq(problemSchema.assignments.id, assignmentId));
  }

  async assignAssignmentToLab(
    labId: number,
    dto: AssignmentToLabDto,
  ): Promise<AssignmentToLabResponseDto> {
    const lab = await this.db.query.labs.findFirst({
      where: eq(labSchema.labs.id, labId),
    });

    if (!lab) throw new NotFoundException(`Lab ${labId} not found`);

    const assignment = await this.db.query.assignments.findFirst({
      where: eq(problemSchema.assignments.id, dto.assignmentId),
    });

    if (!assignment)
      throw new NotFoundException(`Assignment ${dto.assignmentId} not found`);

    const existing = await this.db.query.labAssignments.findFirst({
      where: and(
        eq(problemSchema.labAssignments.labId, labId),
        eq(problemSchema.labAssignments.assignmentId, dto.assignmentId),
      ),
    });

    if (existing)
      throw new NotFoundException(
        `Assignment ${dto.assignmentId} already assigned to lab ${labId}`,
      );

    const [link] = await this.db
      .insert(problemSchema.labAssignments)
      .values({ labId, assignmentId: dto.assignmentId })
      .returning();

    const [result] = await this.db
      .select({
        labId: labSchema.labs.id,
        labName: labSchema.labs.name,
        assignmentId: problemSchema.assignments.id,
        assignmentName: problemSchema.assignments.name,
        isActive: problemSchema.labAssignments.isActive,
      })
      .from(problemSchema.labAssignments)
      .innerJoin(
        labSchema.labs,
        eq(problemSchema.labAssignments.labId, labSchema.labs.id),
      )
      .innerJoin(
        problemSchema.assignments,
        eq(
          problemSchema.labAssignments.assignmentId,
          problemSchema.assignments.id,
        ),
      )
      .where(
        and(
          eq(problemSchema.labAssignments.labId, link.labId),
          eq(problemSchema.labAssignments.assignmentId, link.assignmentId),
        ),
      );

    return plainToInstance(AssignmentToLabResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }
  async revokeAssignmentFromLab(
    labId: number,
    dto: AssignmentToLabDto,
  ): Promise<void> {
    const existing = await this.db.query.labAssignments.findFirst({
      where: and(
        eq(problemSchema.labAssignments.labId, labId),
        eq(problemSchema.labAssignments.assignmentId, dto.assignmentId),
      ),
    });

    if (!existing)
      throw new NotFoundException(
        `Assignment ${dto.assignmentId} is not assigned to lab ${labId}`,
      );

    await this.db
      .delete(problemSchema.labAssignments)
      .where(
        and(
          eq(problemSchema.labAssignments.labId, labId),
          eq(problemSchema.labAssignments.assignmentId, dto.assignmentId),
        ),
      );
  }

  async assignProblemToAssignment(
    assignmentId: number,
    dto: ProblemToAssignmentDto,
  ): Promise<ProblemToAssignmentResponseDto> {
    const assignment = await this.db.query.assignments.findFirst({
      where: eq(problemSchema.assignments.id, assignmentId),
    });
    if (!assignment)
      throw new NotFoundException(`Assignment ${assignmentId} not found`);

    const problem = await this.db.query.problems.findFirst({
      where: eq(problemSchema.problems.id, dto.problemId),
    });
    if (!problem)
      throw new NotFoundException(`Problem ${dto.problemId} not found`);

    const existing = await this.db.query.assignmentProblems.findFirst({
      where: and(
        eq(problemSchema.assignmentProblems.assignmentId, assignmentId),
        eq(problemSchema.assignmentProblems.problemId, dto.problemId),
      ),
    });
    if (existing)
      throw new BadRequestException(
        `Problem already assigned to assignment ${assignmentId}`,
      );

    const [link] = await this.db
      .insert(problemSchema.assignmentProblems)
      .values({ assignmentId, problemId: dto.problemId })
      .returning();
    return link;
  }

  async revokeProblemFromAssignment(
    assignmentId: number,
    dto: ProblemToAssignmentDto,
  ): Promise<void> {
    const existing = await this.db.query.assignmentProblems.findFirst({
      where: and(
        eq(problemSchema.assignmentProblems.assignmentId, assignmentId),
        eq(problemSchema.assignmentProblems.problemId, dto.problemId),
      ),
    });
    if (!existing)
      throw new NotFoundException(
        `Problem ${dto.problemId} is not in assignment ${assignmentId}`,
      );

    await this.db
      .delete(problemSchema.assignmentProblems)
      .where(
        and(
          eq(problemSchema.assignmentProblems.assignmentId, assignmentId),
          eq(problemSchema.assignmentProblems.problemId, dto.problemId),
        ),
      );
  }

  async reorderProblems(
    assignmentId: number,
    dto: ReorderProblemsDto,
  ): Promise<AssignmentProblemResponseDto[]> {
    const assignment = await this.db.query.assignments.findFirst({
      where: eq(problemSchema.assignments.id, assignmentId),
    });
    if (!assignment)
      throw new NotFoundException(`Assignment ${assignmentId} not found`);

    const links = await this.db.query.assignmentProblems.findMany({
      where: eq(problemSchema.assignmentProblems.assignmentId, assignmentId),
    });

    const linkedIds = links.map((l) => l.problemId);

    if (dto.problemIds.length !== linkedIds.length)
      throw new BadRequestException(
        `problemIds must include all problems in the assignment`,
      );

    const allBelong = dto.problemIds.every((id) => linkedIds.includes(id));
    if (!allBelong)
      throw new BadRequestException(
        `Some problems do not belong to assignment ${assignmentId}`,
      );

    return this.db.transaction(async (tx) => {
      await Promise.all(
        dto.problemIds.map((problemId, index) =>
          tx
            .update(problemSchema.assignmentProblems)
            .set({ order: index + 1 })
            .where(
              and(
                eq(problemSchema.assignmentProblems.assignmentId, assignmentId),
                eq(problemSchema.assignmentProblems.problemId, problemId),
              ),
            ),
        ),
      );

      return tx.query.assignmentProblems.findMany({
        where: eq(problemSchema.assignmentProblems.assignmentId, assignmentId),
        with: { problem: true },
        orderBy: asc(problemSchema.assignmentProblems.order),
      });
    });
  }

  async findAllAssignments(): Promise<AssignmentResponseDto[]> {
    const rows = await this.db.query.assignments.findMany();
    return plainToInstance(AssignmentResponseDto, rows, {
      excludeExtraneousValues: true,
    });
  }

  async findProblemsInAssignment(
    assignmentId: number,
  ): Promise<AssignmentProblemResponseDto[]> {
    const assignment = await this.db.query.assignments.findFirst({
      where: eq(problemSchema.assignments.id, assignmentId),
    });
    if (!assignment)
      throw new NotFoundException(`Assignment ${assignmentId} not found`);

    const rows = await this.db.query.assignmentProblems.findMany({
      where: eq(problemSchema.assignmentProblems.assignmentId, assignmentId),
      with: { problem: true },
      orderBy: asc(problemSchema.assignmentProblems.order),
    });

    return plainToInstance(AssignmentProblemResponseDto, rows, {
      excludeExtraneousValues: true,
    });
  }

  async findAssignmentsOfLab(
    labId: number,
  ): Promise<AssignmentFromLabResponseDto[]> {
    const lab = await this.db.query.labs.findFirst({
      where: eq(labSchema.labs.id, labId),
    });
    if (!lab) throw new NotFoundException(`Lab ${labId} not found`);

    const rows = await this.db.query.labAssignments.findMany({
      where: eq(problemSchema.labAssignments.labId, labId),
      with: { assignment: true },
    });

    return plainToInstance(AssignmentFromLabResponseDto, rows, {
      excludeExtraneousValues: true,
    });
  }

  async activateAssignment(
    assignmentId: number,
    dto: ActivateAssignmentDto,
  ): Promise<ActivateAssignmentResponseDto> {
    const existing = await this.db.query.labAssignments.findFirst({
      where: and(
        eq(problemSchema.labAssignments.labId, dto.labId),
        eq(problemSchema.labAssignments.assignmentId, assignmentId),
      ),
    });
    if (!existing)
      throw new NotFoundException(
        `Assignment ${assignmentId} is not assigned to lab ${dto.labId}`,
      );

    await this.db
      .update(problemSchema.labAssignments)
      .set({ isActive: false })
      .where(eq(problemSchema.labAssignments.labId, dto.labId));

    const [updated] = await this.db
      .update(problemSchema.labAssignments)
      .set({ isActive: true })
      .where(
        and(
          eq(problemSchema.labAssignments.labId, dto.labId),
          eq(problemSchema.labAssignments.assignmentId, assignmentId),
        ),
      )
      .returning();

    return updated;
  }
}
