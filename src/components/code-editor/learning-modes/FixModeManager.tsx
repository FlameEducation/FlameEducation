import * as monaco from 'monaco-editor';
import { BaseModeManager } from './BaseModeManager';
import { ModeManagerOptions } from './types.tsx';
import { addStyleToDocument } from '../core/utils';
import { compareOutputs } from '../core/pyodide-integration';

export class FixModeManager extends BaseModeManager {
  private expectedOutput?: string;
  private hints: string[];
  private readOnlyDecorations: string[] = [];
  private errorMarkDecorations: string[] = [];

  constructor(options: ModeManagerOptions) {
    super(options);
    this.expectedOutput = options.expectedOutput;
    this.hints = options.hints || [];
  }

  protected initializeMode(): void {
    // 添加CSS样式
    this.addStyles();
    
    // 初始设置编辑器内容
    this.initializeEditorContent();
    
    // 高亮可能的错误区域
    this.highlightPotentialErrorAreas();
    
    // 如果有提示，在输出窗口显示第一个提示
    if (this.hints.length > 0) {
      this.setOutput(`# 修改模式：请找出并修复代码中的错误\n\n# 提示: ${this.hints[0]}`);
    } else {
      this.setOutput('# 修改模式：请找出并修复代码中的错误');
    }
  }

  protected disposeMode(): void {
    // 清理装饰效果
    this.clearDecorations();
  }

  /**
   * 添加修改模式相关的CSS样式
   */
  private addStyles(): void {
    addStyleToDocument('fix-mode-styles', `
      .error-line-highlight {
        background-color: rgba(71, 39, 39, 0.4);
        border-left: 2px solid rgba(255, 99, 71, 0.8);
      }
      
      .error-marker {
        position: relative;
        background-color: rgba(255, 0, 0, 0.2);
        border-bottom: 1px wavy rgba(255, 99, 71, 0.7);
      }
      
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
   * 高亮潜在的错误区域
   */
  private highlightPotentialErrorAreas(): void {
    const model = this.editor.getModel();
    if (!model) return;
    
    const content = model.getValue();
    const lines = content.split('\n');
    
    const decorations = [];
    
    // 查找明显错误的行
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      // 查找注释中的错误提示
      if (line.includes('错误') || line.includes('修复') || line.includes('bug') || 
          line.includes('问题') || line.includes('缺陷')) {
        decorations.push({
          range: new monaco.Range(
            lineNumber, 1,
            lineNumber, model.getLineMaxColumn(lineNumber)
          ),
          options: {
            isWholeLine: true,
            className: 'error-line-highlight',
            overviewRuler: {
              color: 'rgba(255, 0, 0, 0.7)',
              position: monaco.editor.OverviewRulerLane.Right
            }
          }
        });
      }
      
      // 查找常见Python语法错误
      // 1. 缺少冒号
      if ((line.includes('if ') || line.includes('for ') || line.includes('while ') || 
          line.includes('def ') || line.includes('class ')) && 
          !line.includes(':') && !line.endsWith('\\')) {
        decorations.push({
          range: new monaco.Range(
            lineNumber, 1,
            lineNumber, model.getLineMaxColumn(lineNumber)
          ),
          options: {
            className: 'error-marker',
            hoverMessage: { value: '这里可能缺少冒号(:)' }
          }
        });
      }
      
      // 2. 缺少括号
      const openParens = (line.match(/\(/g) || []).length;
      const closeParens = (line.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        decorations.push({
          range: new monaco.Range(
            lineNumber, 1,
            lineNumber, model.getLineMaxColumn(lineNumber)
          ),
          options: {
            className: 'error-marker',
            hoverMessage: { value: '括号可能不匹配' }
          }
        });
      }
      
      // 3. 缺少引号
      const singleQuotes = (line.match(/'/g) || []).length;
      const doubleQuotes = (line.match(/"/g) || []).length;
      if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
        decorations.push({
          range: new monaco.Range(
            lineNumber, 1,
            lineNumber, model.getLineMaxColumn(lineNumber)
          ),
          options: {
            className: 'error-marker',
            hoverMessage: { value: '引号可能不匹配' }
          }
        });
      }
      
      // 4. 缩进错误
      if (i > 0 && line.trim() && !line.trim().startsWith('#')) {
        const prevLine = lines[i - 1].trim();
        if (prevLine.endsWith(':')) {
          // 如果上一行以冒号结尾，这一行应该缩进
          if (line.search(/\S/) <= lines[i - 1].search(/\S/)) {
            decorations.push({
              range: new monaco.Range(
                lineNumber, 1,
                lineNumber, line.search(/\S/) + 1
              ),
              options: {
                className: 'error-marker',
                hoverMessage: { value: '这一行可能需要缩进' }
              }
            });
          }
        }
      }
    }
    
    // 应用装饰
    this.errorMarkDecorations = this.editor.deltaDecorations([], decorations);
  }

  /**
   * 清除所有装饰
   */
  private clearDecorations(): void {
    this.readOnlyDecorations = this.editor.deltaDecorations(this.readOnlyDecorations, []);
    this.errorMarkDecorations = this.editor.deltaDecorations(this.errorMarkDecorations, []);
  }

  /**
   * 验证代码是否修复了所有错误
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