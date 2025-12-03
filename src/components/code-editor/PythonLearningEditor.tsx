import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Editor, { Monaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { loadPyodide } from 'pyodide';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EditorSettings } from '@/pages/chat/types';

// 导入模式管理器和类型
import { 
  LearningMode, 
  FillArea,
  CodeSection, 
  createModeManager
} from './learning-modes';

// 组件属性
interface PythonLearningEditorProps {
  mode: LearningMode;
  initialCode: string;
  placeholderCode?: string;
  fillAreas?: FillArea[];
  fillAreasHints?: string[];
  codeSections?: CodeSection[];
  readOnlyLines?: number[];
  expectedOutput?: string;
  hints?: string[];
  className?: string;
  containerClassName?: string;
  onRunCode?: (code: string, output: string, isSuccess: boolean) => void;
  onCodeChange?: (code: string) => void;
  editorSettings: EditorSettings;
}

// {
//       "type": "跟写",
//       "score": 2,
//       "title": "Hello World入门",
//       "initCode": "print(\"Hello, World!\") # 请在这里跟写代码",
//       "judgeMode": "output",
//       "difficulty": "基础",
//       "description": "请编写一个程序，在控制台打印出 \"Hello, World!\"。",
//       "expectedOutput": "Hello, World!"
//     },
//     "status": {
//       "isCompleted": true,
//       "isCorrect": true,
//       "score": 2
//     },
//     "answerData": {
//       "score": "2",
//       "feedback": "恭喜！代码输出正确。",
//       "userCode": "print(\"Hello, World!\")",
//       "isCorrect": "true",
//       "judgeResult": "{\"isCorrect\":true,\"score\":2,\"feedback\":\"恭喜！代码输出正确。\",\"userOutput\":\"Hello, World!\\n\",\"targetOutput\":\"Hello, World!\"}"
//     }
//   }

// 精简后的编辑器组件
export const PythonLearningEditor = React.forwardRef<
  { toggleHints: () => void; runCode: () => Promise<void> },
  PythonLearningEditorProps
>(({
  mode,
  initialCode,
  placeholderCode,
  fillAreas = [],
  fillAreasHints = [],
  codeSections = [],
  readOnlyLines = [],
  expectedOutput,
  hints = [],
  className,
  containerClassName,
  onRunCode,
  onCodeChange,
  editorSettings,
}, ref) => {
  const [code, setCode] = useState(initialCode);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [showHints, setShowHints] = useState(false);
  
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const pyodideRef = useRef<any>(null);
  const modeManagerRef = useRef<any>(null);

  // 处理Editor挂载
  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsEditorReady(true);

    try {
      // 创建并初始化模式管理器
      const tempSetOutput = (output: string) => {}; // 空函数，因为我们不再显示输出
      
      const modeManager = createModeManager(mode, {
        editor,
        monaco,
        initialCode,
        setOutput: tempSetOutput,
        placeholderCode,
        fillAreas,
        fillAreasHints,
        codeSections,
        readOnlyLines,
        expectedOutput,
        hints
      });
      
      modeManagerRef.current = modeManager;
      modeManager.initialize();
    } catch (error) {
      console.error('初始化模式管理器失败:', error);
    }
  };

  // 运行代码 - 参考 PythonEditor.tsx 的实现
  const runCode = async () => {
    if (!editorRef.current || !onRunCode) return;
    
    const currentCode = editorRef.current.getValue();
    
    try {
      if (!pyth) {
        onRunCode(currentCode, '# Python 运行环境尚未准备好，请稍后再试...', false);
        return;
      }
      
      // 运行前先清空输出
      await pyodideRef.current.runPythonAsync(`pyodide_output.output = ""`);
      
      try {
        // 运行代码并捕获输出
        await pyodideRef.current.runPythonAsync(currentCode);
        const result = await pyodideRef.current.runPythonAsync(`pyodide_output.get_output()`);
        
        // 如果没有输出则显示提示
        let output = result;
        if (!result || result.trim() === "") {
          output = "# 代码执行成功，但没有输出。\n# 如果你想要看到输出，请确保使用 print() 函数。";
        }
        
        // 验证输出是否符合预期
        let isSuccess = true;
        if (expectedOutput && modeManagerRef.current) {
          isSuccess = modeManagerRef.current.validate(currentCode, output);
          if (isSuccess) {
            output += "\n\n# 恭喜！你的代码输出正确。";
          } else {
            output += "\n\n# 你的代码输出与预期不符，请继续尝试。";
          }
        }
        
        // 通过回调传递结果
        onRunCode(currentCode, output, isSuccess);
      } catch (pythonError) {
        // 捕获Python代码执行时的错误
        console.error('Python代码执行错误:', pythonError);
        
        // 提取和格式化Python错误信息
        let errorMessage = String(pythonError);
        
        // 检查是否有更详细的Python错误信息
        if (pythonError instanceof Error && 'message' in pythonError) {
          errorMessage = pythonError.message;
        }
        
        // 处理常见的Python错误类型，提供更友好的错误信息
        let formattedError = '';
        
        if (errorMessage.includes('NameError')) {
          const variableName = errorMessage.match(/name '(.+)' is not defined/)?.[1] || '';
          formattedError = `# 错误: NameError (变量未定义)\n变量 '${variableName}' 未定义。请确保在使用变量前先定义它。\n\n原始错误: ${errorMessage}`;
        } else if (errorMessage.includes('SyntaxError')) {
          formattedError = `# 错误: SyntaxError (语法错误)\n你的代码有语法错误，请检查代码格式是否正确。\n\n原始错误: ${errorMessage}`;
        } else if (errorMessage.includes('TypeError')) {
          formattedError = `# 错误: TypeError (类型错误)\n操作或函数应用于不适当类型的对象。\n\n原始错误: ${errorMessage}`;
        } else if (errorMessage.includes('IndexError')) {
          formattedError = `# 错误: IndexError (索引错误)\n尝试访问序列中不存在的索引。\n\n原始错误: ${errorMessage}`;
        } else if (errorMessage.includes('KeyError')) {
          formattedError = `# 错误: KeyError (键错误)\n尝试访问字典中不存在的键。\n\n原始错误: ${errorMessage}`;
        } else if (errorMessage.includes('ImportError') || errorMessage.includes('ModuleNotFoundError')) {
          formattedError = `# 错误: ImportError (导入错误)\n无法导入指定的模块。请注意，浏览器环境可能不支持某些Python模块。\n\n原始错误: ${errorMessage}`;
        } else if (errorMessage.includes('ZeroDivisionError')) {
          formattedError = `# 错误: ZeroDivisionError (除零错误)\n尝试除以零。\n\n原始错误: ${errorMessage}`;
        } else if (errorMessage.includes('ValueError')) {
          formattedError = `# 错误: ValueError (值错误)\n传递了一个不合适的值。\n\n原始错误: ${errorMessage}`;
        } else if (errorMessage.includes('AttributeError')) {
          formattedError = `# 错误: AttributeError (属性错误)\n尝试访问对象不存在的属性或方法。\n\n原始错误: ${errorMessage}`;
        } else {
          // 其他未明确处理的错误类型
          formattedError = `# 错误: \n${errorMessage}`;
        }
        
        // 通过回调传递错误结果
        onRunCode(currentCode, formattedError, false);
      }
    } catch (error) {
      onRunCode(
        currentCode, 
        `# 错误: \n${error instanceof Error ? error.message : String(error)}`,
        false
      );
    }
  };

  // 暴露方法给父组件
  React.useImperativeHandle(ref, () => ({
    toggleHints: () => setShowHints(prev => !prev),
    runCode: () => runCode()
  }));

  return (
    <div className={cn("w-full h-full flex flex-col", containerClassName)}>
      {/* 仅保留代码编辑器部分 */}
      <div className="flex-1 overflow-hidden relative">
        <Editor
          height="100%"
          defaultLanguage="python"
          defaultValue={initialCode}
          theme={editorSettings.theme}
          options={{
            automaticLayout: true,
            scrollBeyondLastLine: false,
            minimap: { enabled: editorSettings.minimap },
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
            },
            fontSize: editorSettings.fontSize,
            fontFamily: "'Fira Code', 'Menlo', 'Monaco', 'Courier New', monospace",
            lineNumbers: editorSettings.lineNumbers,
            guides: { indentation: true },
            tabSize: editorSettings.tabSize,
            insertSpaces: true,
            detectIndentation: true,
            wordWrap: editorSettings.wordWrap,
            padding: { top: 10 },
            readOnly: (editorSettings as any).readOnly || false
          }}
          onMount={handleEditorDidMount}
          onChange={(value) => {
            const newCode = value || '';
            setCode(newCode);
            // 实时通知父组件代码变化
            onCodeChange?.(newCode);
          }}
          className={className}
        />
        
        {/* 使用Sheet组件替代原来的提示面板 */}
        <Sheet open={showHints} onOpenChange={setShowHints}>
          <SheetContent side="right" className="w-[400px]">
            <SheetHeader>
              <SheetTitle>练习提示</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              {hints.map((hint, idx) => (
                <div key={idx} className="bg-muted rounded-lg p-4">
                  <div className="text-sm font-medium mb-1">提示 {idx + 1}</div>
                  <div className="text-sm text-muted-foreground">{hint}</div>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
});

PythonLearningEditor.displayName = 'PythonLearningEditor';

export default PythonLearningEditor;
export { type LearningMode, type FillArea };