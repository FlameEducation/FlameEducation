import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SceneConfig, SceneInfo } from '@/api/sceneConfig';
import { Copy, Edit, Lock, Trash2 } from 'lucide-react';

interface SimplifiedPromptEditorPanelProps {
  mode: 'empty' | 'view';
  currentScene?: SceneInfo;
  selectedPrompt?: SceneConfig;
  onStartEdit: () => void;
  onDeletePrompt: () => void;
  onCopyPrompt: (content: string) => void;
  loading: boolean;
}

const PromptEditorPanel: React.FC<SimplifiedPromptEditorPanelProps> = ({
  mode,
  currentScene,
  selectedPrompt,
  onStartEdit,
  onDeletePrompt,
  onCopyPrompt,
  loading,
}) => {
  if (mode === 'empty' || !selectedPrompt) {
    return (
      <Card className="flex h-full items-center justify-center border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <div>
          <p className="text-sm text-slate-600 font-medium">请选择一个提示词查看详情</p>
          <p className="mt-1 text-xs text-slate-500">或点击左侧"添加提示词"按钮创建新的提示词</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col border border-slate-200 bg-white h-full">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
        {/* 头部 */}
        <header className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-slate-900 truncate">{selectedPrompt.promptName || '默认提示词'}</h3>
              {selectedPrompt.isSystemTemplate && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  <Lock className="h-3 w-3 mr-1" />
                  系统模板
                </Badge>
              )}
              {selectedPrompt.isEnabled ? (
                <Badge variant="default" className="bg-green-100 text-green-700">已启用</Badge>
              ) : (
                <Badge variant="secondary" className="bg-slate-100 text-slate-600">已禁用</Badge>
              )}
            </div>
            <p className="text-sm text-slate-600">场景：{currentScene?.sceneName || '未知场景'}</p>
          </div>
          <div className="flex gap-2">
            {!selectedPrompt.isSystemTemplate && (
              <>
                <Button variant="outline" size="sm" onClick={onStartEdit} disabled={loading}>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑
                </Button>
                <Button variant="outline" size="sm" onClick={onDeletePrompt} disabled={loading} className="text-red-600 border-red-200 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除
                </Button>
              </>
            )}
          </div>
        </header>

        {/* 配置信息 */}
        <div className="grid gap-4 sm:grid-cols-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">AI模型</p>
            <p className="text-sm text-slate-900 font-mono">{selectedPrompt.aiModelName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">服务提供商</p>
            <p className="text-sm text-slate-900 font-mono">{selectedPrompt.aiServiceProvider}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">JSON格式化</p>
            <p className="text-sm text-slate-900 font-mono">{(selectedPrompt as any).isJsonFormat ? '是' : '否'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">思考模式</p>
            <p className="text-sm text-slate-900 font-mono">{(selectedPrompt as any).enableThinking ? '是' : '否'}</p>
          </div>
        </div>

        {/* 提示词内容 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-900">提示词内容</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopyPrompt(selectedPrompt.promptContent || '')}
            >
              <Copy className="h-4 w-4 mr-2" />
              复制内容
            </Button>
          </div>
          <div className="relative rounded-lg border border-slate-200 bg-slate-50 p-4">
            <pre className="whitespace-pre-wrap break-words text-sm text-slate-700 font-mono max-h-[500px] overflow-y-auto">
              {selectedPrompt.promptContent || '无内容'}
            </pre>
          </div>
        </div>
      </div>
      </div>
    </Card>
  );
};

export default PromptEditorPanel;
