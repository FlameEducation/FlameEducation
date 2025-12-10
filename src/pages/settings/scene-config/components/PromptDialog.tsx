import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Lightbulb } from 'lucide-react';
import { AiProviderConfig } from '@/api/ai-provider';
import { CreateScenePromptRequest, UpdateScenePromptRequest } from '@/api/promptConfig';
import { PLACEHOLDERS, PromptPlaceholderCategory } from '../placeholders';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  title: string;
  data: CreateScenePromptRequest | UpdateScenePromptRequest;
  onDataChange: (changes: Partial<CreateScenePromptRequest | UpdateScenePromptRequest>) => void;
  onSubmit: () => Promise<void>;
  availableProviders: AiProviderConfig[];
  sceneName?: string;
}

const PromptDialog: React.FC<PromptDialogProps> = ({
  open,
  onOpenChange,
  mode,
  title,
  data,
  onDataChange,
  onSubmit,
  availableProviders,
  sceneName,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PromptPlaceholderCategory | 'all'>('all');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) {
      setShowPlaceholders(false);
      setSelectedCategory('all');
    }
  }, [open]);

  const filteredPlaceholders = selectedCategory === 'all'
    ? PLACEHOLDERS
    : PLACEHOLDERS.filter(item => item.category === selectedCategory);

  const selectedProviderConfig = availableProviders.find(p => p.providerName === data.aiServiceProvider);
  const availableModels = selectedProviderConfig?.models || [];

  const handleInsertPlaceholder = (placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const currentContent = data.promptContent || '';
    const start = textarea.selectionStart ?? currentContent.length;
    const end = textarea.selectionEnd ?? currentContent.length;
    const updated = `${currentContent.slice(0, start)}${placeholder}${currentContent.slice(end)}`;
    
    onDataChange({ promptContent: updated });
    
    window.requestAnimationFrame(() => {
      textarea.focus();
      const caret = start + placeholder.length;
      textarea.setSelectionRange(caret, caret);
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit();
      onOpenChange(false);
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg">{title}</DialogTitle>
          {sceneName && <p className="text-xs text-slate-600">场景：{sceneName}</p>}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <div className="grid gap-4 py-3">
          <div className="grid gap-2">
            <Label htmlFor="promptName" className="text-sm">提示词名称</Label>
            <Input
              id="promptName"
              value={data.promptName || ''}
              onChange={e => onDataChange({ promptName: e.target.value })}
              placeholder="为提示词起一个名称"
              className="h-9"
            />
          </div>

          {!(data as any).isSystemTemplate && (
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="promptContent" className="text-sm">提示词内容 <span className="text-red-500">*</span></Label>
              <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowPlaceholders(!showPlaceholders)}
                >
                  <Lightbulb className="mr-1 h-3 w-3" />
                  {showPlaceholders ? '隐藏' : '显示'}占位符
                </Button>
            </div>
            
            {showPlaceholders && (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as PromptPlaceholderCategory | 'all')}>
                  <TabsList className="h-8 mb-2">
                    <TabsTrigger value="all" className="text-xs px-2">全部</TabsTrigger>
                    <TabsTrigger value="user" className="text-xs px-2">用户</TabsTrigger>
                    <TabsTrigger value="course" className="text-xs px-2">课程</TabsTrigger>
                    <TabsTrigger value="lesson" className="text-xs px-2">课节</TabsTrigger>
                    <TabsTrigger value="tool" className="text-xs px-2">工具</TabsTrigger>
                  </TabsList>
                  <TabsContent value={selectedCategory} className="mt-0">
                    <div className="grid grid-cols-2 gap-1.5 max-h-[150px] overflow-y-auto">
                      {filteredPlaceholders.map(item => (
                        <Button
                          key={item.key}
                          variant="outline"
                          size="sm"
                          className="justify-start text-left h-auto py-1.5 text-xs"
                          onClick={() => handleInsertPlaceholder(item.key)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-xs text-blue-600 truncate">{item.key}</div>
                            <div className="text-xs text-slate-500 truncate">{item.description}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

              <Textarea
                ref={textareaRef}
                id="promptContent"
                value={data.promptContent || ''}
                onChange={e => onDataChange({ promptContent: e.target.value })}
                placeholder="输入提示词内容，可以使用上方的占位符"
                className="min-h-[200px] font-mono text-sm"
              />
          </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="aiServiceProvider" className="text-sm">服务提供商 <span className="text-red-500">*</span></Label>
              <Select
                value={data.aiServiceProvider || ''}
                onValueChange={value => onDataChange({ aiServiceProvider: value, aiModelName: '' })}
              >
                <SelectTrigger id="aiServiceProvider" className="h-9">
                  <SelectValue placeholder="选择服务提供商" />
                </SelectTrigger>
                <SelectContent>
                  {availableProviders.map(provider => (
                    <SelectItem key={provider.providerName} value={provider.providerName}>
                      {provider.providerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="aiModelName" className="text-sm">AI模型名称 <span className="text-red-500">*</span></Label>
              {availableModels.length > 0 ? (
                <Select
                  value={data.aiModelName || ''}
                  onValueChange={value => onDataChange({ aiModelName: value })}
                >
                  <SelectTrigger id="aiModelName" className="h-9">
                    <SelectValue placeholder="选择模型" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map(model => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="aiModelName"
                  value={data.aiModelName || ''}
                  onChange={e => onDataChange({ aiModelName: e.target.value })}
                  placeholder="例如: gemini-2.0-flash-exp"
                  className="h-9 text-sm"
                />
              )}
            </div>
          </div>

          {availableProviders.length === 0 && (
            <p className="text-xs text-amber-600">当前场景暂无可用服务商，请先在"服务商配置"页面添加</p>
          )}

          <div className="flex items-center justify-between rounded-md border border-slate-200 p-3">
            <div className="space-y-0.5">
              <Label htmlFor="isJsonFormat" className="text-sm">JSON格式化输出</Label>
              <p className="text-xs text-slate-500">强制模型以JSON格式输出</p>
            </div>
            <Switch
              id="isJsonFormat"
              checked={(data as any).isJsonFormat ?? false}
              onCheckedChange={checked => onDataChange({ isJsonFormat: checked } as any)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="thinkingStatus" className="text-sm">思考模式</Label>
              <Select
                value={String((data as any).thinkingStatus ?? -1)}
                onValueChange={value => onDataChange({ thinkingStatus: parseInt(value) } as any)}
              >
                <SelectTrigger id="thinkingStatus" className="h-9">
                  <SelectValue placeholder="选择思考模式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-1">默认</SelectItem>
                  <SelectItem value="0">关闭</SelectItem>
                  <SelectItem value="1">开启</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="messageLength" className="text-sm">消息长度限制</Label>
              <Input
                id="messageLength"
                type="number"
                value={(data as any).messageLength ?? 10}
                onChange={e => onDataChange({ messageLength: parseInt(e.target.value) } as any)}
                placeholder="例如: 10"
                className="h-9 text-sm"
              />
            </div>
          </div>

          {'isEnabled' in data && (
            <div className="flex items-center justify-between rounded-md border border-slate-200 p-3">
              <div className="space-y-0.5">
                <Label htmlFor="isEnabled" className="text-sm">启用状态</Label>
                <p className="text-xs text-slate-500">是否启用该提示词模板</p>
              </div>
              <Switch
                id="isEnabled"
                checked={data.isEnabled ?? true}
                onCheckedChange={checked => onDataChange({ isEnabled: checked })}
              />
            </div>
          )}
        </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={submitting}>
            取消
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? '创建' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PromptDialog;
