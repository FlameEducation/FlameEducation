import { ChatMessage } from '@/types/ChatMessage';

export interface ExtendedChatMessage extends ChatMessage {
  audioUrl?: string;
  messageId?: string;
  audioType?: 'url' | 'stream';
  responseUUID?: string;
  createdAt: string;
  audioData?: string[];  // 存储音频数据块的 base64 字符串数组
  blackboardUuid?: string;
  mindMapUuid?: string;
  imageUrl?: string; // 图片URL字段
  imageUuid?: string; // 图片UUID字段，用于查询图片生成状态
  status?: 'placeholder' | 'rendered' | 'error'; // 消息状态
  blockNum?: number; // 添加blockNum字段用于文本和音频同步
  
  // 练习题相关字段
  exerciseData?: ExerciseData;
}

// 添加流式文本块类型
export interface TextBlock {
  content: string;
  blockNum: number;
}

// 添加流式音频块类型
export interface AudioBlock {
  audio: string;
  blockNum: number;
}

// 扩展学习模式，添加新的练习类型
export type LearningMode = 'follow' | 'fill' | 'fix' | 'free';
export type ExerciseType = 'multiple-choice' | 'fill-blank' | 'true-false' | 'programming';

// 选择题选项
export interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

// 填空题空白
export interface FillBlankItem {
  id: string;
  placeholder: string;
  correctAnswer: string;
  position: number; // 在题目中的位置
}

// 通用练习数据接口
export interface BaseExerciseData {
  id: string;
  title: string;
  type: ExerciseType;
  description: string;
  hints?: string[];
  isCompleted: boolean;
  userAnswer?: any;
  isCorrect?: boolean;
}

// 选择题数据
export interface MultipleChoiceExercise extends BaseExerciseData {
  type: 'multiple-choice';
  question: string;
  options: MultipleChoiceOption[];
  correctAnswerIds: string[];
  userSelectedIds?: string[];
}

// 填空题数据
export interface FillBlankExercise extends BaseExerciseData {
  type: 'fill-blank';
  question: string;
  blanks: FillBlankItem[];
  userAnswers?: { [blankId: string]: string };
}

// 判断题数据
export interface TrueFalseExercise extends BaseExerciseData {
  type: 'true-false';
  question: string;
  correctAnswer: boolean;
  userAnswer?: boolean;
}

// 编程题数据（保持原有结构）
export interface ProgrammingExercise extends BaseExerciseData {
  type: 'programming';
  mode: LearningMode;
  initialCode?: string;
  placeholderCode?: string;
  codeSections?: CodeSection[];
  expectedOutput: string;
  userCode?: string;
}

// 联合类型
export type ExerciseData = MultipleChoiceExercise | FillBlankExercise | TrueFalseExercise | ProgrammingExercise;

export interface CodeSection {
  type: 'fix' | 'blank';
  code?: string;
  target?: string;
}

export interface HistoryMessage {
  id: number;
  uuid: string;
  sessionId: string;
  role: 'user' | 'assistant';
  contentType: string;
  displayAiResponse: string | null;
  audioUrl: string;
  useBlackboard: boolean;
  blackboardUuid: string;
  createdAt: string;
  imageUrl?: string; // 图片URL字段
  imageUuid?: string; // 图片UUID字段，用于查询图片生成状态
}

export interface ChatSettings {
  requireConfirmation: boolean;
  needTts: boolean;
  theme: string;
  fontSize: number;
  messageSpacing: number;
}

export const DEFAULT_SETTINGS: ChatSettings = {
  requireConfirmation: false,
  needTts: false,
  theme: 'light',
  fontSize: 16,
  messageSpacing: 16
};

// 添加编辑器设置类型
export interface EditorSettings {
  fontSize: number;
  theme: 'vs-dark' | 'vs-light';
  tabSize: number;
  minimap: boolean;
  wordWrap: 'on' | 'off';
  lineNumbers: 'on' | 'off';
}

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  fontSize: 14,
  theme: 'vs-dark',
  tabSize: 4,
  minimap: false,
  wordWrap: 'on',
  lineNumbers: 'on',
}; 