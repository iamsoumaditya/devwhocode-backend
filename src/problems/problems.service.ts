import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as problemSchema from './schema';
import { CreateProblemDto, CreateProblemResponseDto } from './dto';

@Injectable()
export class ProblemsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof problemSchema>,
  ) {}

  async create(dto: CreateProblemDto): Promise<CreateProblemResponseDto> {
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
}
