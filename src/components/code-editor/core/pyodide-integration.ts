import { loadPyodide } from 'pyodide';

// Pyodide实例类型
type PyodideInstance = any;

// Pyodide执行结果
export interface PyodideResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * 加载Pyodide并初始化
 * @param onOutput 输出回调函数
 * @param onLoading 加载状态回调函数
 * @returns Pyodide实例
 */
export const initPyodide = async (
  onOutput: (text: string) => void,
  onLoading: (loading: boolean) => void
): Promise<PyodideInstance | null> => {
  try {
    onLoading(true);
    onOutput('# 正在加载 Python 运行环境...\n# 首次加载可能需要一些时间，请耐心等待。');
    
    // 加载 Pyodide
    const pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.4/full/",
      stdout: (text) => {
        onOutput(prev => prev + text);
      },
      stderr: (text) => {
        onOutput(prev => prev + `\n# 错误: ${text}`);
      }
    });
    
    // 初始化 sys 模块来捕获标准输出
    await pyodide.runPythonAsync(`
      import sys
      import io
      
      class PyodideOutput:
          def __init__(self):
              self.stdout = io.StringIO()
              self.stderr = io.StringIO()
              self.output = ""
              
          def write_stdout(self, text):
              self.stdout.write(text)
              self.output += text
              
          def write_stderr(self, text):
              self.stderr.write(text)
              self.output += f"\\n# 错误: {text}"
              
          def get_output(self):
              return self.output
              
      pyodide_output = PyodideOutput()
      
      class StdoutCatcher:
          def write(self, text):
              pyodide_output.write_stdout(text)
              return len(text)
          def flush(self):
              pass
          
      class StderrCatcher:
          def write(self, text):
              pyodide_output.write_stderr(text)
              return len(text)
          def flush(self):
              pass
              
      # 重定向标准输出和错误
      sys.stdout = StdoutCatcher()
      sys.stderr = StderrCatcher()
    `);
    
    onOutput('# Python环境已准备就绪！');
    onLoading(false);
    return pyodide;
  } catch (error) {
    onOutput(`# 加载 Python 环境时出错: ${error instanceof Error ? error.message : String(error)}`);
    onLoading(false);
    return null;
  }
};

/**
 * 执行Python代码
 * @param pyodide Pyodide实例
 * @param code Python代码
 * @returns 执行结果
 */
export const runPythonCode = async (
  pyodide: PyodideInstance,
  code: string
): Promise<PyodideResult> => {
  if (!pyodide) {
    return {
      success: false,
      output: '# Python环境未准备就绪，无法执行代码',
      error: 'Pyodide未初始化'
    };
  }
  
  try {
    // 重置输出缓冲区
    await pyodide.runPythonAsync(`
      pyodide_output.stdout = io.StringIO()
      pyodide_output.stderr = io.StringIO()
      pyodide_output.output = ""
    `);
    
    // 执行用户代码
    await pyodide.runPythonAsync(code);
    
    // 获取输出
    const output = await pyodide.runPythonAsync(`pyodide_output.get_output()`);
    
    return {
      success: true,
      output: output || '# 代码执行完成，没有输出'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      output: `# 代码执行出错:\n${errorMessage}`,
      error: errorMessage
    };
  }
};

/**
 * 比较代码输出与预期输出
 * @param actualOutput 实际输出
 * @param expectedOutput 预期输出
 * @returns 是否匹配
 */
export const compareOutputs = (actualOutput: string, expectedOutput?: string): boolean => {
  if (!expectedOutput) return true;
  
  // 格式化输出以便比较
  // 1. 移除多余空白字符
  // 2. 忽略大小写
  // 3. 统一换行符
  const formatOutput = (output: string) => {
    return output
      .trim()
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ');
  };
  
  const formattedActual = formatOutput(actualOutput);
  const formattedExpected = formatOutput(expectedOutput);
  
  return formattedActual.includes(formattedExpected);
}; 