import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { loadPyodide } from 'pyodide';
import {PythonCodeRunResult} from '@/types/PythonCodeRunResult';
// 定义 Props 接口
interface PythonEnvContextProviderProps {
  children: ReactNode;
}

// 创建python环境上下文
const PythonEnvContext = createContext<{
  envInitComplete: boolean;
  runCode: (code: string) => Promise<PythonCodeRunResult>;
}>({
  envInitComplete: false,
  runCode: async () => ({
    runCode: '',
    output: '',
    isSuccess: false,
    errorType: '',
    errorLine: 0,
    errorMessage: '',
    friendlyMessage: '',
  })
});

// 使用python环境的自定义Hook
export const usePythonEnvContext = () => useContext(PythonEnvContext);

// 错误类型映射
const ERROR_TYPE_MAP: { [key: string]: string } = {
  'NameError': '变量名错误：使用了未定义的变量',
  'SyntaxError': '语法错误：代码语法不正确',
  'TypeError': '类型错误：操作或函数应用于不当类型的对象',
  'IndexError': '索引错误：序列下标超出范围',
  'KeyError': '键错误：字典中不存在指定的键',
  'ZeroDivisionError': '除零错误：不能除以零',
  'ValueError': '值错误：操作或函数接收到不当的值',
  'AttributeError': '属性错误：对象没有指定的属性或方法',
  'ImportError': '导入错误：无法导入模块或从模块中导入名称',
  'ModuleNotFoundError': '模块未找到：指定的模块不存在',
  'IndentationError': '缩进错误：代码缩进不正确',
  'FileNotFoundError': '文件未找到：指定的文件不存在',
  'RecursionError': '递归错误：超过最大递归深度',
  'OverflowError': '溢出错误：数值运算结果太大'
};

// 解析错误信息的函数
const parseErrorInfo = (errorMessage: string) => {
  let errorType = '未知错误';
  let errorLine = 0;
  let friendlyMessage = '代码执行出现错误';

  console.log('开始解析错误信息:', errorMessage);

  if (!errorMessage) {
    console.log('错误信息为空');
    return { errorType, errorLine, friendlyMessage };
  }

  try {
    // 解析错误类型 - 通常在最后一行
    const lines = errorMessage.trim().split('\n');
    const lastLine = lines[lines.length - 1];
    
    console.log('错误信息最后一行:', lastLine);
    
    // 匹配错误类型，格式如: "ZeroDivisionError: division by zero"
    const errorTypeMatch = lastLine.match(/^([A-Za-z]+Error|[A-Za-z]+Exception):/);
    if (errorTypeMatch) {
      errorType = errorTypeMatch[1];
      console.log('识别的错误类型:', errorType);
    }

    // 解析错误行号 - 查找 "line X" 或 "<exec>, line X"
    const lineMatches = errorMessage.match(/line (\d+)/g);
    if (lineMatches && lineMatches.length > 0) {
      // 取最后一个匹配的行号（通常是用户代码的行号）
      const lastLineMatch = lineMatches[lineMatches.length - 1];
      const lineNumber = lastLineMatch.match(/line (\d+)/);
      if (lineNumber) {
        errorLine = parseInt(lineNumber[1], 10);
        console.log('识别的错误行号:', errorLine);
      }
    }

    // 根据错误类型进行具体解析
    const colonIndex = lastLine.indexOf(':');
    const errorDetail = colonIndex !== -1 ? lastLine.substring(colonIndex + 1).trim() : '';
    
    console.log('错误详情:', errorDetail);

    switch (errorType) {
      case 'NameError':
        // name 'undefined_variable' is not defined
        const nameMatch = errorDetail.match(/name '([^']+)' is not defined/);
        if (nameMatch) {
          friendlyMessage = `变量 '${nameMatch[1]}' 未定义，请检查变量名是否正确或是否已经声明`;
        } else {
          friendlyMessage = `变量名错误：${errorDetail}`;
        }
        break;

      case 'ModuleNotFoundError':
        // No module named 'non_existent_module'
        const moduleMatch = errorDetail.match(/No module named '([^']+)'/);
        if (moduleMatch) {
          friendlyMessage = `找不到模块 '${moduleMatch[1]}'，该模块可能不存在或未安装`;
        } else {
          friendlyMessage = `模块未找到：${errorDetail}`;
        }
        break;

      case 'SyntaxError':
        // 各种语法错误的具体解析
        if (errorDetail.includes('invalid syntax')) {
          friendlyMessage = '语法错误：代码语法不正确，请检查括号、冒号、缩进等';
        } else if (errorDetail.includes('unexpected EOF')) {
          friendlyMessage = '语法错误：代码不完整，可能缺少右括号或引号';
        } else {
          friendlyMessage = `语法错误：${errorDetail}`;
        }
        break;

      case 'IndentationError':
        if (errorDetail.includes('expected an indented block')) {
          friendlyMessage = '缩进错误：期望缩进的代码块，请检查 if、for、def 等语句后的缩进';
        } else {
          friendlyMessage = `缩进错误：${errorDetail}`;
        }
        break;

      case 'TypeError':
        // 'str' object is not callable
        // unsupported operand type(s) for +: 'int' and 'str'
        if (errorDetail.includes('object is not callable')) {
          const typeMatch = errorDetail.match(/'([^']+)' object is not callable/);
          if (typeMatch) {
            friendlyMessage = `类型错误：${typeMatch[1]} 类型的对象不能像函数一样调用`;
          } else {
            friendlyMessage = `类型错误：对象不能被调用，可能把变量当作函数使用了`;
          }
        } else if (errorDetail.includes('unsupported operand type')) {
          const operandMatch = errorDetail.match(/unsupported operand type\(s\) for (.+): '([^']+)' and '([^']+)'/);
          if (operandMatch) {
            friendlyMessage = `类型错误：不能对 ${operandMatch[2]} 和 ${operandMatch[3]} 类型进行 ${operandMatch[1]} 操作`;
          } else {
            friendlyMessage = `类型错误：操作的数据类型不匹配`;
          }
        } else {
          friendlyMessage = `类型错误：${errorDetail}`;
        }
        break;

      case 'IndexError':
        // list index out of range
        if (errorDetail.includes('list index out of range')) {
          friendlyMessage = '索引错误：列表索引超出范围，请检查索引值是否正确';
        } else if (errorDetail.includes('string index out of range')) {
          friendlyMessage = '索引错误：字符串索引超出范围，请检查索引值是否正确';
        } else {
          friendlyMessage = `索引错误：${errorDetail}`;
        }
        break;

      case 'KeyError':
        // 'key_name'
        const keyMatch = errorDetail.match(/'([^']+)'/);
        if (keyMatch) {
          friendlyMessage = `键错误：字典中不存在键 '${keyMatch[1]}'，请检查键名是否正确`;
        } else {
          friendlyMessage = `键错误：字典中不存在指定的键 ${errorDetail}`;
        }
        break;

      case 'ZeroDivisionError':
        if (errorDetail.includes('division by zero')) {
          friendlyMessage = '除零错误：不能除以零，请检查除数是否为零';
        } else if (errorDetail.includes('modulo by zero')) {
          friendlyMessage = '除零错误：不能对零取模，请检查除数是否为零';
        } else {
          friendlyMessage = `除零错误：${errorDetail}`;
        }
        break;

      case 'ValueError':
        // invalid literal for int() with base 10: 'abc'
        if (errorDetail.includes('invalid literal for int()')) {
          const valueMatch = errorDetail.match(/invalid literal for int\(\) with base \d+: '([^']+)'/);
          if (valueMatch) {
            friendlyMessage = `值错误：'${valueMatch[1]}' 不能转换为整数，请检查输入的值`;
          } else {
            friendlyMessage = '值错误：字符串不能转换为整数';
          }
        } else if (errorDetail.includes('could not convert string to float')) {
          friendlyMessage = '值错误：字符串不能转换为浮点数，请检查输入的值';
        } else {
          friendlyMessage = `值错误：${errorDetail}`;
        }
        break;

      case 'AttributeError':
        // 'str' object has no attribute 'append'
        const attrMatch = errorDetail.match(/'([^']+)' object has no attribute '([^']+)'/);
        if (attrMatch) {
          friendlyMessage = `属性错误：${attrMatch[1]} 类型的对象没有 '${attrMatch[2]}' 属性或方法`;
        } else {
          friendlyMessage = `属性错误：${errorDetail}`;
        }
        break;

      case 'FileNotFoundError':
        const fileMatch = errorDetail.match(/\[Errno 2\] No such file or directory: '([^']+)'/);
        if (fileMatch) {
          friendlyMessage = `文件未找到：找不到文件 '${fileMatch[1]}'，请检查文件路径是否正确`;
        } else {
          friendlyMessage = `文件未找到：${errorDetail}`;
        }
        break;

      case 'RecursionError':
        if (errorDetail.includes('maximum recursion depth exceeded')) {
          friendlyMessage = '递归错误：超过最大递归深度，可能存在无限递归';
        } else {
          friendlyMessage = `递归错误：${errorDetail}`;
        }
        break;

      case 'OverflowError':
        if (errorDetail.includes('math range error')) {
          friendlyMessage = '溢出错误：数学运算结果超出范围';
        } else {
          friendlyMessage = `溢出错误：${errorDetail}`;
        }
        break;

      default:
        // 对于未知错误类型，使用通用处理
        const baseMessage = ERROR_TYPE_MAP[errorType] || `${errorType}：代码执行出现错误`;
        if (errorDetail) {
          friendlyMessage = `${baseMessage}：${errorDetail}`;
        } else {
          friendlyMessage = baseMessage;
        }
        break;
    }

    console.log('生成的友好提示:', friendlyMessage);

  } catch (parseError) {
    console.warn('解析错误信息失败:', parseError);
    friendlyMessage = '代码执行出现错误，请检查代码语法';
  }

  return { errorType, errorLine, friendlyMessage };
};

export const PythonEnvContextProvider: React.FC<PythonEnvContextProviderProps> = ({ children }) => {
  const [envInitComplete, setEnvInitComplete] = useState(false);
  const pyodideRef = useRef<any>(null);
  const isInitializing = useRef(false);

  // 预加载Pyodide
  useEffect(() => {
    const preloadPyodide = async () => {
      if (pyodideRef.current || isInitializing.current) return;

      try {
        isInitializing.current = true;
        // 加载 Pyodide
        const pyodide = await loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/",
          stdout: (text) => {
            console.log('Pyodide stdout:', text);
          },
          stderr: (text) => {
            console.error('Pyodide stderr:', text);
          }
        });

        // 初始化 sys 模块来捕获标准输出
        await pyodide.runPythonAsync(`
          import sys
          import io
          
          class PyodideOutput:
              def __init__(self):
                  self.init_cache()
                  
              def init_cache(self):
                  self.stdout = io.StringIO()
                  self.stderr = io.StringIO()
                  self.output = ""
                  self.error = ""
                  
              def write_stdout(self, text):
                  self.stdout.write(text)
                  self.output += text
                  
              def write_stderr(self, text):
                  self.stderr.write(text)
                  self.error += f"{text}"
                  
              def get_output(self):
                  return self.output
                  
              def get_error(self):
                  return self.error
                  
             
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
                  
          sys.stdout = StdoutCatcher()
          sys.stderr = StderrCatcher()
        `);
        
        pyodideRef.current = pyodide;
        setEnvInitComplete(true);
        console.log('Pyodide 预加载完成');
      } catch (error) {
        console.warn('Pyodide 预加载失败:', error);
        setEnvInitComplete(false);
      } finally {
        isInitializing.current = false;
      }
    };

    preloadPyodide();
  }, []);

  const runCode = async (code: string) => {
    // 代码执行返回的数据结构
    
    const result: PythonCodeRunResult = {
      runCode: code,
      output: "",
      isSuccess: false,
      errorType: "",
      errorLine: 0,
      errorMessage: "",
      friendlyMessage: ""
    };

    try {
      // 确保 Pyodide 已经初始化
      if (!pyodideRef.current) {
        result.output = "Python 环境尚未初始化完成，请稍后再试";
        result.errorMessage = "Python environment not ready";
        return result;
      }

      // 运行前先清空输出
      await pyodideRef.current.runPythonAsync(`pyodide_output.init_cache()`);

      // 执行用户代码
      await pyodideRef.current.runPythonAsync(code);
      
      // 获取输出
      const output = await pyodideRef.current.runPythonAsync(`pyodide_output.get_output()`);
      
      result.output = output || "代码执行成功，但没有输出";
      result.isSuccess = true;
      
    } catch (error: unknown) {
      result.isSuccess = false;
      
      // 直接使用 error 对象的信息，因为 Pyodide 的错误信息就在这里
      const errorMessage = await pyodideRef.current.runPythonAsync(`pyodide_output.get_error()`);
      
      // 解析错误信息，获取错误类型、行号和友好提示
      const { errorType, errorLine, friendlyMessage } = parseErrorInfo(errorMessage);
      
      result.errorLine = errorLine;
      result.errorType = errorType;
      result.errorMessage = errorMessage;
      result.friendlyMessage = friendlyMessage;
      result.output = friendlyMessage;

      // 如果解析后的友好提示为空，使用默认提示
      if (!result.friendlyMessage && result.errorType) {
        result.friendlyMessage = ERROR_TYPE_MAP[result.errorType] || `${result.errorType}：代码执行出现错误`;
        result.output = result.friendlyMessage;
      }

      console.log('解析后的错误信息:', {
        errorType,
        errorLine,
        friendlyMessage,
        originalError: errorMessage,
        finalOutput: result.output
      });
    }
    
    return result;
  };

  // 准备上下文值
  const contextValue = {
    envInitComplete,
    runCode
  };

  return (
    <PythonEnvContext.Provider value={contextValue}>
      {children}
    </PythonEnvContext.Provider>
  );
};

export default PythonEnvContext;
