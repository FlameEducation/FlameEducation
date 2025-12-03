import * as monaco from 'monaco-editor';

/**
 * 配置Monaco编辑器的基本选项
 * @param editor 编辑器实例
 */
export const configureEditorBasics = (editor: monaco.editor.IStandaloneCodeEditor): void => {
  editor.updateOptions({
    fontSize: 14,
    fontFamily: "'Fira Code', 'Menlo', 'Monaco', 'Courier New', monospace",
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    guides: { indentation: true },
    automaticLayout: true,
    tabSize: 4,
    insertSpaces: true,
    detectIndentation: true,
    wordWrap: 'off',
    padding: { top: 10 }
  });
};

/**
 * 配置Monaco编辑器的Python语言自动完成功能
 * @param monaco Monaco实例
 */
export const configurePythonLanguage = (monaco: monaco.editor.IMonaco): void => {
  monaco.languages.registerCompletionItemProvider('python', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      // 基本Python关键字和内置函数
      const suggestions = [
        // 关键字
        ...['and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else',
          'except', 'False', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
          'lambda', 'None', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'True', 'try',
          'while', 'with', 'yield'].map(keyword => ({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          range
        })),
        
        // 常用函数
        ...['print', 'input', 'len', 'range', 'int', 'str', 'float', 'list', 'dict', 'set',
          'tuple', 'sum', 'min', 'max', 'sorted', 'map', 'filter'].map(func => ({
          label: func,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: func,
          detail: `Python内置函数`,
          documentation: `Python内置函数: ${func}`,
          range
        }))
      ];

      return { suggestions };
    }
  });
};

/**
 * 添加运行代码的快捷键
 * @param editor 编辑器实例
 * @param monaco Monaco实例
 * @param callback 运行代码的回调函数
 */
export const addRunCodeShortcut = (
  editor: monaco.editor.IStandaloneCodeEditor,
  monaco: monaco.editor.IMonaco,
  callback: () => void
): void => {
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, callback);
};

/**
 * 在编辑器中应用装饰器
 * @param editor 编辑器实例
 * @param range 要装饰的范围
 * @param className CSS类名
 * @param hoverMessage 鼠标悬停时显示的消息
 * @returns 装饰器IDs
 */
export const addDecoration = (
  editor: monaco.editor.IStandaloneCodeEditor,
  range: monaco.IRange,
  className: string,
  hoverMessage?: string
): string[] => {
  const decorationOptions = {
    isWholeLine: false,
    className,
    hoverMessage: hoverMessage ? { value: hoverMessage } : undefined
  };
  
  return editor.deltaDecorations(
    [], 
    [{ range, options: decorationOptions }]
  );
};

/**
 * 清除编辑器中的装饰器
 * @param editor 编辑器实例
 * @param decorationIds 要清除的装饰器IDs
 */
export const clearDecorations = (
  editor: monaco.editor.IStandaloneCodeEditor,
  decorationIds: string[]
): void => {
  editor.deltaDecorations(decorationIds, []);
};

/**
 * 添加CSS样式到文档
 * @param styleId 样式元素的ID
 * @param cssText CSS文本
 */
export const addStyleToDocument = (styleId: string, cssText: string): void => {
  // 检查是否已存在相同ID的样式
  let styleElement = document.getElementById(styleId) as HTMLStyleElement;
  
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }
  
  styleElement.innerHTML = cssText;
}; 