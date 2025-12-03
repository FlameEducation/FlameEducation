export interface PythonCodeRunResult {
  runCode: string;
  output: string;
  isSuccess: boolean;
  errorLine: number;
  errorMessage: string;
  errorType: string;
  friendlyMessage: string;
}