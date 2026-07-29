import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { eq, and, count, desc, inArray } from 'drizzle-orm';
import { users, departments } from './tables';
import * as userSchema from './schema';
import { assignmentProblems, assignments, problems } from '../problems/tables';
import { runCollection, submitCollection, languages } from '../execute/tables';
import {
  UserRunsDto,
  UserSubmitsDto,
  UsersQueryDataDto,
  UsersQueryDto,
  UserSubmitsDataDto,
  UserRunsDataDto,
  UserStatsDto,
  ProblemStatDto,
  StatsResponseDto,
} from './dto';
import { RequestUser } from '../common/strategies/jwt.strategy';
@Injectable()
@UseGuards(JwtAuthGuard)
export class UsersService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof userSchema>,
  ) { }

  private async assertUserExists(userId: string): Promise<void> {
    const [user] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) throw new NotFoundException(`User ${userId} not found`);
  }

  private assertCanAccessUser(user: RequestUser, paramId: string): void {
    const isLabAssistant = user.role === 'lab_assistant';
    const isSelf = user.role === 'student' && user.id === paramId;

    if (!isLabAssistant && !isSelf) {
      throw new ForbiddenException(
        "You are not allowed to access another user's data",
      );
    }
  }

  async findAll(
    query: UsersQueryDto,
  ): Promise<{ data: UsersQueryDataDto[]; total: number }> {
    const { section, batch, sem, departmentId, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const filters = [
      section !== undefined ? eq(users.section, section) : undefined,
      batch !== undefined ? eq(users.batch, batch as any) : undefined,
      sem !== undefined ? eq(users.sem, sem) : undefined,
      departmentId !== undefined
        ? eq(users.departmentId, departmentId)
        : undefined,
    ].filter(Boolean) as ReturnType<typeof eq>[];

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const [data, [{ total }]] = await Promise.all([
      this.db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          sem: users.sem,
          roll: users.roll,
          section: users.section,
          batch: users.batch,
          score: users.score,
          departmentId: users.departmentId,
          departmentName: departments.name,
        })
        .from(users)
        .leftJoin(departments, eq(users.departmentId, departments.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset),

      this.db.select({ total: count() }).from(users).where(whereClause),
    ]);

    return { data, total: Number(total) };
  }

  async findAllRunsByUserId(
    userId: string,
    user: RequestUser,
    query: UserRunsDto,
  ): Promise<{ data: UserRunsDataDto[]; total: number }> {
    this.assertCanAccessUser(user, userId);

    await this.assertUserExists(userId);

    const { problemId, labId, status, result, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const filters = [
      eq(runCollection.userId, userId),
      problemId ? eq(runCollection.problemId, problemId) : undefined,
      labId ? eq(runCollection.labId, labId) : undefined,
      status ? eq(runCollection.status, status as any) : undefined,
      result ? eq(runCollection.result, result as any) : undefined,
    ].filter(Boolean) as ReturnType<typeof eq>[];

    const whereClause = and(...filters);

    const [data, [{ total }]] = await Promise.all([
      this.db
        .select({
          id: runCollection.id,
          code: runCollection.code,
          runCount: runCollection.runCount,
          status: runCollection.status,
          result: runCollection.result,
          error: runCollection.error,
          executionTime: runCollection.executionTime,
          createdAt: runCollection.createdAt,
          updatedAt: runCollection.updatedAt,
          languageId: runCollection.languageId,
          language: languages.language,
          problemId: runCollection.problemId,
          problemTitle: problems.name,
          labId: runCollection.labId,
        })
        .from(runCollection)
        .leftJoin(languages, eq(runCollection.languageId, languages.id))
        .innerJoin(problems, eq(runCollection.problemId, problems.id))
        .where(whereClause)
        .orderBy(desc(runCollection.createdAt))
        .limit(limit)
        .offset(offset),

      this.db.select({ total: count() }).from(runCollection).where(whereClause),
    ]);

    return { data, total: Number(total) };
  }

  async findAllSubmitsByUserId(
    userId: string,
    user: RequestUser,
    query: UserSubmitsDto,
  ): Promise<{ data: UserSubmitsDataDto[]; total: number }> {
    this.assertCanAccessUser(user, userId);
    await this.assertUserExists(userId);

    const { problemId, labId, status, result, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const filters = [
      eq(submitCollection.userId, userId),
      problemId ? eq(submitCollection.problemId, problemId) : undefined,
      labId ? eq(submitCollection.labId, labId) : undefined,
      status ? eq(submitCollection.status, status as any) : undefined,
      result ? eq(submitCollection.result, result as any) : undefined,
    ].filter(Boolean) as ReturnType<typeof eq>[];

    const whereClause = and(...filters);

    const [data, [{ total }]] = await Promise.all([
      this.db
        .select({
          id: submitCollection.id,
          code: submitCollection.code,
          submitCount: submitCollection.submitCount,
          status: submitCollection.status,
          result: submitCollection.result,
          error: submitCollection.error,
          executionTime: submitCollection.executionTime,
          testcasesPassed: submitCollection.testcasesPassed,
          totalTestcases: submitCollection.totalTestcases,
          createdAt: submitCollection.createdAt,
          updatedAt: submitCollection.updatedAt,
          languageId: submitCollection.languageId,
          language: languages.language,
          problemId: submitCollection.problemId,
          problemTitle: problems.name,
          labId: submitCollection.labId,
        })
        .from(submitCollection)
        .leftJoin(languages, eq(submitCollection.languageId, languages.id))
        .innerJoin(problems, eq(submitCollection.problemId, problems.id))
        .where(whereClause)
        .orderBy(desc(submitCollection.createdAt))
        .limit(limit)
        .offset(offset),

      this.db
        .select({ total: count() })
        .from(submitCollection)
        .where(whereClause),
    ]);

    return { data, total: Number(total) };
  }

  async getAssignmentStatsByUserId(
    userId: string,
    user: RequestUser,
    query: UserStatsDto,
  ): Promise<StatsResponseDto> {
    this.assertCanAccessUser(user, userId);
    await this.assertUserExists(userId);

    const { assignmentId } = query;

    const assignmentRows = await this.db
      .select({
        assignmentId: assignments.id,
        assignmentName: assignments.name,
        problemId: problems.id,
        problemName: problems.name,
        problemSlug: problems.slug,
        problemType: problems.type,
        order: assignmentProblems.order,
      })
      .from(assignments)
      .innerJoin(
        assignmentProblems,
        eq(assignmentProblems.assignmentId, assignments.id),
      )
      .innerJoin(problems, eq(problems.id, assignmentProblems.problemId))
      .where(eq(assignments.id, assignmentId))
      .orderBy(assignmentProblems.order);

    if (!assignmentRows.length) {
      throw new NotFoundException(`Assignment ${assignmentId} not found`);
    }

    const problemIds = assignmentRows.map((r) => r.problemId);

    const runRows = await this.db
      .select({ problemId: runCollection.problemId })
      .from(runCollection)
      .where(
        and(
          eq(runCollection.userId, userId),
          inArray(runCollection.problemId, problemIds),
        ),
      );

    const submitRows = await this.db
      .select({
        problemId: submitCollection.problemId,
        result: submitCollection.result,
      })
      .from(submitCollection)
      .where(
        and(
          eq(submitCollection.userId, userId),
          inArray(submitCollection.problemId, problemIds),
        ),
      );

    const attemptedSet = new Set(runRows.map((r) => r.problemId));
    const acceptedSet = new Set(
      submitRows.filter((s) => s.result === 'PASSED').map((s) => s.problemId),
    );

    const problem: ProblemStatDto[] = assignmentRows.map((p) => ({
      problemId: p.problemId,
      problemName: p.problemName,
      problemSlug: p.problemSlug,
      problemType: p.problemType,
      order: p.order,
      attempted: attemptedSet.has(p.problemId),
      accepted: acceptedSet.has(p.problemId),
    }));

    const totalProblems = problem.length;
    const attemptedCount = problem.filter((p) => p.attempted).length;
    const acceptedCount = problem.filter((p) => p.accepted).length;

    return {
      assignmentId,
      assignmentName: assignmentRows[0].assignmentName,
      totalProblems,
      attemptedCount,
      acceptedCount,
      attemptedPercentage: Math.round((attemptedCount / totalProblems) * 100),
      acceptedPercentage: Math.round((acceptedCount / totalProblems) * 100),
      problems: problem,
    };
  }
}
