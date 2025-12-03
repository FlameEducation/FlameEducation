import request from '@/utils/request';


export interface ProgrammingExerciseData {
  exerciseUuid: string;
  exerciseType: 'programming';
  title: string;
  description: string;
  difficulty: string;
  score: number;
  type: '自由' | '跟写' | '填空' | '修改';
  initCode: string;
  hints: string[];
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  
  // 已完成时包含答案数据
  answerData?: {
    userCode: string;
    isCorrect: boolean;
    score: number;
    feedback: string;
    judgeMode: 'output' | 'unittest';
    submittedAt: string;
    
    // Output模式的结果
    outputResult?: {
      expected: string;
      actual: string;
      passed: boolean;
      executionTime: string;
    };
    
    // Unittest模式的结果
    testResults?: {
      testOutput: string;
      totalTests: number;
      passedTests: number;
      failedTests: number;
      executionTime: string;
      testDetails: Array<{
        test: string;
        passed: boolean;
        actual?: any;
        expected?: any;
      }>;
    };
  };
}

// 预提交配置（对应 POST /preSubmit/<uuid> 接口）
export interface ProgrammingJudgeConfig {
  exerciseUuid: string;
  judgeMode: 'output' | 'unittest';
  exerciseType: '自由' | '跟写' | '填空' | '修改';
  userCode: string;
  
  // Output模式配置
  expectedOutput?: string;
  
  // Unittest模式配置
  setupCode?: string;
  referenceSolution?: string;
  unitTestCode?: string;
  fullTestCode?: string;
  
  // 跟写模式配置
  templateCode?: string;
  
  // 填空模式配置
  codeSections?: Array<{
    type: 'fix' | 'blank';
    code?: string;
    target?: string;
    placeholder?: string;
  }>;
}

// 判题结果（前端执行判题后的结果）
export interface ProgrammingJudgeResult {
  // Output模式结果
  expected?: string;
  actual?: string;
  passed?: boolean;
  executionTime?: string;
  
  // Unittest模式结果
  testOutput?: string;
  totalTests?: number;
  passedTests?: number;
  failedTests?: number;
  testDetails?: Array<{
    test: string;
    passed: boolean;
    actual?: any;
    expected?: any;
  }>;
  
  // 通用字段
  userOutput?: string;
  targetOutput?: string;
  executionError?: string;
}

// 提交结果响应（对应 POST /programming/submit-result 接口）
export interface ProgrammingSubmitResult {
  exerciseUuid: string;
  isCorrect: boolean;
  score: number;
  feedback: string;
  answerUuid: string;
  submittedAt: string;
}

// === 原有类型定义保持兼容 ===

// 练习题相关类型定义
export interface ExerciseQuestionData {
  type: string;
  title: string;
  question: string;
  options?: Array<{
    id: string;
    text: string;
  }>;
  correctAnswer?: string | boolean;
  blanks?: Array<{
    id: number;
    correctAnswer: string;
    placeholder: string;
  }>;
  explanation?: string;
  difficulty?: string;
  points?: number;
  language?: string;
  templateCode?: string;
  testCases?: Array<{
    input: string;
    expectedOutput: string;
  }>;
}


// API实际返回的数据格式（驼峰命名）
export interface ExerciseResultData {
  uuid: string;
  type: string;
  title: string;
  question: string;
  explanation?: string;
  options?: { [key: string]: string };
  answer?: string[];
  userAnswer?: string[];
  submitted: boolean;
  correct: boolean;
}


export interface ProgramExerciseResult {
  exerciseUuid: string;
  exerciseType: string;
  questionData: {
    type: string;
    score: number;
    title: string;
    initCode: string;
    judgeMode: string;
    difficulty: string;
    description: string;
    expectedOutput?: string;
    hints: string[];
  };
  status: {
    isCompleted: boolean;
    isCorrect: boolean;
    score: number;
  };
  answerData: {
    score: string;
    feedback: string;
    userCode: string;
    isCorrect: string;
    judgeResult: string;
  };
}


export interface ExerciseResult {
  isCorrect: boolean;
  score: number;
  feedback: string;
  answerUuid: string;
  correctAnswerInfo?: {
    type: string;
    correctAnswerId?: string;
    correctAnswerIds?: string[];
    correctAnswer?: boolean;
    options?: any;
    blanks?: any[];
  };
  exerciseUuid?: string;
  exerciseType?: string;
  questionData?: {
    title: string;
    question: string;
    score: number;
    explanation?: string;
    options?: { [key: string]: string };
    blanks?: Array<{ id: string; placeholder: string }>;
  };
  answerData?: {
    answer: any;
    correctAnswer: any;
    explanation: string;
    score: number;
  };
  status?: {
    isCompleted: boolean;
    isCorrect?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ExerciseStats {
  overall: {
    totalExercises: number;
    completedExercises: number;
    correctExercises: number;
    avgScore: number;
  };
  byType: Array<{
    exerciseType: string;
    totalExercises: number;
    completedExercises: number;
    correctExercises: number;
    avgScore: number;
  }>;
}

// 答案数据类型
export interface AnswerData {
  // 选择题答案
  selectedOption?: string;
  // 填空题答案
  answers?: { [key: string]: string };
  // 判断题答案
  answer?: boolean;
  // 编程题答案
  code?: string;
}

// === 新增：编程题专用API接口 ===

/**
 * 获取编程题基础信息
 * 对应接口规范：GET /exercise/result/<exercise_uuid>
 * 返回基础题目信息，不包含验证格式等高级内容
 */
export const getProgrammingExercise = async (
  exerciseUuid: string
): Promise<ProgrammingExerciseData> => {
  return request.get<ProgrammingExerciseData, ProgrammingExerciseData>(
    `/api/exercise/detail/${exerciseUuid}`
  );
};

/**
 * 预提交编程题
 * 对应接口规范：POST /exercise/preSubmit/<exercise_uuid>
 * 获取编程题的判题配置，供前端执行判题
 */
export const preSubmitProgrammingExercise = async (
  exerciseUuid: string,
  userCode: string
): Promise<ProgrammingJudgeConfig> => {
  return request.post<ProgrammingJudgeConfig, ProgrammingJudgeConfig>(
    `/api/exercise/preSubmit/${exerciseUuid}`,
    {
      userCode: userCode
    }
  );
};

/**
 * 提交编程题判题结果
 * 对应接口规范：POST /exercise/programming/submit-result
 * 接收前端判题结果并保存
 */
export const submitProgrammingJudgeResult = async (
  exerciseUuid: string,
  userCode: string,
  isCorrect: boolean,
  score: number,
  feedback: string,
  judgeResult: ProgrammingJudgeResult
): Promise<ProgrammingSubmitResult> => {
  return request.post<ProgrammingSubmitResult, ProgrammingSubmitResult>(
    '/api/exercise/programming/submit-result',
    {
      exerciseUuid: exerciseUuid,
      userCode: userCode,
      isCorrect: isCorrect,
      score: score,
      feedback: feedback,
      judgeResult: judgeResult
    }
  );
};

/**
 * 获取编程题提示
 * 对应接口规范：GET /exercise/hint/<exercise_uuid>
 * 只有完成练习题后才能查看提示
 */
export const getProgrammingExerciseHint = async (
  exerciseUuid: string
): Promise<{ hint: string }> => {
  return request.get<{ hint: string }, { hint: string }>(
    `/api/exercise/hint/${exerciseUuid}`
  );
};


// 编程题专用：提交前端判题结果
export const submitProgrammingResult = async (
  exerciseUuid: string,
  userCode: string,
  judgeResult: {
    isCorrect: boolean;
    score: number;
    feedback: string;
    userOutput?: string;
    targetOutput?: string;
    testOutput?: string;
    expectedOutput?: string;
    executionError?: string;
  }
): Promise<ExerciseResultData> => {
  return request.post('/api/exercise/programming/submit-result', {
    exerciseUuid: exerciseUuid,
    userCode: userCode,
    isCorrect: judgeResult.isCorrect,
    score: judgeResult.score,
    feedback: judgeResult.feedback,
    judgeResult: judgeResult
  });
}; 


/**
 * 提交传统题型练习题答案（单选、多选、填空、判断）
 * @param exerciseUuid 练习题UUID
 * @param answerData 答案数组，格式为 string[]
 * @returns Java后端返回的ExerciseDataVo格式
 */
export const submitExerciseAnswer = async (
  exerciseUuid: string,
  answerData: string[]
): Promise<ExerciseResultData> => {
  return request.post('/api/exercise/submit', {
    exerciseUuid: exerciseUuid,
    answerData: answerData
  });
};

/**
 * 获取练习题详情
 */
export const getExerciseResult = async (
  exerciseUuid: string
): Promise<ExerciseResultData> => {
  return request.get(`/api/exercise/detail/${exerciseUuid}`);
};
