import * as monaco from 'monaco-editor';
import { BaseModeManager } from './BaseModeManager';
import { FillArea, ModeManagerOptions, CodeSection } from './types.tsx';
import { addStyleToDocument } from '../core/utils';
import { compareOutputs } from '../core/pyodide-integration';

/**
 * 填空模式管理器 - 重构版本
 * 功能：管理代码填空编辑，设置只读区域和可编辑区域
 */
export class FillModeManager extends BaseModeManager {
  private fillAreas: FillArea[] = [];
  private fillAreasHints: string[] = [];
  private activeFillAreaIndex: number = 0;
  private readOnlyDecorations: string[] = [];
  private highlightDecorations: string[] = [];
  private expectedOutput?: string;
  private codeSections?: CodeSection[];
  private isInitializing: boolean = false;

  constructor(options: ModeManagerOptions) {
    super(options);
    this.codeSections = options.codeSections;
    this.expectedOutput = options.expectedOutput;
    
    // 处理填空区域配置
    if (this.codeSections && this.codeSections.length > 0) {
      this.initializeFromCodeSections();
    } else {
      this.fillAreas = options.fillAreas || [];
      this.fillAreasHints = options.fillAreasHints || [];
    }
  }

  protected initializeMode(): void {
    this.isInitializing = true;
    
    // 添加样式
    this.addCustomStyles();
    
    // 如果没有使用codeSections，应用填空区域到现有代码
    if (!this.codeSections || this.codeSections.length === 0) {
      this.applyFillAreasToExistingCode();
    }
    
    // 设置编辑器事件监听
    this.setupEventListeners();
    
    // 应用样式和高亮
    setTimeout(() => {
      this.applyEditableStyles();
      this.highlightCurrentFillArea();
      this.showInitialHints();
      this.isInitializing = false;
    }, 50);
  }

  protected disposeMode(): void {
    // 清除所有装饰
    this.editor.deltaDecorations(this.highlightDecorations, []);
    this.editor.deltaDecorations(this.readOnlyDecorations, []);
    this.highlightDecorations = [];
    this.readOnlyDecorations = [];
  }

  /**
   * 添加自定义样式
   */
  private addCustomStyles(): void {
    addStyleToDocument('fill-mode-styles', `
      .readonly-area {
        background: rgba(40, 40, 40, 0.6) !important;
        border-left: 2px solid #555 !important;
      }
      
      .editable-area {
        background: rgba(39, 71, 43, 0.4) !important;
        border-left: 2px solid #4CAF50 !important;
      }
      
      .current-fill-area {
        background: rgba(39, 71, 43, 0.7) !important;
        border-left: 2px solid #66BB6A !important;
      }
      
      .highlight-editable {
        background: rgba(39, 71, 43, 0.6) !important;
        animation: pulse-green 2s infinite;
      }
      
      .highlight-readonly {
        background: rgba(71, 39, 39, 0.6) !important;
        animation: pulse-red 1.5s infinite;
      }
      
      @keyframes pulse-green {
        0% { background: rgba(39, 71, 43, 0.4) !important; }
        50% { background: rgba(39, 71, 43, 0.8) !important; }
        100% { background: rgba(39, 71, 43, 0.4) !important; }
      }
      
      @keyframes pulse-red {
        0% { background: rgba(71, 39, 39, 0.4) !important; }
        50% { background: rgba(71, 39, 39, 0.8) !important; }
        100% { background: rgba(71, 39, 39, 0.4) !important; }
      }
    `);
  }

  /**
   * 从CodeSections初始化编辑器内容
   */
  private initializeFromCodeSections(): void {
    if (!this.codeSections) return;
    
    const model = this.editor.getModel();
    if (!model) return;
    
    let codeText = '';
    let currentLine = 1;
    let blankIndex = 0;
    
    // 构建代码并记录填空区域
    this.codeSections.forEach((section) => {
      if (section.type === 'fix' && section.code) {
        // 固定代码
        codeText += section.code;
        if (!section.code.endsWith('\n')) {
          codeText += '\n';
        }
        currentLine += section.code.split('\n').length;
      } else if (section.type === 'blank') {
        // 可编辑区域
        const hint = section.target || '请在此处编写代码';
        this.fillAreasHints.push(hint);
        
        const startLine = currentLine;
        const blankLines = Math.max(1, Math.ceil(hint.length / 40)); // 根据提示长度确定行数
        
        // 添加空行作为填空区域
        for (let i = 0; i < blankLines; i++) {
          codeText += '\n';
          currentLine++;
        }
        
        // 稍后会重新计算精确的列位置
        this.fillAreas.push({
          startLineNumber: startLine,
          startColumn: 1,
          endLineNumber: currentLine - 1,
          endColumn: 1
        });
        
        blankIndex++;
      }
    });
    
    // 设置编辑器内容
    model.setValue(codeText);
    
    // 重新计算填空区域的精确位置
    setTimeout(() => {
      this.recalculateFillAreaBounds();
    }, 10);
  }

  /**
   * 将填空区域应用到现有代码
   */
  private applyFillAreasToExistingCode(): void {
    // 如果已有fillAreas配置，直接使用
    if (this.fillAreas.length > 0) {
      this.recalculateFillAreaBounds();
    }
  }

  /**
   * 重新计算填空区域边界
   */
  private recalculateFillAreaBounds(): void {
    const model = this.editor.getModel();
    if (!model) return;
    
    // 更新每个填空区域的endColumn
    this.fillAreas = this.fillAreas.map(area => ({
      ...area,
      endColumn: model.getLineMaxColumn(area.endLineNumber)
    }));
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 光标位置变化
    this.registerDisposable(
      this.editor.onDidChangeCursorPosition((e) => {
        if (this.isInitializing) return;
        
        const position = e.position;
        
        // 检查是否在可编辑区域
        if (!this.isPositionEditable(position)) {
          this.handleInvalidPosition(position);
        } else {
          this.updateActiveFillArea(position);
        }
      })
    );

    // 键盘输入控制
    this.registerDisposable(
      this.editor.onKeyDown((e) => {
        if (this.isInitializing) return;
        
        const position = this.editor.getPosition();
        if (!position) return;
        
        this.handleKeyDown(e, position);
      })
    );

    // 内容变化监听
    this.registerDisposable(
      this.editor.onDidChangeModelContent((e) => {
        if (this.isInitializing) return;
        
        this.handleContentChange(e);
      })
    );

    // 输入法处理
    this.setupIMEHandling();
  }

  /**
   * 处理无效位置（只读区域）
   */
  private handleInvalidPosition(position: monaco.IPosition): void {
    const nearestAreaIndex = this.findNearestEditableArea(position);
    
    if (nearestAreaIndex !== -1) {
      const area = this.fillAreas[nearestAreaIndex];
      
      // 移动光标到最近的可编辑区域
      setTimeout(() => {
        this.editor.setPosition({
          lineNumber: area.startLineNumber,
          column: area.startColumn
        });
        this.editor.focus();
      }, 10);
      
      this.showTemporaryHighlight(area, 'highlight-editable');
      this.setOutput('# 已移动到最近的可编辑区域（绿色背景）');
    }
  }

  /**
   * 更新当前活动的填空区域
   */
  private updateActiveFillArea(position: monaco.IPosition): void {
    const areaIndex = this.getContainingAreaIndex(position);
    
    if (areaIndex !== -1 && areaIndex !== this.activeFillAreaIndex) {
      this.activeFillAreaIndex = areaIndex;
      this.highlightCurrentFillArea();
      this.showCurrentAreaHint();
    }
  }

  /**
   * 处理键盘输入
   */
  private handleKeyDown(e: monaco.IKeyboardEvent, position: monaco.IPosition): void {
    const isEditable = this.isPositionEditable(position);
    
    // 在只读区域阻止所有修改操作
    if (!isEditable && this.isModificationKey(e.keyCode)) {
      e.preventDefault();
      e.stopPropagation();
      
      this.showReadOnlyWarning(position);
      return;
    }
    
    // 处理边界操作
    if (isEditable) {
      this.handleEditableBoundaryKeys(e, position);
    }
  }

     /**
    * 处理内容变化
    */
   private handleContentChange(e: monaco.editor.IModelContentChangedEvent): void {
    // 检查变化是否在可编辑区域内
    for (const change of e.changes) {
      if (!this.isRangeEditable(change.range)) {
        // 在只读区域的变化，需要恢复
        this.revertInvalidChanges();
        return;
      }
    }
    
    // 内容变化后重新应用样式
    this.applyEditableStyles();
    
    // 如果是换行操作，可能需要扩展可编辑区域
    this.handleNewLineExpansion(e);
  }

     /**
    * 处理换行扩展可编辑区域
    */
   private handleNewLineExpansion(e: monaco.editor.IModelContentChangedEvent): void {
    const model = this.editor.getModel();
    if (!model) return;
    
    for (const change of e.changes) {
      // 检查是否是换行操作
      if (change.text.includes('\n')) {
        const position = { lineNumber: change.range.startLineNumber, column: change.range.startColumn };
        const areaIndex = this.getContainingAreaIndex(position);
        
        if (areaIndex !== -1) {
          // 扩展对应的填空区域
          const area = this.fillAreas[areaIndex];
          const newLineCount = (change.text.match(/\n/g) || []).length;
          
          this.fillAreas[areaIndex] = {
            ...area,
            endLineNumber: area.endLineNumber + newLineCount,
            endColumn: model.getLineMaxColumn(area.endLineNumber + newLineCount)
          };
          
          // 重新应用样式
          setTimeout(() => {
            this.applyEditableStyles();
          }, 10);
        }
      }
    }
  }

  /**
   * 设置输入法处理
   */
  private setupIMEHandling(): void {
    const domNode = this.editor.getDomNode();
    if (!domNode) return;
    
    const handleCompositionStart = () => {
      const position = this.editor.getPosition();
      if (!position || !this.isPositionEditable(position)) {
        const nearestIndex = this.findNearestEditableArea(position!);
        if (nearestIndex !== -1) {
          const area = this.fillAreas[nearestIndex];
          this.editor.setPosition({
            lineNumber: area.startLineNumber,
            column: area.startColumn
          });
        }
      }
    };
    
    domNode.addEventListener('compositionstart', handleCompositionStart);
    
    this.registerDisposable({
      dispose: () => {
        domNode.removeEventListener('compositionstart', handleCompositionStart);
      }
    });
  }

  /**
   * 判断位置是否可编辑
   */
  private isPositionEditable(position: monaco.IPosition): boolean {
    return this.fillAreas.some(area => 
      position.lineNumber >= area.startLineNumber &&
      position.lineNumber <= area.endLineNumber &&
      (area.startLineNumber !== area.endLineNumber || 
       (position.column >= area.startColumn && position.column <= area.endColumn))
    );
  }

  /**
   * 判断范围是否可编辑
   */
  private isRangeEditable(range: monaco.IRange): boolean {
    return this.fillAreas.some(area =>
      range.startLineNumber >= area.startLineNumber &&
      range.endLineNumber <= area.endLineNumber
    );
  }

  /**
   * 判断是否为修改键
   */
  private isModificationKey(keyCode: monaco.KeyCode): boolean {
    return [
      monaco.KeyCode.Backspace, monaco.KeyCode.Delete, monaco.KeyCode.Enter,
      monaco.KeyCode.Tab, monaco.KeyCode.Space
    ].includes(keyCode) || 
    (keyCode >= monaco.KeyCode.Digit0 && keyCode <= monaco.KeyCode.KeyZ) ||
    [
      monaco.KeyCode.Semicolon, monaco.KeyCode.Equal, monaco.KeyCode.Comma,
      monaco.KeyCode.Minus, monaco.KeyCode.Period, monaco.KeyCode.Slash,
      monaco.KeyCode.Backquote, monaco.KeyCode.BracketLeft,
      monaco.KeyCode.Backslash, monaco.KeyCode.BracketRight, monaco.KeyCode.Quote
    ].includes(keyCode);
  }

  /**
   * 处理可编辑区域边界按键
   */
  private handleEditableBoundaryKeys(e: monaco.IKeyboardEvent, position: monaco.IPosition): void {
    const areaIndex = this.getContainingAreaIndex(position);
    if (areaIndex === -1) return;
    
    const area = this.fillAreas[areaIndex];
    
    // 防止在区域开头删除（会影响到只读区域）
    if (e.keyCode === monaco.KeyCode.Backspace &&
        position.lineNumber === area.startLineNumber &&
        position.column === area.startColumn) {
      e.preventDefault();
      this.setOutput('# 已到达可编辑区域开始位置');
    }
    
    // 防止在区域结尾删除（会影响到只读区域）
    if (e.keyCode === monaco.KeyCode.Delete &&
        position.lineNumber === area.endLineNumber &&
        position.column === area.endColumn) {
      e.preventDefault();
      this.setOutput('# 已到达可编辑区域结束位置');
    }
  }

  /**
   * 显示只读区域警告
   */
  private showReadOnlyWarning(position: monaco.IPosition): void {
    this.showTemporaryHighlight({ 
      startLineNumber: position.lineNumber, 
      startColumn: 1, 
      endLineNumber: position.lineNumber, 
      endColumn: this.editor.getModel()?.getLineMaxColumn(position.lineNumber) || 1 
    }, 'highlight-readonly');
    
    this.setOutput('# 当前位置是只读区域，请移至绿色可编辑区域');
    
    // 高亮最近的可编辑区域
    const nearestIndex = this.findNearestEditableArea(position);
    if (nearestIndex !== -1) {
      this.showTemporaryHighlight(this.fillAreas[nearestIndex], 'highlight-editable');
    }
  }

  /**
   * 恢复无效更改
   */
  private revertInvalidChanges(): void {
    // 简单处理：撤销上一个操作
    this.editor.trigger('fillMode', 'undo', null);
    this.setOutput('# 检测到在只读区域的修改，已自动撤销');
    
    setTimeout(() => {
      this.applyEditableStyles();
    }, 10);
  }

  /**
   * 应用可编辑样式
   */
  private applyEditableStyles(): void {
    const model = this.editor.getModel();
    if (!model) return;
    
    const decorations: monaco.editor.IModelDeltaDecoration[] = [];
    const totalLines = model.getLineCount();
    
    // 标记所有行为只读
    for (let lineNumber = 1; lineNumber <= totalLines; lineNumber++) {
      let isEditable = false;
      
      // 检查是否在可编辑区域内
      for (const area of this.fillAreas) {
        if (lineNumber >= area.startLineNumber && lineNumber <= area.endLineNumber) {
          isEditable = true;
          break;
        }
      }
      
      decorations.push({
        range: new monaco.Range(lineNumber, 1, lineNumber, model.getLineMaxColumn(lineNumber)),
        options: {
          isWholeLine: true,
          className: isEditable ? 'editable-area' : 'readonly-area',
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
        }
      });
    }
    
    this.readOnlyDecorations = this.editor.deltaDecorations(this.readOnlyDecorations, decorations);
  }

  /**
   * 高亮当前填空区域
   */
  private highlightCurrentFillArea(): void {
    this.highlightDecorations = this.editor.deltaDecorations(this.highlightDecorations, []);
    
    if (this.activeFillAreaIndex >= 0 && this.activeFillAreaIndex < this.fillAreas.length) {
      const area = this.fillAreas[this.activeFillAreaIndex];
      const model = this.editor.getModel();
      if (!model) return;
      
      const decorations: monaco.editor.IModelDeltaDecoration[] = [];
      
      for (let lineNumber = area.startLineNumber; lineNumber <= area.endLineNumber; lineNumber++) {
        decorations.push({
          range: new monaco.Range(lineNumber, 1, lineNumber, model.getLineMaxColumn(lineNumber)),
          options: {
            isWholeLine: true,
            className: 'current-fill-area',
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
          }
        });
      }
      
      this.highlightDecorations = this.editor.deltaDecorations(this.highlightDecorations, decorations);
    }
  }

  /**
   * 显示临时高亮
   */
  private showTemporaryHighlight(area: { startLineNumber: number; endLineNumber: number; startColumn?: number; endColumn?: number }, className: string): void {
    const model = this.editor.getModel();
    if (!model) return;
    
    const decorations: monaco.editor.IModelDeltaDecoration[] = [];
    
    for (let lineNumber = area.startLineNumber; lineNumber <= area.endLineNumber; lineNumber++) {
      decorations.push({
        range: new monaco.Range(lineNumber, 1, lineNumber, model.getLineMaxColumn(lineNumber)),
        options: {
          isWholeLine: true,
          className: className
        }
      });
    }
    
    const decorationIds = this.editor.deltaDecorations([], decorations);
    
    setTimeout(() => {
      this.editor.deltaDecorations(decorationIds, []);
    }, 2000);
  }

  /**
   * 显示初始提示
   */
  private showInitialHints(): void {
    if (this.fillAreas.length > 0) {
      this.setOutput(`# 填空模式激活
# - 绿色区域可编辑，灰色区域只读
# - 共 ${this.fillAreas.length} 个填空区域
# - 在可编辑区域按回车可扩展编辑空间
# - 完成后点击运行查看结果`);
      
      // 设置光标到第一个填空区域
      const firstArea = this.fillAreas[0];
      this.editor.setPosition({
        lineNumber: firstArea.startLineNumber,
        column: firstArea.startColumn
      });
      this.editor.focus();
    }
  }

  /**
   * 显示当前区域提示
   */
  private showCurrentAreaHint(): void {
    const hint = this.fillAreasHints[this.activeFillAreaIndex];
    if (hint) {
      this.setOutput(`# 填空 ${this.activeFillAreaIndex + 1}/${this.fillAreas.length}: ${hint}`);
    }
  }

  /**
   * 获取包含指定位置的填空区域索引
   */
  private getContainingAreaIndex(position: monaco.IPosition): number {
    for (let i = 0; i < this.fillAreas.length; i++) {
      const area = this.fillAreas[i];
      if (position.lineNumber >= area.startLineNumber && position.lineNumber <= area.endLineNumber) {
        return i;
      }
    }
    return -1;
  }

  /**
   * 查找最近的可编辑区域
   */
  private findNearestEditableArea(position: monaco.IPosition): number {
    if (this.fillAreas.length === 0) return -1;
    
    let nearestIndex = -1;
    let minDistance = Number.MAX_SAFE_INTEGER;
    
    for (let i = 0; i < this.fillAreas.length; i++) {
      const area = this.fillAreas[i];
      const distance = Math.abs(position.lineNumber - area.startLineNumber);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }
    
    return nearestIndex;
  }

  /**
   * 验证代码
   */
  public validate(code: string, expectedOutput?: string): boolean {
    if (!expectedOutput) return true;
    return compareOutputs(code, expectedOutput);
  }
} 