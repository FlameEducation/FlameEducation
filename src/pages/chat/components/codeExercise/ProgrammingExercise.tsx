import React, {useState, useRef, useCallback, useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {PythonEnvContextProvider} from '@/pages/chat/context/PythonEnvContext';
import {
  Play,
  RotateCcw,
  Code2,
  Send,
  Lightbulb,
  CheckCircle,
  XCircle,
  Loader2,
  TestTube2,
  FileText,
  Settings
} from 'lucide-react';
import {toast} from 'sonner';
import PythonLearningEditor from '@/components/code-editor/PythonLearningEditor';
import {LearningMode} from '@/components/code-editor/learning-modes/types';
import {EditorSettings} from '@/pages/chat/types';
import {EditorSettingsDialog} from './EditorSettingsDialog';
import {usePythonEnvContext} from '@/pages/chat/context/PythonEnvContext';
import {PythonCodeRunResult} from '@/types/PythonCodeRunResult';

import {
  ProgramExerciseResult,
  preSubmitProgrammingExercise,
  submitProgrammingJudgeResult,
  getProgrammingExerciseHint,
  ProgrammingJudgeConfig
} from '@/api/exercise';


interface ProgrammingExerciseProps {
  exerciseData: ProgramExerciseResult;
  onSubmitComplete?: (result: any) => void;
}

// 默认编辑器设置
const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  fontSize: 14,
  theme: 'vs-dark',
  tabSize: 4,
  minimap: false,
  wordWrap: 'on',
  lineNumbers: 'on'
};


// {
//   "exerciseUuid": "7085f4a2-8162-476a-8469-35858ce30a05",
//   "exerciseType": "programming",
//   "questionData": {
//     "type": "跟写",
//     "score": 2,
//     "title": "Hello World入门",
//     "initCode": "print(\"Hello, World!\") # 请在这里跟写代码",
//     "judgeMode": "output",
//     "difficulty": "基础",
//     "description": "请编写一个程序，在控制台打印出 \"Hello, World!\"。",
//     "expectedOutput": "Hello, World!"
//   },
//   "status": {
//     "isCompleted": true,
//     "isCorrect": true,
//     "score": 2
//   },
//   "answerData": {
//     "score": "2",
//     "feedback": "恭喜！代码输出正确。",
//     "userCode": "print(\"Hello, World!\")",
//     "isCorrect": "true",
//     "judgeResult": "{\"isCorrect\":true,\"score\":2,\"feedback\":\"恭喜！代码输出正确。\",\"userOutput\":\"Hello, World!\\n\",\"targetOutput\":\"Hello, World!\"}"
//   }
// }

// 本地存储键前缀
const LOCAL_STORAGE_PREFIX = 'programming_exercise_code_';
const EDITOR_SETTINGS_KEY = 'programming_editor_settings';

const ProgrammingExerciseMain: React.FC<ProgrammingExerciseProps> = ({
                                                                          exerciseData,
                                                                          onSubmitComplete
                                                                        }) => {

  const editorRef = useRef<{ toggleHints: () => void; runCode: () => Promise<void> }>(null);
  const {exerciseUuid, questionData, status, answerData} = exerciseData;
  const {runCode, envInitComplete} = usePythonEnvContext();

  // 保存编辑器设置
  const handleEditorSettingsChange = (newSettings: EditorSettings) => {
    setEditorSettings(newSettings);
    localStorage.setItem(EDITOR_SETTINGS_KEY, JSON.stringify(newSettings));
  };

  // 获取本地存储的代码
  const getLocalStorageCode = useCallback(() => {
    if (status.isCorrect && status.isCorrect) {
      return answerData.userCode;
    }

    if (!status.isCorrect) {
      // 未完成或答案错误的题目尝试从本地存储获取
      const storageKey = `${LOCAL_STORAGE_PREFIX}${exerciseUuid}`;
      const savedCode = localStorage.getItem(storageKey);
      return savedCode
    }

  }, [exerciseUuid]);


  // 获取编辑器设置
  const getEditorSettings = (): EditorSettings => {
    const savedSettings = localStorage.getItem(EDITOR_SETTINGS_KEY);
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (e) {
        console.error('解析编辑器设置失败:', e);
      }
    }
    return DEFAULT_EDITOR_SETTINGS;
  };

  // 状态管理
  const [currentCode, setCurrentCode] = useState<string>(getLocalStorageCode() || '');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [judgeConfig, setJudgeConfig] = useState<ProgrammingJudgeConfig | null>(null);
  const [judgeMode, setJudgeMode] = useState<string>(questionData.judgeMode || 'output');
  const [showSettings, setShowSettings] = useState(false);
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(getEditorSettings());

  // 保存代码到本地存储
  useEffect(() => {
    if (!status.isCorrect && currentCode !== questionData.initCode) {
      const storageKey = `${LOCAL_STORAGE_PREFIX}${exerciseUuid}`;
      localStorage.setItem(storageKey, currentCode);
    }
  }, [currentCode, exerciseUuid, questionData.initCode, status.isCorrect]);


  // 当练习数据变化时重置状态
  useEffect(() => {
    const newCode = getLocalStorageCode();
    setCurrentCode(newCode);
    setJudgeConfig(null);
    // 使用questionData中的judgeMode或根据类型推断
    if (questionData.judgeMode) {
      setJudgeMode(questionData.judgeMode);
    } else if (questionData.type === '跟写') {
      setJudgeMode('follow');
    } else if (questionData.type === '填空') {
      setJudgeMode('fill');
    } else {
      setJudgeMode('output');
    }
  }, [exerciseUuid, getLocalStorageCode, questionData.judgeMode, questionData.type]);


  // 获取判题配置
  const fetchJudgeConfig = async (userCode: string) => {
    try {
      const config = await preSubmitProgrammingExercise(exerciseUuid, userCode);
      setJudgeConfig(config);
      setJudgeMode(config.judgeMode);
      return config;
    } catch (error) {
      console.error('获取判题配置失败:', error);
      return null;
    }
  };

  // 判题逻辑
  const judgeAnswer = async (userCode: string, config: ProgrammingJudgeConfig) => {

    let codeToExecute = userCode;
    // 对于unittest模式，需要将用户代码和测试代码合并
    if (config.judgeMode === 'unittest') {
      let runCode = ""
      if (config.setupCode) {
        runCode += config.setupCode + '\n\n';
      }
      runCode += userCode + '\n\n';
      if (config.referenceSolution) {
        runCode += config.referenceSolution + '\n\n';
      }
      if (config.unitTestCode) {
        runCode += config.unitTestCode + '\n\n';
      }
      codeToExecute = runCode;
    }

    const result: PythonCodeRunResult = await runCode(codeToExecute);

    if (!result.isSuccess) {
      return {
        isCorrect: false,
        score: 0,
        feedback: result.output || result.friendlyMessage,
        userOutput: result.output,
        executionError: result.errorMessage
      };
    }

    // 根据判题模式进行评判
    if (config.judgeMode === 'output') {
      const targetOutput = config.expectedOutput || config.expectedOutput || '';
      const isCorrect = result.output.trim() === targetOutput.trim();

      return {
        isCorrect,
        score: isCorrect ? questionData.score : 0,
        feedback: isCorrect
          ? '恭喜！代码输出正确。'
          : `输出不匹配。\n期望输出: "${targetOutput}"\n实际输出: "${result.output}"`,
        userOutput: result.output,
        targetOutput: targetOutput
      };
    } else if (config.judgeMode === 'unittest') {

      const hasSuccess = result.output.includes('所有测试') && result.output.includes('通过') ||
        result.output.includes('All tests passed') ||
        result.output.includes('测试通过') ||
        result.output.includes('OK') ||
        result.output.includes('passed') ||
        result.output.includes('PASSED');

      const isCorrect = hasSuccess;

      return {
        isCorrect,
        score: isCorrect ? questionData.score : 0,
        feedback: isCorrect
          ? '测试通过！代码实现正确。'
          : `测试失败:\n${result.output}`,
        testOutput: result.output
      };
    }

    return {
      isCorrect: false,
      score: 0,
      feedback: '未知的判题模式',
      userOutput: result.output
    };
  };

  // 提交答案
  const handleSubmit = useCallback(async () => {
    if (!currentCode.trim()) {
      toast.error('请先编写代码');
      return;
    }

    setIsSubmitting(true);

    try {
      // 获取判题配置
      const config = await fetchJudgeConfig(currentCode);
      if (!config) {
        setIsSubmitting(false);
        return;
      }

      // 前端执行判题
      const judgeResult = await judgeAnswer(currentCode, config);

      // 提交到后端
      const submitResult = await submitProgrammingJudgeResult(
        exerciseUuid,
        currentCode,
        judgeResult.isCorrect,
        judgeResult.score,
        judgeResult.feedback,
        judgeResult
      );

      // 通知父组件
      if (onSubmitComplete) {
        onSubmitComplete({
          exerciseUuid,
          isCorrect: judgeResult.isCorrect,
          score: judgeResult.score,
          feedback: judgeResult.feedback,
          submittedAt: submitResult.submittedAt,
          judgeResult: judgeResult
        });
      }

    } catch (error) {
      console.error('提交失败:', error);
      toast.error('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentCode, exerciseUuid, fetchJudgeConfig, judgeAnswer, onSubmitComplete]);

  // 显示提示
  const handleShowHint = useCallback(async () => {
    try {
      // 优先显示基础提示
      if (questionData.hints && questionData.hints.length > 0) {
        // 使用编辑器内置的提示功能
        if (editorRef.current) {
          editorRef.current.toggleHints();
        }
        return;
      }
    } catch (error) {
      console.error('获取提示失败:', error);
      toast.error('获取提示失败');
    }
  }, [exerciseUuid, questionData.hints, status?.isCorrect]);

  // 重置代码
  const handleResetCode = useCallback(() => {
    console.log("手动重置代码");
    setCurrentCode(questionData.initCode || '');
    // 清除本地存储
    const storageKey = `${LOCAL_STORAGE_PREFIX}${exerciseUuid}`;
    localStorage.removeItem(storageKey);
    toast.info('代码已重置');
  }, [questionData.initCode, status.isCorrect, exerciseUuid]);

  // 处理代码运行结果
  const handleCodeRun = useCallback((code: string, output: string, isSuccess: boolean) => {
    console.log("处理代码运行结果而重置代码");
    setCurrentCode(code);
  }, []);

  // 处理代码变化
  const handleCodeChange = useCallback((code: string) => {
    if (!isReadOnly) {
      setCurrentCode(code);
    }
  }, [status.isCorrect]);

  // 获取判题模式的显示信息
  const getJudgeModeInfo = () => {
    // 优先显示原始类型
    if (questionData.type === '跟写') {
      return {
        icon: <FileText className="h-4 w-4"/>,
        label: '跟写模式',
        description: '按照模板输入代码',
        color: 'bg-orange-500'
      };
    } else if (questionData.type === '填空') {
      return {
        icon: <Code2 className="h-4 w-4"/>,
        label: '填空模式',
        description: '补全代码空白部分',
        color: 'bg-teal-500'
      };
    } else if (questionData.type === '自由') {
      // 根据判题配置显示具体模式
      if (judgeConfig?.judgeMode === 'unittest' || judgeMode === 'unittest') {
        return {
          icon: <TestTube2 className="h-4 w-4"/>,
          label: '自由编程（单元测试）',
          description: '完全独立编写，单元测试验证',
          color: 'bg-green-500'
        };
      } else {
        return {
          icon: <FileText className="h-4 w-4"/>,
          label: '自由编程（输出校验）',
          description: '完全独立编写，输出校验',
          color: 'bg-blue-500'
        };
      }
    }

    // 默认
    return {
      icon: <Code2 className="h-4 w-4"/>,
      label: '编程练习',
      description: '编写代码解决问题',
      color: 'bg-gray-500'
    };
  };

  const judgeModeInfo = getJudgeModeInfo();
  const isCorrect = status.isCorrect;
  const isReadOnly = status.isCorrect && isSubmitting;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 题目头部 */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-500 text-white border-0">
              <Code2 className="h-4 w-4 mr-1"/>
              编程题
            </Badge>
            <Badge variant="outline" className={`${judgeModeInfo.color} text-white border-0`}>
              {judgeModeInfo.icon}
              <span className="ml-1">{judgeModeInfo.label}</span>
            </Badge>
            {status.isCorrect && (
              <Badge variant={isCorrect ? "default" : "secondary"}>
                {isCorrect ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1"/>
                    已完成
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1"/>
                    需改进
                  </>
                )}
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-600">分值: {questionData.score}分</div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">{questionData.title}</h3>
          {questionData.description && (
            <p className="text-sm text-gray-700 leading-relaxed">{questionData.description}</p>
          )}
        </div>
      </div>

      {/* 主要内容区域 - 代码编辑器 */}
      <div className="flex-1 overflow-hidden">
        {judgeMode === 'follow' || questionData.type === '跟写' ? (
          <PythonLearningEditor
            key={`${exerciseUuid}-follow`}
            ref={editorRef}
            mode={'follow' as LearningMode}
            initialCode={currentCode}
            placeholderCode={questionData.initCode}
            codeSections={[]}
            expectedOutput=""
            hints={questionData.hints}
            containerClassName="h-full"
            editorSettings={{
              ...editorSettings,
              readOnly: isReadOnly
            } as any}
            onRunCode={handleCodeRun}
            onCodeChange={handleCodeChange}
          />
        ) : judgeMode === 'fill' && questionData?.codeSections ? (
          <PythonLearningEditor
            key={`${exerciseUuid}-fill`}
            ref={editorRef}
            mode={'fill' as LearningMode}
            initialCode=""
            placeholderCode=""
            codeSections={questionData.codeSections}
            expectedOutput={questionData.expectedOutput || ''}
            hints={questionData.hints}
            containerClassName="h-full"
            editorSettings={{
              ...editorSettings,
              readOnly: isReadOnly
            } as any}
            onRunCode={handleCodeRun}
            onCodeChange={handleCodeChange}
          />
        ) : (
          // 默认使用自由模式
          <PythonLearningEditor
            key={`${exerciseUuid}-programming`}
            ref={editorRef}
            mode={'free' as LearningMode}
            initialCode={currentCode}
            placeholderCode=""
            codeSections={[]}
            expectedOutput=""
            hints={questionData.hints}
            containerClassName="h-full"
            editorSettings={{
              ...editorSettings,
              readOnly: isReadOnly
            } as any}
            onRunCode={handleCodeRun}
            onCodeChange={handleCodeChange}
          />
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="border-t p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetCode}
              disabled={isSubmitting || status?.isCorrect}
            >
              <RotateCcw className="h-4 w-4 mr-1"/>
              重置
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShowHint}
              disabled={isSubmitting}
            >
              <Lightbulb className="h-4 w-4 mr-1"/>
              提示
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4 mr-1"/>
              设置
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Python环境状态 */}
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <div className={`w-2 h-2 rounded-full ${envInitComplete ? 'bg-green-500' : 'bg-yellow-500'}`}/>
              <span>Python: {envInitComplete ? '就绪' : '准备中'}</span>
            </div>

            {status.isCorrect && isCorrect ? (
              <Badge variant="default" className="px-3 py-1">
                <>
                  <CheckCircle className="h-3 w-3 mr-1"/> 
                  已完成 ({questionData?.score || status?.score || 0}分)
                </>
              </Badge>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !currentCode?.trim()}
                size="sm"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin"/>
                ) : (
                  <Send className="h-4 w-4 mr-1"/>
                )}
                提交答案
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 编辑器设置对话框 */}
      <EditorSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        settings={editorSettings}
        onSettingsChange={handleEditorSettingsChange}
      />
    </div>
  );
}; 


export const ProgrammingExercise: React.FC<ProgrammingExerciseProps> = ({
  exerciseData,
  onSubmitComplete
}) => {
  return (
    <PythonEnvContextProvider>
      <ProgrammingExerciseMain exerciseData={exerciseData} onSubmitComplete={onSubmitComplete} />
    </PythonEnvContextProvider>
  );
};