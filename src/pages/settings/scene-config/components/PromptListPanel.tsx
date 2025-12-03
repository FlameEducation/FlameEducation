import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SceneConfig } from '@/api/sceneConfig';

interface PromptListPanelProps {
  prompts: SceneConfig[];
  selectedPromptUuid: string | null;
  onSelectPrompt: (uuid: string) => void;
  onCreatePrompt: () => void;
  loading: boolean;
  disableCreate: boolean;
  isCreating: boolean;
}

const PromptListPanel: React.FC<PromptListPanelProps> = ({
  prompts,
  selectedPromptUuid,
  onSelectPrompt,
  onCreatePrompt,
  loading,
  disableCreate,
  isCreating,
}) => {
  const renderContent = () => {
    if (loading) {
      return <div className="py-8 text-center text-xs text-slate-500">加载中...</div>;
    }
    if (prompts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="text-sm font-medium text-slate-600">该场景暂未创建提示词</div>
          <p className="max-w-[240px] text-xs text-slate-500">点击下方按钮即可新建 Prompt 模板，为业务场景提供统一的提示词内容。</p>
          <Button size="sm" onClick={onCreatePrompt} disabled={disableCreate}>
            <Plus className="mr-2 h-4 w-4" /> 创建提示词
          </Button>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {prompts.map(prompt => (
          <button
            key={prompt.sceneUuid}
            onClick={() => onSelectPrompt(prompt.sceneUuid)}
            className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-all ${
              selectedPromptUuid === prompt.sceneUuid
                ? 'border-slate-900 bg-slate-900/5 shadow'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-slate-900">{prompt.promptName || '默认提示词'}</div>
                <div className="mt-1 text-xs text-slate-500">{prompt.aiModelName}</div>
                <div className="text-xs text-slate-400">{prompt.aiServiceProvider}</div>
                <div className="mt-1 flex gap-1">
                  {(prompt as any).isJsonFormat && (
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">JSON</span>
                  )}
                  {(prompt as any).enableThinking && (
                    <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">思考</span>
                  )}
                </div>
              </div>
              {prompt.isSystemTemplate ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">系统</span>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <Card className="flex h-full flex-col gap-4 border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">提示词列表</h3>
          <p className="text-xs text-slate-500">选择已有提示词查看或基于其创建副本</p>
        </div>
        <Button size="sm" onClick={onCreatePrompt} disabled={disableCreate || isCreating}>
          <Plus className="mr-2 h-4 w-4" /> 添加提示词
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">{renderContent()}</div>
    </Card>
  );
};

export default PromptListPanel;
