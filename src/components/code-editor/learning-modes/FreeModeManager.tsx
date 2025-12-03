import * as monaco from 'monaco-editor';
import { BaseModeManager } from './BaseModeManager';
import { ModeManagerOptions } from './types.tsx';
import { addStyleToDocument } from '../core/utils';
import { compareOutputs } from '../core/pyodide-integration';

export class FreeModeManager extends BaseModeManager {
  private expectedOutput?: string;
  private hints: string[];
  private readOnlyDecorations: string[] = [];

  constructor(options: ModeManagerOptions) {
    super(options);
    this.expectedOutput = options.expectedOutput;
    this.hints = options.hints || [];
  }

  protected initializeMode(): void {
    // 添加CSS样式
    this.addStyles();
    
    // 初始化编辑器内容
    this.initializeEditorContent();
    
    // 如果有提示，在输出窗口显示第一个提示
    if (this.hints.length > 0) {
      this.setOutput(`# 自由模式：按照要求完成代码\n\n# 提示: ${this.hints[0]}\n\n# 可以使用 Ctrl+Enter 快捷键运行代码`);
    } else {
      this.setOutput('# 自由模式：可以自由编写代码\n\n# 可以使用 Ctrl+Enter 快捷键运行代码');
    }
  }

  protected disposeMode(): void {
    // 清理装饰效果
    this.clearDecorations();
  }

  /**
   * 添加自由模式相关的CSS样式
   */
  private addStyles(): void {
    addStyleToDocument('free-mode-styles', `
      .readonly-line {
        position: relative;
        background-color: rgba(40, 40, 40, 0.5);
        border-left: 2px solid #3d3d3d;
      }
    `);
  }

  /**
   * 初始化编辑器内容
   */
  private initializeEditorContent(): void {
    const model = this.editor.getModel();
    if (!model) return;
    
    // 设置只读区域，如果有的话
    this.applyReadOnlyAreas();
  }

  /**
   * 应用只读区域
   */
  private applyReadOnlyAreas(): void {
    const readOnlyLines = this.options.readOnlyLines || [];
    if (readOnlyLines.length === 0) return;
    
    const model = this.editor.getModel();
    if (!model) return;
    
    const decorations = readOnlyLines.map(lineNumber => ({
      range: new monaco.Range(
        lineNumber, 1,
        lineNumber, model.getLineMaxColumn(lineNumber)
      ),
      options: {
        isWholeLine: true,
        className: 'readonly-line',
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
      }
    }));
    
    this.readOnlyDecorations = this.editor.deltaDecorations([], decorations);
  }

  /**
   * 清除所有装饰
   */
  private clearDecorations(): void {
    this.readOnlyDecorations = this.editor.deltaDecorations(this.readOnlyDecorations, []);
  }

  /**
   * 验证代码输出是否符合预期
   */
  public validate(output: string, expectedOutput?: string): boolean {
    if (!expectedOutput) return true;
    
    // 检查输出是否符合预期
    return compareOutputs(output, expectedOutput);
  }

  // 访问选项
  private get options(): ModeManagerOptions {
    return {
      editor: this.editor,
      monaco: this.monaco,
      initialCode: this.initialCode,
      setOutput: this.setOutput,
      expectedOutput: this.expectedOutput,
      hints: this.hints,
      readOnlyLines: []
    };
  }
} 