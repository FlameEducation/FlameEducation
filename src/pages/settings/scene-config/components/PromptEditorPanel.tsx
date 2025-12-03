import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AiProviderConfig } from '@/api/ai-provider';
import { CreateScenePromptRequest, SceneConfig, SceneInfo, UpdateScenePromptRequest } from '@/api/sceneConfig';
import { PromptPlaceholder, PromptPlaceholderCategory } from '../placeholders';
import { Copy, Edit, Lock, Plus, Power, Trash2, X } from 'lucide-react';

interface PromptEditorPanelProps {
  mode: 'empty' | 'create' | 'view' | 'edit';
  currentScene?: SceneInfo;
  selectedPrompt?: SceneConfig;
  newPrompt: CreateScenePromptRequest;
  onNewPromptChange: (changes: Partial<CreateScenePromptRequest>) => void;
  editingData: UpdateScenePromptRequest;
  onEditingDataChange: (changes: Partial<UpdateScenePromptRequest>) => void;
  availableProviders: AiProviderConfig[];
  showPlaceholders: boolean;
  onTogglePlaceholders: () => void;
  placeholders: PromptPlaceholder[];
  selectedCategory: string;
  onCategoryChange: (value: PromptPlaceholderCategory | 'all') => void;
  onInsertPlaceholder: (target: 'new' | 'edit', placeholder: string) => void;
  onCancelCreate: () => void;
  onSubmitCreate: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDeletePrompt: () => void;
  onCopyPrompt: (content: string) => void;
  loading: boolean;
  newPromptRef: React.RefObject<HTMLTextAreaElement>;
  editPromptRef: React.RefObject<HTMLTextAreaElement>;
}

const PromptEditorPanel: React.FC<PromptEditorPanelProps> = ({
  mode,
  currentScene,
  selectedPrompt,
  newPrompt,
  onNewPromptChange,
  editingData,
  onEditingDataChange,
  availableProviders,
  showPlaceholders,
  onTogglePlaceholders,
  placeholders,
  selectedCategory,
  onCategoryChange,
  onInsertPlaceholder,
  onCancelCreate,
  onSubmitCreate,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDeletePrompt,
  onCopyPrompt,
  loading,
  newPromptRef,
  editPromptRef,
}) => {
  if (mode === 'empty') {
    return (
      <Card className="flex h-full items-center justify-center border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        请选择中间的提示词，或在左侧创建新的提示词
      </Card>
    );
  }

  if (mode === 'create') {
    return (
      <Card className="border border-slate-200 bg-white p-6">
        <div className="space-y-5">
          <header>
            <h3 className="text-lg font-semibold text-slate-900">新建提示词</h3>
            <p className="mt-1 text-sm text-slate-500">
              为 {currentScene?.sceneName || '当前场景'} 添加新的 Prompt 模板，配置模型与服务商后即可使用。
            </p>
          </header>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prompt-name">提示词名称</Label>
              <Input
                id="prompt-name"
                value={newPrompt.promptName || ''}
                onChange={event => onNewPromptChange({ promptName: event.target.value })}
                placeholder="例如：默认提示词或特殊老师"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt-model">AI 模型 *</Label>
              <Input
                id="prompt-model"
                value={newPrompt.aiModelName}
                onChange={event => onNewPromptChange({ aiModelName: event.target.value })}
                placeholder="例如：gemini-1.5-pro"
              />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-2">
              <Label>服务提供商 *</Label>
              <Select
                value={newPrompt.aiServiceProvider || ''}
                onValueChange={value => onNewPromptChange({ aiServiceProvider: value })}
                disabled={availableProviders.length === 0 || loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={sceneProviders.length === 0 ? '请先启用服务商' : '选择服务商'} />
                </SelectTrigger>
                <SelectContent>
                  {availableProviders.map(provider => (
                    <SelectItem key={provider.uuid} value={provider.provider}>
                      {provider.displayName || provider.modelName}（{provider.providerName}）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>启用状态</Label>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className={`flex h-2.5 w-2.5 items-center justify-center rounded-full ${newPrompt.isEnabled === false ? 'bg-slate-300' : 'bg-green-500'}`} />
                {newPrompt.isEnabled === false ? '创建后默认禁用' : '创建后默认启用'}
              </div>
            </div>
          </div>

          <PromptPlaceholderPanel
            showPlaceholders={showPlaceholders}
            onToggle={onTogglePlaceholders}
            placeholders={placeholders}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            onSelect={placeholder => onInsertPlaceholder('new', placeholder)}
            textarea={
              <Textarea
                ref={newPromptRef}
                value={newPrompt.promptContent}
                onChange={event => onNewPromptChange({ promptContent: event.target.value })}
                placeholder="输入 Prompt 内容"
                className="min-h-[280px] flex-1 resize-none font-mono text-sm"
              />
            }
            footer={<div className="text-xs text-slate-500">{newPrompt.promptContent.length} 字符</div>}
          />

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancelCreate}>
              <X className="mr-2 h-4 w-4" /> 取消
            </Button>
            <Button onClick={onSubmitCreate} disabled={availableProviders.length === 0 || loading}>
              <Plus className="mr-2 h-4 w-4" /> 创建
            </Button>
          </div>
          {availableProviders.length === 0 ? (
            <p className="text-xs text-red-500">请先启用至少一个服务商。</p>
          ) : null}
        </div>
      </Card>
    );
  }

  if (!selectedPrompt) {
    return (
      <Card className="flex h-full items-center justify-center border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        请选择中间的提示词进行操作
      </Card>
    );
  }

  const isSystemPrompt = selectedPrompt.isSystemTemplate;
  const isEnabled = mode === 'edit' ? editingData.isEnabled !== false : selectedPrompt.isEnabled;

  const renderViewHeader = () => (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-semibold text-slate-900">{selectedPrompt.promptName || '默认提示词'}</h3>
          {isSystemPrompt ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
              <Lock className="h-3 w-3" /> 系统固定
            </span>
          ) : null}
          {!isEnabled ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              已禁用
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-slate-500">{selectedPrompt.aiModelName} · {selectedPrompt.aiServiceProvider}</p>
      </div>
      {mode === 'view' && !isSystemPrompt ? (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onStartEdit}>
            <Edit className="mr-2 h-4 w-4" /> 编辑
          </Button>
          <Button variant="outline" size="sm" onClick={onDeletePrompt} className="border-red-200 text-red-600 hover:bg-red-50">
            <Trash2 className="mr-2 h-4 w-4" /> 删除
          </Button>
        </div>
      ) : null}
    </div>
  );

  if (mode === 'view') {
    return (
      <Card className="border border-slate-200 bg-white p-6">
        {renderViewHeader()}
        <div className="mt-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Power className={`h-4 w-4 ${isEnabled ? 'text-green-500' : 'text-slate-400'}`} />
              {isEnabled ? '已启用' : '已禁用'}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onCopyPrompt(selectedPrompt.promptContent)}>
                <Copy className="mr-2 h-4 w-4" /> 复制内容
              </Button>
            </div>
          </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">提示词内容</div>
              <pre className="mt-2 max-h-[420px] overflow-y-auto whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-800">
                {selectedPrompt.promptContent}
              </pre>
            </div>
          </div>
        </Card>
      );
  }

  return (
    <Card className="border border-slate-200 bg-white p-6">
      {renderViewHeader()}
      <div className="mt-6 space-y-5">
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-2">
            <Label>提示词名称</Label>
            <Input
              value={editingData.promptName || ''}
              onChange={event => onEditingDataChange({ promptName: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>AI 模型</Label>
            <Input
              value={editingData.aiModelName || ''}
              onChange={event => onEditingDataChange({ aiModelName: event.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>服务提供商</Label>
          <Select
            value={editingData.aiServiceProvider || ''}
            onValueChange={value => onEditingDataChange({ aiServiceProvider: value })}
            disabled={isSystemPrompt}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择服务商" />
            </SelectTrigger>
            <SelectContent>
              {availableProviders.map(provider => (
                <SelectItem key={provider.uuid} value={provider.provider}>
                  {provider.displayName || provider.modelName}（{provider.providerName}）
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <PromptPlaceholderPanel
          showPlaceholders={showPlaceholders}
          onToggle={onTogglePlaceholders}
          placeholders={placeholders}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          onSelect={placeholder => onInsertPlaceholder('edit', placeholder)}
          textarea={
            <Textarea
              ref={editPromptRef}
              value={editingData.promptContent || ''}
              onChange={event => onEditingDataChange({ promptContent: event.target.value })}
              className="min-h-[320px] flex-1 resize-none font-mono text-sm"
            />
          }
          footer={
            <div className="flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Power className={`h-4 w-4 ${editingData.isEnabled === false ? 'text-slate-400' : 'text-green-500'}`} />
                {editingData.isEnabled === false ? '禁用状态' : '启用状态'}
              </div>
              <span>{editingData.promptContent?.length || 0} 字符</span>
            </div>
          }
        />

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={onCancelEdit}>
            <X className="mr-2 h-4 w-4" /> 取消
          </Button>
          <Button onClick={onSaveEdit}>
            <Edit className="mr-2 h-4 w-4" /> 保存
          </Button>
        </div>
      </div>
    </Card>
  );
};

interface PromptPlaceholderPanelProps {
  showPlaceholders: boolean;
  onToggle: () => void;
  placeholders: PromptPlaceholder[];
  selectedCategory: string;
  onCategoryChange: (value: PromptPlaceholderCategory | 'all') => void;
  onSelect: (placeholder: string) => void;
  textarea: React.ReactNode;
  footer?: React.ReactNode;
}

const PromptPlaceholderPanel: React.FC<PromptPlaceholderPanelProps> = ({
  showPlaceholders,
  onToggle,
  placeholders,
  selectedCategory,
  onCategoryChange,
  onSelect,
  textarea,
  footer,
}) => {
  const categories: Array<{ value: PromptPlaceholderCategory | 'all'; label: string }> = [
    { value: 'all', label: '全部分类' },
    { value: 'lesson', label: '课时相关' },
    { value: 'user', label: '用户相关' },
    { value: 'tool', label: '工具相关' },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>提示词内容 *</Label>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          {showPlaceholders ? '隐藏占位符' : '显示占位符'}
        </Button>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">{textarea}</div>
        {showPlaceholders ? (
          <div className="w-64 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <Select value={selectedCategory} onValueChange={value => onCategoryChange(value as PromptPlaceholderCategory | 'all')}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="分类" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(item => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
              {placeholders.map(placeholder => (
                <button
                  key={placeholder.key}
                  onClick={() => onSelect(placeholder.key)}
                  className="w-full rounded border border-slate-200 bg-white px-2 py-2 text-left text-xs hover:border-slate-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">{placeholder.label}</span>
                    <Badge variant="outline" className="h-4 px-2 text-[10px]">{placeholder.category}</Badge>
                  </div>
                  <code className="mt-1 block text-[10px] text-purple-600">{placeholder.key}</code>
                  <p className="mt-1 text-[10px] text-slate-500">{placeholder.description}</p>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      {footer}
    </div>
  );
};

export default PromptEditorPanel;
