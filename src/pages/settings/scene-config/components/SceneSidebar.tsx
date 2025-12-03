import React from 'react';
import { Card } from '@/components/ui/card';
import { SceneInfo, SceneType } from '@/api/sceneConfig';
import { AiProviderConfig } from '@/api/ai-provider';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SceneSidebarProps {
  scenes: SceneInfo[];
  currentSceneType: SceneType;
  onSceneChange: (sceneType: SceneType) => void;
  sceneProviders: AiProviderConfig[];
}

const SceneSidebar: React.FC<SceneSidebarProps> = ({ scenes, currentSceneType, onSceneChange, sceneProviders }) => {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col gap-4">
      <Card className="border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">场景列表</h2>
          <p className="mt-1 text-xs text-slate-500">选择需要维护的场景配置</p>
        </div>
        <div className="grid gap-2 px-5 py-4">
          {scenes.map(scene => (
            <button
              key={scene.sceneType}
              onClick={() => onSceneChange(scene.sceneType as SceneType)}
              className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                currentSceneType === scene.sceneType
                  ? 'bg-slate-900 text-white shadow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span className="truncate">{scene.sceneName}</span>
              <ArrowRight className={`h-4 w-4 ${currentSceneType === scene.sceneType ? 'opacity-90' : 'opacity-60'}`} />
            </button>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-3 border border-blue-100 bg-blue-50 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-blue-900">可用的模型服务商列表</h3>
        </div>
        {sceneProviders.length === 0 ? (
          <div className="rounded-lg bg-white/60 p-3 text-xs text-blue-800">
            当前场景尚未启用服务商，请前往服务商配置页面启用。
            <Button
              size="sm"
              variant="link"
              className="px-0 text-blue-700 hover:text-blue-900"
              onClick={() => navigate('/settings/providers')}
            >
              去启用服务商
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sceneProviders.map(provider => (
              <div key={provider.uuid} className="rounded-lg bg-white px-3 py-2 text-xs text-slate-700">
                <div className="font-semibold text-slate-900">{provider.displayName || provider.modelName}</div>
                <div className="text-slate-500">{provider.providerName} · {provider.modelName}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SceneSidebar;
