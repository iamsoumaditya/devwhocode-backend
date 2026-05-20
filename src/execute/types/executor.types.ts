import { RESULT_OF_EXECUTION } from "../constant";

export interface ExecutorTestcase {
  is_public: boolean;
  stdin: string;
  expected_output: string;
  test_id: string;
}

export interface ExecutorAttachment {
  name: string;
  contents: string;
}

export interface ExecutorRequest {
  language: string;
  code: string;
  attachment?: ExecutorAttachment;
  tests: ExecutorTestcase[];
}

export type ExecutorStatus = 'PASSED' | 'FAILED';
export type ResultOfExecution = (typeof RESULT_OF_EXECUTION)[number];

export interface ExecutorTestResult {
  test_id: string;
  status: {
    message: string;
    current_status: ExecutorStatus;
    stdout: string;
    stderr: string;
    exec_time_ms: number;
    stdin: string;
    expected_output: string;
    completed_at: string;
  };
  exec_result_id: string;
}

export interface ExecutorResponse {
  status: ExecutorStatus;
  results: ExecutorTestResult[];
  error?: string;
}
