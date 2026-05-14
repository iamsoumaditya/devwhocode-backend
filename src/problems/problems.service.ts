import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as problemSchema from './schema';
import {
  CreateProblemDto,
  ProblemWithDetailsResponseDto,
  ProblemResponseDto,
  ProblemDetailsResponseDto,
  ProblemDetailsWithTestcasesDto,
  UpdateProblemDto,
} from './dto';
import { plainToInstance } from 'class-transformer';
import { eq, inArray } from 'drizzle-orm';

@Injectable()
export class ProblemsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof problemSchema>,
  ) {}

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
          serialNo: dto.serialNo,
          type: dto.type,
          points: dto.points,
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
    const rows = await this.db.query.problems.findMany({
      orderBy: (p, { asc }) => asc(p.serialNo),
    });

    return plainToInstance(ProblemResponseDto, rows, {
      excludeExtraneousValues: true,
    });
  }

  async findOne(id: string): Promise<ProblemDetailsWithTestcasesDto> {
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

    const mapped = {
      ...row,
      problemDetails: row.problemDetails
        ? {
            ...row.problemDetails,
            testcases: row.problemDetails.problemTestcases.map(
              (pt) => pt.testcase,
            ),
          }
        : null,
    };

    return plainToInstance(ProblemDetailsWithTestcasesDto, mapped, {
      excludeExtraneousValues: true,
    });
  }

  async update(id: string, dto: UpdateProblemDto): Promise<ProblemDetailsWithTestcasesDto> {
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

      let updatedDetail:ProblemDetailsResponseDto|undefined;

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
          problemDetails: updatedDetail
            ? { ...updatedDetail, testcases: allTestcases }
            : null,
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
}
