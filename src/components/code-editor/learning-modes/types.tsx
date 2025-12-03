import * as monaco from 'monaco-editor';
import { Monaco } from '@monaco-editor/react';
import { ReactNode } from 'react';
import { PenTool, Edit, Code2, Edit3 } from 'lucide-react';

// 教学模式类型
export type LearningMode = 'follow' | 'fill' | 'free' | 'fix';

// 学习模式配置
export interface LearningModeConfig {
  icon: ReactNode;
  title: string;
  description: string;
  color: string;
}

// 填空模式区域标记
export interface FillArea {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

// 代码段类型
export type CodeSectionType = 'fix' | 'blank';

// JSON格式的代码段定义
export interface CodeSection {
  type: CodeSectionType;  // 区域类型：fix(固定代码) 或 blank(填空区)
  code?: string;          // 固定代码内容，type='fix'时使用
  target?: string;        // 填空区描述，type='blank'时使用
}

// 模式管理器接口 - 所有模式管理器必须实现的基本功能
export interface ModeManager {
  // 初始化管理器
  initialize: () => void;
  
  // 清理资源
  dispose: () => void;
  
  // 运行特定模式的验证逻辑，返回是否成功
  validate?: (code: string, expectedOutput?: string) => boolean;
}

// 模式管理器工厂函数参数
export interface ModeManagerOptions {
  editor: monaco.editor.IStandaloneCodeEditor;
  monaco: Monaco;
  initialCode: string;
  setOutput: (output: string) => void;
  
  // 模式特定可选参数
  placeholderCode?: string; // 跟写模式的模板代码
  fillAreas?: FillArea[]; // 填空模式的可编辑区域
  fillAreasHints?: string[]; // 填空区域的提示信息
  codeSections?: CodeSection[]; // JSON格式的代码区域定义
  readOnlyLines?: number[]; // 只读行号
  expectedOutput?: string; // 预期输出，用于验证
  hints?: string[]; // 提示信息
}

// 定义各种学习模式的配置
export const learningModeConfigs: Record<LearningMode, LearningModeConfig> = {
  follow: {
    icon: <PenTool className="h-5 w-5" />,
    title: '跟写模式',
    description: '按照模板跟着写代码，类似字帖临摹',
    color: 'bg-blue-500 text-white'
  },
  fill: {
    icon: <Edit className="h-5 w-5" />,
    title: '填空模式',
    description: '填写代码中的空白部分',
    color: 'bg-green-500 text-white'
  },
  free: {
    icon: <Code2 className="h-5 w-5" />,
    title: '自由模式',
    description: '完全自由编写代码，根据要求实现功能',
    color: 'bg-purple-500 text-white'
  },
  fix: {
    icon: <Edit3 className="h-5 w-5" />,
    title: '修改模式',
    description: '找出并修复代码中的错误',
    color: 'bg-amber-500 text-white'
  }
}; 