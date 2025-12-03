import * as monaco from 'monaco-editor';
import { BaseModeManager } from './BaseModeManager';
import { ModeManagerOptions } from './types.tsx';
import { addStyleToDocument } from '../core/utils';
import { compareOutputs } from '../core/pyodide-integration';

export class FollowModeManager extends BaseModeManager {
  private placeholderCode: string;
  private expectedOutput?: string;
  private userTypedChars: Record<string, boolean> = {};
  private overlayDiv: HTMLDivElement | null = null;
  private errorDecorationIds: string[] = [];

  constructor(options: ModeManagerOptions) {
    super(options);
    this.placeholderCode = options.placeholderCode || '';
    this.expectedOutput = options.expectedOutput;
  }

  protected initializeMode(): void {
    // 如果没有模板代码，则不进行特殊设置
    if (!this.placeholderCode) {
      this.setOutput('# 跟写模式需要提供模板代码');
      return;
    }

    // 添加CSS样式
    this.addStyles();
    
    // 初始化编辑器内容
    this.initializeEditorContent();
    
    // 创建背景层
    this.createPlaceholderOverlay();
    
    // 监听编辑器内容变化
    this.registerDisposable(
      this.editor.onDidChangeModelContent(this.handleContentChange)
    );
    
    // 监听编辑器滚动变化
    this.registerDisposable(
      this.editor.onDidScrollChange(() => {
        this.updatePlaceholderText();
      })
    );
    
    // 监听编辑器布局变化
    this.registerDisposable(
      this.editor.onDidLayoutChange(() => {
        this.createPlaceholderOverlay();
        this.updatePlaceholderText();
      })
    );
    
    // 初始更新背景提示文本
    setTimeout(() => {
      this.updatePlaceholderText();
    }, 100);
    
    // 多次尝试更新，确保背景最终显示
    [500, 1200].forEach(delay => {
      setTimeout(() => {
        this.insertEmptyLines(this.placeholderCode.split('\n').length);
        this.updatePlaceholderText();
      }, delay);
    });
    
    // 窗口调整处理
    const resizeListener = () => {
      setTimeout(() => {
        this.createPlaceholderOverlay();
        this.updatePlaceholderText();
      }, 100);
    };
    
    window.addEventListener('resize', resizeListener);
    
    // 注册清理函数
    this.registerDisposable({
      dispose: () => {
        window.removeEventListener('resize', resizeListener);
      }
    });
  }

  protected disposeMode(): void {
    // 移除覆盖层
    if (this.overlayDiv && this.overlayDiv.parentNode) {
      this.overlayDiv.parentNode.removeChild(this.overlayDiv);
    }
    
    // 清除错误装饰
    this.clearErrorDecorations();
  }

  /**
   * 添加跟写模式相关的CSS样式
   */
  private addStyles(): void {
    addStyleToDocument('follow-mode-styles', `
      .placeholder-overlay {
        position: absolute;
        pointer-events: none;
        z-index: 1;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      .placeholder-line {
        position: absolute;
        font-family: var(--monaco-monospace-font);
        white-space: pre;
        pointer-events: none;
        overflow: visible;
        color: rgba(150, 150, 150, 0.6);
        z-index: 1;
        padding-left: 0; /* 设置左填充为0，使其与代码区域最左侧对齐 */
      }
      .mismatch-char {
        position: relative;
        background-color: rgba(255, 0, 0, 0.2);
        border-bottom: 1px solid rgba(255, 99, 71, 0.7);
      }
      
      /* 确保编辑器内部文本不会遮挡背景提示 */
      .monaco-editor .view-lines {
        z-index: 2;
      }
      
      /* 确保背景层显示在编辑器背景之上 */
      .monaco-editor .monaco-editor-background {
        z-index: 0;
      }
      
      /* 暗色主题下已完成的字符样式 */
      .completed-char {
        color: rgba(100, 220, 100, 0.7) !important;
      }
    `);
  }

  /**
   * 初始化编辑器内容
   */
  private initializeEditorContent(): void {
    const model = this.editor.getModel();
    if (!model) return;
    
    // 解析占位符行
    const _placeholderLines = this.placeholderCode.split('\n');
    
    // 插入足够的空行以匹配模板行数
    this.insertEmptyLines(_placeholderLines.length);
  }

  /**
   * 插入足够的空行以匹配模板行数
   */
  private insertEmptyLines(targetLineCount: number): void {
    const model = this.editor.getModel();
    if (!model) return;
    
    // 当前模型中的行数与目标行数比较
    const currentLineCount = model.getLineCount();
    
    if (currentLineCount < targetLineCount) {
      // 需要添加的行数
      const linesToAdd = targetLineCount - currentLineCount;
      
      // 如果当前文档为空，直接设置值而不是追加
      if (model.getValue().trim() === '') {
        // 创建一个与模板行数相同的空行文档
        const emptyDoc = Array(targetLineCount).fill('').join('\n');
        model.setValue(emptyDoc);
      } else {
        // 否则追加空行到文档末尾
        const lastLine = currentLineCount;
        const lastColumn = model.getLineMaxColumn(lastLine);
        const range = new monaco.Range(lastLine, lastColumn, lastLine, lastColumn);
        
        // 创建空行文本
        const emptyLinesText = Array(linesToAdd).fill('').join('\n');
        
        model.pushEditOperations(
          [],
          [{ range, text: '\n' + emptyLinesText, forceMoveMarkers: true }],
          () => null
        );
      }
      
      // 确认行数是否正确，并在必要时重试
      setTimeout(() => {
        const updatedLineCount = model.getLineCount();
        if (updatedLineCount < targetLineCount) {
          this.insertEmptyLines(targetLineCount); // 递归尝试，直到行数足够
        }
      }, 10);
    }
  }

  /**
   * 创建背景提示覆盖层
   */
  private createPlaceholderOverlay(): void {
    // 移除旧的覆盖层
    if (this.overlayDiv && this.overlayDiv.parentNode) {
      this.overlayDiv.parentNode.removeChild(this.overlayDiv);
    }

    const editorDomNode = this.editor.getDomNode();
    if (!editorDomNode) return;

    // 创建覆盖层容器
    this.overlayDiv = document.createElement('div');
    this.overlayDiv.className = 'placeholder-overlay';
    
    // 获取编辑器背景元素
    const backgroundNode = editorDomNode.querySelector('.monaco-editor-background');
    if (!backgroundNode) return;
    
    // 将覆盖层添加到编辑器容器中
    backgroundNode.appendChild(this.overlayDiv);
  }

  /**
   * 获取编辑器文本样式信息
   */
  private getTextPosition(): { fontSize: number; lineHeight: number; fontFamily: string } | null {
    const editorDomNode = this.editor.getDomNode();
    if (!editorDomNode) return null;
    
    // 尝试找到第一个文本行
    const viewLine = editorDomNode.querySelector('.view-line');
    if (!viewLine) return null;
    
    // 获取计算后的样式
    const computedStyle = window.getComputedStyle(viewLine);
    
    return {
      // 字体大小和行高
      fontSize: parseInt(computedStyle.fontSize || '14'),
      lineHeight: parseInt(computedStyle.lineHeight || '18'),
      // 字体
      fontFamily: computedStyle.fontFamily
    };
  }

  /**
   * 更新背景提示文本
   */
  private updatePlaceholderText = (): void => {
    if (!this.overlayDiv) return;
    
    // 清空当前覆盖层内容
    this.overlayDiv.innerHTML = '';
    
    const model = this.editor.getModel();
    if (!model) return;
    
    // 获取编辑器的文本样式信息
    const textPosition = this.getTextPosition();
    if (!textPosition) {
      // 如果获取不到样式信息，稍后重试
      setTimeout(() => this.updatePlaceholderText(), 100);
      return;
    }
    
    // 获取可见行范围，但我们将处理所有行
    const viewportRange = this.editor.getVisibleRanges()[0];
    if (!viewportRange) return;
    
    // 解析所有占位符行
    const placeholderLines = this.placeholderCode.split('\n');
    
    // 固定设置左侧起始位置为0，依靠CSS的padding来对齐
    const finalTextLeft = 0;
    
    // 获取当前编辑器内容行
    const contentLines = model.getValue().split('\n');
    
    // 遍历所有行，而不仅仅是可见行
    for (let lineNumber = 1; lineNumber <= placeholderLines.length; lineNumber++) {
      const lineIndex = lineNumber - 1;
      
      // 获取当前行的占位符文本
      const placeholderText = placeholderLines[lineIndex];
      
      // 获取当前行的实际文本（如果存在）
      const currentText = lineNumber <= contentLines.length ? contentLines[lineIndex] : '';
      
      // 创建行元素
      const lineElement = document.createElement('div');
      lineElement.className = 'placeholder-line';
      
      // 设置行位置和样式
      const lineTop = this.editor.getTopForLineNumber(lineNumber) || lineNumber * textPosition.lineHeight;
      
      // 设置与编辑器文本完全相同的定位和样式
      lineElement.style.top = `${lineTop}px`;
      lineElement.style.left = `${finalTextLeft}px`; // 使用固定的0位置
      lineElement.style.height = `${textPosition.lineHeight}px`;
      lineElement.style.lineHeight = `${textPosition.lineHeight}px`;
      lineElement.style.fontSize = `${textPosition.fontSize}px`;
      lineElement.style.fontFamily = textPosition.fontFamily;
      // 移除所有可能影响对齐的边距
      lineElement.style.margin = '0';
      lineElement.style.padding = '0';
      // 确保文字不会有额外的变形
      lineElement.style.letterSpacing = '0';
      lineElement.style.wordSpacing = '0';
      lineElement.style.textRendering = 'optimizeLegibility';
      
      // 用户已完成此行的显示
      if (currentText === placeholderText) {
        lineElement.className = 'placeholder-line completed-char';
        lineElement.textContent = placeholderText;
      } else {
        // 未完成/部分完成的行
        lineElement.textContent = placeholderText;
        
        // 逐字符分析匹配情况(当行有内容时)
        if (currentText.length > 0) {
          lineElement.innerHTML = ''; // 清空以逐字符添加
          
          for (let i = 0; i < placeholderText.length; i++) {
            const charSpan = document.createElement('span');
            const placeholderChar = placeholderText[i];
            
            charSpan.textContent = placeholderChar;
            
            // 已正确输入的字符使用completed-char类
            if (i < currentText.length && currentText[i] === placeholderChar) {
              charSpan.className = 'completed-char';
            }
            
            lineElement.appendChild(charSpan);
          }
        }
      }
      
      // 添加到覆盖层
      this.overlayDiv.appendChild(lineElement);
    }
  };

  /**
   * 处理编辑器内容变化
   */
  private handleContentChange = (): void => {
    const model = this.editor.getModel();
    if (!model) return;
    
    // 清除旧的错误高亮
    this.clearErrorDecorations();
    
    // 获取当前编辑器内容
    const currentText = model.getValue();
    const currentLines = currentText.split('\n');
    
    // 获取占位符文本
    const placeholderLines = this.placeholderCode.split('\n');
    
    // 首先确保行数足够
    this.insertEmptyLines(placeholderLines.length);
    
    // 高亮与模板不匹配的字符
    const decorations = [];
    
    // 遍历每一行
    for (let lineIndex = 0; lineIndex < Math.min(currentLines.length, placeholderLines.length); lineIndex++) {
      const currentLine = currentLines[lineIndex];
      const placeholderLine = placeholderLines[lineIndex];
      
      // 遍历每个字符
      for (let charIndex = 0; charIndex < Math.min(currentLine.length, placeholderLine.length); charIndex++) {
        // 如果字符不匹配
        if (currentLine[charIndex] !== placeholderLine[charIndex]) {
          // 创建错误装饰
          decorations.push({
            range: new monaco.Range(
              lineIndex + 1, charIndex + 1,
              lineIndex + 1, charIndex + 2
            ),
            options: {
              className: 'mismatch-char',
              hoverMessage: { value: `应该输入: "${placeholderLine[charIndex]}"` }
            }
          });
        }
      }
      
      // 如果当前行太长，标记多余的字符
      if (currentLine.length > placeholderLine.length) {
        decorations.push({
          range: new monaco.Range(
            lineIndex + 1, placeholderLine.length + 1,
            lineIndex + 1, currentLine.length + 1
          ),
          options: {
            className: 'mismatch-char',
            hoverMessage: { value: '多余的字符' }
          }
        });
      }
    }
    
    // 应用装饰
    this.errorDecorationIds = this.editor.deltaDecorations([], decorations);
    
    // 更新背景文本
    this.updatePlaceholderText();
    
    // 检查是否完全匹配
    if (currentText === this.placeholderCode) {
      this.setOutput('# 恭喜！你已经正确输入了所有代码！');
    }
  };

  /**
   * 清除错误装饰
   */
  private clearErrorDecorations(): void {
    if (this.errorDecorationIds.length > 0) {
      this.errorDecorationIds = this.editor.deltaDecorations(this.errorDecorationIds, []);
    }
  }

  /**
   * 验证代码
   */
  public validate(code: string, expectedOutput?: string): boolean {
    // 首先检查是否与模板完全匹配
    const isMatchingTemplate = code === this.placeholderCode;
    
    // 如果需要检查输出，还需要比较输出结果
    if (expectedOutput) {
      return isMatchingTemplate && compareOutputs(code, expectedOutput);
    }
    
    return isMatchingTemplate;
  }
} 