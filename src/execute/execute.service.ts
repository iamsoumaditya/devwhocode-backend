import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, gte, inArray, sql, lte, count, asc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as excutorSchema from './schema';
import * as problemSchema from '../problems/schema';
import * as userSchema from '../users/schema';
import * as labSchema from '../lab_assistant/schema';
import { runCollection, submitCollection, languages, files } from './tables';
import {
  problems,
  problemDetails,
  testcases,
  problemsTestcases,
} from '../problems/tables';
import { users } from '../users/tables';
import {
  ExecutionResultDto,
  RunCodeDto,
  SubmitCodeDto,
  CollectionType,
  LeaderboardDto,
  LeaderboardEntry,
  LeaderboardResponseDto,
  StatsDto,
  StatResultDto,
  StatGroupBy,
  StatCollectionType,
} from './dto';
import {
  ExecutorRequest,
  ExecutorResponse,
  ExecutorTestcase,
  ResultOfExecution,
  RawRecord,
} from './types';
import { SCORE_WEIGHTS } from './constant';

@Injectable()
export class ExecuteService {
  private readonly logger = new Logger(ExecuteService.name);
  private readonly executorBaseUrl: string;

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<
      typeof excutorSchema &
      typeof problemSchema &
      typeof userSchema &
      typeof labSchema
    >,
    private readonly configService: ConfigService,
  ) {
    this.executorBaseUrl =
      this.configService.getOrThrow<string>('EXECUTOR_BASE_URL');
  }

  private avgExecTime(results: ExecutorResponse['results']): number {
    if (!results.length) return 0;
    const total = results.reduce((sum, r) => sum + r.status.exec_time_ms, 0);
    return Math.round(total / results.length);
  }

  private rankComparator(a: LeaderboardEntry, b: LeaderboardEntry): number {
    if (b.score !== a.score) return b.score - a.score;
    if (b.totalTestcasesPassed !== a.totalTestcasesPassed)
      return b.totalTestcasesPassed - a.totalTestcasesPassed;
    if (a.totalAttempts !== b.totalAttempts)
      return a.totalAttempts - b.totalAttempts;
    if (a.avgExecutionTime !== b.avgExecutionTime)
      return a.avgExecutionTime - b.avgExecutionTime;
    return a.firstSubmissionAt.getTime() - b.firstSubmissionAt.getTime();
  }

  private scoreRecord(
    type: CollectionType,
    record: {
      result: string | null;
      executionTime: number | null;
      testcasesPassed: number | null;
      totalTestcases: number | null;
      attemptCount: number;
    },
  ): number {
    const {
      result,
      executionTime,
      testcasesPassed,
      totalTestcases,
      attemptCount,
    } = record;

    const isAccepted = result === 'PASSED';
    const execMs = executionTime ?? SCORE_WEIGHTS.TIME_BONUS_CAP;

    const acceptedBonus = isAccepted ? SCORE_WEIGHTS.ACCEPTED_BONUS : 0;

    const timeBonus =
      Math.max(0, SCORE_WEIGHTS.TIME_BONUS_CAP - execMs) /
      SCORE_WEIGHTS.TIME_BONUS_DIVISOR;

    const attemptPenalty =
      Math.max(0, attemptCount - 1) * SCORE_WEIGHTS.ATTEMPT_PENALTY;

    let score = acceptedBonus + timeBonus - attemptPenalty;

    if (type === CollectionType.SUBMIT && testcasesPassed != null) {
      score += testcasesPassed * SCORE_WEIGHTS.PER_TESTCASE_PASSED;
    }

    return Math.max(0, Math.round(score));
  }

  private async getLanguageName(languageId: number): Promise<string> {
    const [lang] = await this.db
      .select({ language: languages.language })
      .from(languages)
      .where(eq(languages.id, languageId))
      .limit(1);

    if (!lang) {
      throw new NotFoundException(`Language with id ${languageId} not found`);
    }
    return lang.language;
  }

  private async getProblemWithDetails(problemId: string) {
    const [problem] = await this.db
      .select()
      .from(problems)
      .where(eq(problems.id, problemId))
      .limit(1);

    if (!problem) {
      throw new NotFoundException(`Problem ${problemId} not found`);
    }

    if (!problem.problemDetailsId) {
      throw new BadRequestException(
        `Problem ${problemId} has no associated details`,
      );
    }

    const [details] = await this.db
      .select()
      .from(problemDetails)
      .where(eq(problemDetails.id, problem.problemDetailsId))
      .limit(1);

    if (!details) {
      throw new NotFoundException(`Problem details for ${problemId} not found`);
    }

    return { problem, details };
  }

  private async getTestcases(
    problemDetailsId: string,
    publicOnly: boolean,
  ): Promise<ExecutorTestcase[]> {
    const rows = await this.db
      .select({
        id: testcases.id,
        input: testcases.input,
        output: testcases.output,
        isPublic: testcases.isPublic,
      })
      .from(problemsTestcases)
      .innerJoin(testcases, eq(problemsTestcases.testcaseId, testcases.id))
      .where(
        publicOnly
          ? and(
            eq(problemsTestcases.problemDetailsId, problemDetailsId),
            eq(testcases.isPublic, true),
          )
          : eq(problemsTestcases.problemDetailsId, problemDetailsId),
      );

    return rows.map((tc) => ({
      is_public: tc.isPublic ?? false,
      stdin: tc.input,
      expected_output: tc.output,
      test_id: String(tc.id),
    }));
  }

  private async callExecutor(
    payload: ExecutorRequest,
  ): Promise<ExecutorResponse> {
    const url = `${this.executorBaseUrl}/submission/test/private/`;
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Executor unreachable: ${msg}`);
      throw new ServiceUnavailableException(
        'Code execution service is currently unavailable. Please try again later.',
      );
    }

    // if (!response.ok) {
    //   const body = await response.text().catch(() => '');
    //   this.logger.error(`Executor returned HTTP ${response.status}: ${body}`);
    //   throw new ServiceUnavailableException(
    //     `Code execution service returned an error (HTTP ${response.status}). Please try again later.`,
    //   );
    // }

    try {
      return (await response.json()) as ExecutorResponse;
    } catch {
      throw new ServiceUnavailableException(
        'Code execution service returned an invalid response.',
      );
    }
  }

  private async uploadFile(
    attachment: RunCodeDto['attachment'],
  ): Promise<number | null> {
    if (!attachment) {
      return null;
    }
    const [file] = await this.db
      .insert(excutorSchema.files)
      .values({ name: attachment.name, content: attachment.contents })
      .returning();
    return file.id;
  }

  async run(userId: string, dto: RunCodeDto): Promise<ExecutionResultDto> {
    const { details } = await this.getProblemWithDetails(dto.problemId);

    if (!details.isTestcasesAvailable) {
      throw new BadRequestException(
        'Testcases are not available for this problem.',
      );
    }

    const testcaseList = await this.getTestcases(details.id, true);
    if (!testcaseList.length) {
      throw new BadRequestException(
        'No public testcases found for this problem.',
      );
    }

    const languageName = await this.getLanguageName(dto.languageId);

    let fileId: number | null = null;
    if (dto.attachment) {
      fileId = await this.uploadFile(dto.attachment);
    }

    const [exists] = await this.db
      .select()
      .from(runCollection)
      .where(
        and(
          eq(runCollection.userId, userId),
          eq(runCollection.problemId, dto.problemId),
        ),
      )
      .limit(1);

    let runRecord: typeof runCollection.$inferSelect;
    if (exists) {
      [runRecord] = await this.db
        .update(runCollection)
        .set({
          code: dto.code,
          languageId: dto.languageId,
          fileId,
          labId: dto.labId,
          status: 'EXECUTING',
          runCount: exists.runCount + 1,
          result: null,
          error: null,
          executionTime: null,
          updatedAt: new Date(),
        })
        .where(eq(runCollection.id, exists.id))
        .returning();
    } else {
      [runRecord] = await this.db
        .insert(runCollection)
        .values({
          code: dto.code,
          languageId: dto.languageId,
          fileId: fileId,
          userId,
          problemId: dto.problemId,
          labId: dto.labId,
          status: 'EXECUTING',
          runCount: 1,
        })
        .returning();
    }

    const payload: ExecutorRequest = {
      language: languageName,
      code: dto.code,
      attachment: dto.attachment
        ? {
          name: dto.attachment.name,
          contents: dto.attachment.contents,
        }
        : undefined,
      tests: testcaseList,
    };

    let execResponse: ExecutorResponse;
    try {
      execResponse = await this.callExecutor(payload);
    } catch (err) {
      await this.db
        .update(runCollection)
        .set({
          status: 'COMPLETED',
          result: 'FAILED',
          error: 'Execution service unavailable',
          updatedAt: new Date(),
        })
        .where(eq(runCollection.id, runRecord.id));
      throw err;
    }
    const avgTime = this.avgExecTime(execResponse.results ?? []);

    await this.db
      .update(runCollection)
      .set({
        status: 'COMPLETED',
        result: execResponse.status as ResultOfExecution,
        error: execResponse.error ?? null,
        executionTime: avgTime,
        updatedAt: new Date(),
      })
      .where(eq(runCollection.id, runRecord.id));

    return {
      problemId: dto.problemId,
      result: execResponse.status as ResultOfExecution,
      executionTime: avgTime,
      error: execResponse.error ?? null,
      results: execResponse.results,
    };
  }

  async submit(
    userId: string,
    dto: SubmitCodeDto,
  ): Promise<ExecutionResultDto> {
    const { details } = await this.getProblemWithDetails(dto.problemId);

    if (!details.isTestcasesAvailable) {
      throw new BadRequestException(
        'Testcases are not available for this problem.',
      );
    }

    const testcaseList = await this.getTestcases(details.id, false);
    if (!testcaseList.length) {
      throw new BadRequestException('No testcases found for this problem.');
    }

    const languageName = await this.getLanguageName(dto.languageId);

    let fileId: number | null = null;
    if (dto.attachment) {
      fileId = await this.uploadFile(dto.attachment);
    }

    let submitRecord: typeof submitCollection.$inferSelect;

    const [exist] = await this.db
      .select()
      .from(submitCollection)
      .where(
        and(
          eq(submitCollection.userId, userId),
          eq(submitCollection.problemId, dto.problemId),
        ),
      )
      .limit(1);

    if (exist) {
      [submitRecord] = await this.db
        .update(submitCollection)
        .set({
          code: dto.code,
          languageId: dto.languageId,
          fileId: fileId,
          labId: dto.labId,
          status: 'EXECUTING',
          submitCount: exist.submitCount + 1,
          result: null,
          error: null,
          executionTime: null,
          testcasesPassed: null,
          totalTestcases: testcaseList.length,
          updatedAt: new Date(),
        })
        .where(eq(submitCollection.id, exist.id))
        .returning();
    } else {
      [submitRecord] = await this.db
        .insert(submitCollection)
        .values({
          code: dto.code,
          languageId: dto.languageId,
          fileId: fileId,
          userId,
          problemId: dto.problemId,
          labId: dto.labId,
          status: 'EXECUTING',
          submitCount: 1,
          totalTestcases: testcaseList.length,
        })
        .returning();
    }

    const payload: ExecutorRequest = {
      language: languageName,
      code: dto.code,
      attachment: dto.attachment
        ? {
          name: dto.attachment.name,
          contents: dto.attachment.contents,
        }
        : undefined,
      tests: testcaseList,
    };

    let execResponse: ExecutorResponse;
    try {
      execResponse = await this.callExecutor(payload);
    } catch (err) {
      await this.db
        .update(submitCollection)
        .set({
          status: 'COMPLETED',
          result: 'FAILED',
          error: 'Execution service unavailable',
          updatedAt: new Date(),
        })
        .where(eq(submitCollection.id, submitRecord.id));
      throw err;
    }

    const passedCount = execResponse.results.filter(
      (r) => r.status.current_status === 'PASSED',
    ).length;

    const avgTime = this.avgExecTime(execResponse.results);

    await this.db
      .update(submitCollection)
      .set({
        status: 'COMPLETED',
        result: execResponse.status as ResultOfExecution,
        error: execResponse.error ?? null,
        executionTime: avgTime,
        testcasesPassed: passedCount,
        updatedAt: new Date(),
      })
      .where(eq(submitCollection.id, submitRecord.id));

    return {
      problemId: dto.problemId,
      result: execResponse.status as ResultOfExecution,
      executionTime: avgTime,
      testcasesPassed: passedCount,
      totalTestcases: testcaseList.length,
      error: execResponse.error ?? null,
      results: execResponse.results,
    };
  }

  async clearAllFiles(): Promise<{ deleted: number }> {
    const rows = await this.db.delete(files).returning({ id: files.id });
    this.logger.log(`Cleared ${rows.length} file(s) from files table`);
    return { deleted: rows.length };
  }

  async leaderboard(dto: LeaderboardDto): Promise<LeaderboardResponseDto> {
    const startDate = new Date(dto.startTime);
    if (isNaN(startDate.getTime())) {
      throw new BadRequestException('startTime is not a valid ISO-8601 date');
    }

    let rawRecords: RawRecord[] = [];

    if (dto.type === CollectionType.RUN) {
      const rows = await this.db
        .select({
          id: runCollection.id,
          userId: runCollection.userId,
          problemId: runCollection.problemId,
          result: runCollection.result,
          executionTime: runCollection.executionTime,
          testcasesPassed: sql<number | null>`null`,
          totalTestcases: sql<number | null>`null`,
          attemptCount: runCollection.runCount,
          createdAt: runCollection.createdAt,
        })
        .from(runCollection)
        .where(
          and(
            eq(runCollection.labId, dto.labId),
            gte(runCollection.createdAt, startDate),
          ),
        );
      rawRecords = rows as RawRecord[];
    } else {
      const rows = await this.db
        .select({
          id: submitCollection.id,
          userId: submitCollection.userId,
          problemId: submitCollection.problemId,
          result: submitCollection.result,
          executionTime: submitCollection.executionTime,
          testcasesPassed: submitCollection.testcasesPassed,
          totalTestcases: submitCollection.totalTestcases,
          attemptCount: submitCollection.submitCount,
          createdAt: submitCollection.createdAt,
        })
        .from(submitCollection)
        .where(
          and(
            eq(submitCollection.labId, dto.labId),
            gte(submitCollection.createdAt, startDate),
          ),
        );
      rawRecords = rows as RawRecord[];
    }

    if (!rawRecords.length) {
      return {
        labId: dto.labId,
        type: dto.type,
        startTime: dto.startTime,
        generatedAt: new Date().toISOString(),
        entries: [],
      };
    }

    const distinctUserIds = [
      ...new Set(rawRecords.map((r) => r.userId).filter(Boolean) as string[]),
    ];

    const distinctProblemIds = [
      ...new Set(
        rawRecords.map((r) => r.problemId).filter(Boolean) as string[],
      ),
    ];

    const userRows = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(inArray(users.id, distinctUserIds));

    const problemRows = await this.db
      .select({
        id: problems.id,
        name: problems.name,
      })
      .from(problems)
      .where(inArray(problems.id, distinctProblemIds));

    const userMap = new Map(userRows.map((u) => [u.id, u]));
    const problemMap = new Map(problemRows.map((p) => [p.id, p]));

    const byUser = new Map<string, RawRecord[]>();
    for (const rec of rawRecords) {
      if (!rec.userId) continue;
      if (!byUser.has(rec.userId)) byUser.set(rec.userId, []);
      byUser.get(rec.userId)!.push(rec);
    }

    const entries: LeaderboardEntry[] = [];

    for (const [userId, userRecords] of byUser.entries()) {
      const user = userMap.get(userId);

      let totalScore = 0;
      let totalAttempts = 0;
      let totalAccepted = 0;
      let totalTestcasesPassed = 0;
      let totalExecTime = 0;
      let problemCount = 0;
      let firstSubmission = new Date(8640000000000000);
      const problemBreakdown: LeaderboardEntry['problemBreakdown'] = [];

      for (const rec of userRecords) {
        if (!rec.problemId) continue;

        const attempts = rec.attemptCount ?? 1;

        const problemScore = this.scoreRecord(dto.type, {
          result: rec.result,
          executionTime: rec.executionTime,
          testcasesPassed: rec.testcasesPassed,
          totalTestcases: rec.totalTestcases,
          attemptCount: attempts,
        });

        totalScore += problemScore;
        totalAttempts += attempts;
        totalTestcasesPassed += rec.testcasesPassed ?? 0;
        totalExecTime += rec.executionTime ?? 0;
        problemCount++;

        if (rec.result === 'PASSED') totalAccepted++;
        if (rec.createdAt < firstSubmission) firstSubmission = rec.createdAt;

        problemBreakdown.push({
          problemId: rec.problemId,
          problemName: problemMap.get(rec.problemId)?.name ?? null,
          attempts,
          result: rec.result,
          testcasesPassed: rec.testcasesPassed,
          totalTestcases: rec.totalTestcases,
          executionTime: rec.executionTime,
          score: problemScore,
        });
      }

      entries.push({
        rank: 0,
        userId,
        userName: user?.name ?? null,
        userEmail: user?.email ?? null,
        score: totalScore,
        totalAttempts,
        totalAccepted,
        totalTestcasesPassed,
        avgExecutionTime:
          problemCount > 0 ? Math.round(totalExecTime / problemCount) : 0,
        firstSubmissionAt: firstSubmission,
        problemBreakdown: problemBreakdown.sort((a, b) =>
          a.problemId.localeCompare(b.problemId),
        ),
      });
    }

    entries.sort(this.rankComparator);

    let currentRank = 1;
    for (let i = 0; i < entries.length; i++) {
      if (
        i > 0 &&
        entries[i].score === entries[i - 1].score &&
        entries[i].totalTestcasesPassed ===
        entries[i - 1].totalTestcasesPassed &&
        entries[i].totalAttempts === entries[i - 1].totalAttempts &&
        entries[i].avgExecutionTime === entries[i - 1].avgExecutionTime
      ) {
        entries[i].rank = entries[i - 1].rank; // tied
      } else {
        entries[i].rank = currentRank;
      }
      currentRank++;
    }

    return {
      labId: dto.labId,
      type: dto.type,
      startTime: dto.startTime,
      generatedAt: new Date().toISOString(),
      entries,
    };
  }

  async stats(dto: StatsDto): Promise<StatResultDto> {
    const fromDate = dto.from ? new Date(dto.from) : null;
    const toDate = dto.to ? new Date(dto.to) : null;

    const runConditions = [
      dto.labId ? eq(runCollection.labId, dto.labId) : undefined,
      dto.problemId ? eq(runCollection.problemId, dto.problemId) : undefined,
      fromDate ? gte(runCollection.createdAt, fromDate) : undefined,
      toDate ? lte(runCollection.createdAt, toDate) : undefined,
    ].filter(Boolean) as ReturnType<typeof eq>[];

    const submitConditions = [
      dto.labId ? eq(submitCollection.labId, dto.labId) : undefined,
      dto.problemId ? eq(submitCollection.problemId, dto.problemId) : undefined,
      fromDate ? gte(submitCollection.createdAt, fromDate) : undefined,
      toDate ? lte(submitCollection.createdAt, toDate) : undefined,
    ].filter(Boolean) as ReturnType<typeof eq>[];

    const groupExpr = (
      collection: typeof runCollection | typeof submitCollection,
    ) => {
      switch (dto.groupBy) {
        case StatGroupBy.MONTH:
          return sql<string>`to_char(${collection.createdAt}, 'YYYY-MM')`;
        case StatGroupBy.DEPT:
          return sql<string>`${users.departmentId}`;
        case StatGroupBy.SEMESTER:
          return sql<string>`${users.sem}`;
        case StatGroupBy.BATCH:
          return sql<string>`${users.batch}`;
        default:
          return sql<string>`to_char(${collection.createdAt}, 'YYYY-MM')`;
      }
    };

    const needsUserJoin = [
      StatGroupBy.DEPT,
      StatGroupBy.SEMESTER,
      StatGroupBy.BATCH,
    ].includes(dto.groupBy);

    type RawStat = { group: string; cnt: number; accepted: number };

    const runStats: RawStat[] = [];
    const submitStats: RawStat[] = [];

    const shouldQueryRun =
      dto.collectionType === StatCollectionType.RUN ||
      dto.collectionType === StatCollectionType.BOTH;

    const shouldQuerySubmit =
      dto.collectionType === StatCollectionType.SUBMIT ||
      dto.collectionType === StatCollectionType.BOTH;

    if (shouldQueryRun) {
      const baseQuery = this.db
        .select({
          group: groupExpr(runCollection).as('grp'),
          cnt: count(runCollection.id).as('cnt'),
          accepted: sql<number>`
            count(*) filter (where ${runCollection.result} = 'PASSED')
          `.as('accepted'),
        })
        .from(runCollection);

      const withJoin = needsUserJoin
        ? baseQuery.leftJoin(users, eq(runCollection.userId, users.id))
        : baseQuery;

      const withWhere =
        runConditions.length > 0
          ? withJoin.where(and(...runConditions))
          : withJoin;

      const rows = await (withWhere as any)
        .groupBy(sql`grp`)
        .orderBy(asc(sql`grp`));

      for (const r of rows) {
        runStats.push({
          group: r.group ?? 'Unknown',
          cnt: Number(r.cnt),
          accepted: Number(r.accepted),
        });
      }
    }

    if (shouldQuerySubmit) {
      const baseQuery = this.db
        .select({
          group: groupExpr(submitCollection).as('grp'),
          cnt: count(submitCollection.id).as('cnt'),
          accepted: sql<number>`
            count(*) filter (where ${submitCollection.result} = 'PASSED')
          `.as('accepted'),
        })
        .from(submitCollection);

      const withJoin = needsUserJoin
        ? baseQuery.leftJoin(users, eq(submitCollection.userId, users.id))
        : baseQuery;

      const withWhere =
        submitConditions.length > 0
          ? withJoin.where(and(...submitConditions))
          : withJoin;

      const rows = await (withWhere as any)
        .groupBy(sql`grp`)
        .orderBy(asc(sql`grp`));

      for (const r of rows) {
        submitStats.push({
          group: r.group ?? 'Unknown',
          cnt: Number(r.cnt),
          accepted: Number(r.accepted),
        });
      }
    }

    const mergedMap = new Map<
      string,
      { runCount: number; submitCount: number; acceptedCount: number }
    >();

    for (const r of runStats) {
      const entry = mergedMap.get(r.group) ?? {
        runCount: 0,
        submitCount: 0,
        acceptedCount: 0,
      };
      entry.runCount += r.cnt;
      entry.acceptedCount += r.accepted;
      mergedMap.set(r.group, entry);
    }

    for (const s of submitStats) {
      const entry = mergedMap.get(s.group) ?? {
        runCount: 0,
        submitCount: 0,
        acceptedCount: 0,
      };
      entry.submitCount += s.cnt;
      entry.acceptedCount += s.accepted;
      mergedMap.set(s.group, entry);
    }

    const data = Array.from(mergedMap.entries())
      .map(([group, v]) => ({
        group,
        runCount: v.runCount,
        submitCount: v.submitCount,
        acceptedCount: v.acceptedCount,
        totalCount: v.runCount + v.submitCount,
      }))
      .sort((a, b) => a.group.localeCompare(b.group));

    return {
      groupBy: dto.groupBy,
      collectionType: dto.collectionType ?? StatCollectionType.BOTH,
      data,
    };
  }
}
