export type RawRecord = {
  id: string;
  userId: string | null;
  problemId: string | null;
  result: string | null;
  executionTime: number | null;
  testcasesPassed: number | null;
  totalTestcases: number | null;
  attemptCount: number;
  createdAt: Date;
};
