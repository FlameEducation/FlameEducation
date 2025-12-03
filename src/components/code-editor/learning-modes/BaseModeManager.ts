import * as monaco from 'monaco-editor';
import { Monaco } from '@monaco-editor/react';
import { ModeManager, ModeManagerOptions } from './types.tsx';
import { configureEditorBasics, configurePythonLanguage, addRunCodeShortcut } from '../core/utils';

/**
 * 所有模式管理器的基类
 */
export abstract class BaseModeManager implements ModeManager {
  protected editor: monaco.editor.IStandaloneCodeEditor;
  protected monaco: Monaco;
  protected initialCode: string;
  protected setOutput: (output: string) => void;
  protected disposables: monaco.IDisposable[] = [];

  constructor(options: ModeManagerOptions) {
    this.editor = options.editor;
    this.monaco = options.monaco;
    this.initialCode = options.initialCode;
    this.setOutput = options.setOutput;
  }

  /**
   * 初始化编辑器基本功能
   */
  public initialize(): void {
    // 配置编辑器基本设置
    configureEditorBasics(this.editor);
    
    // 配置Python语言支持
    configurePythonLanguage(this.monaco);
    
    // 实现特定模式的初始化逻辑
    this.initializeMode();
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    // 释放所有注册的可释放资源
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    
    // 清理模式特定资源
    this.disposeMode();
  }

  /**
   * 注册可释放资源
   * @param disposable 可释放资源
   */
  protected registerDisposable(disposable: monaco.IDisposable): void {
    this.disposables.push(disposable);
  }

  /**
   * 模式特定初始化逻辑
   * 子类必须实现此方法
   */
  protected abstract initializeMode(): void;

  /**
   * 模式特定资源清理逻辑
   * 子类可以根据需要重写此方法
   */
  protected disposeMode(): void {
    // 默认实现不执行任何操作
  }

  /**
   * 运行代码验证
   * 子类可以根据需要重写此方法
   */
  public validate(code: string, expectedOutput?: string): boolean {
    // 默认实现总是返回true（不验证）
    return true;
  }
} 