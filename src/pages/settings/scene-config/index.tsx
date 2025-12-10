import React, { useEffect, useMemo, useState } from 'react';
import SettingsLayout from '../components/SettingsLayout';
import SceneSidebar from './components/SceneSidebar';
import PromptListPanel from './components/PromptListPanel';
import PromptEditorPanel from './components/PromptEditorPanelSimple';
import PromptDialog from './components/PromptDialog';
import {
  getAllScenes,
  getScenePrompts,
  createScenePrompt,
  updateScenePrompt,
  deleteScenePrompt,
  SceneInfo,
  SceneConfig,
  SceneType,
  CreateScenePromptRequest,
  UpdateScenePromptRequest,
} from '@/api/promptConfig';
import { listAiProviders, AiProviderConfig } from '@/api/ai-provider';
import { toast } from 'sonner';

const SceneConfigPage: React.FC = () => {
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [scenes, setScenes] = useState<SceneInfo[]>([]);
  const [currentSceneType, setCurrentSceneType] = useState<SceneType>('CHAT');
  const [prompts, setPrompts] = useState<SceneConfig[]>([]);
  const [selectedPromptUuid, setSelectedPromptUuid] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [newPrompt, setNewPrompt] = useState<CreateScenePromptRequest>({
    promptName: '',
    promptContent: '',
    aiModelName: '',
    aiServiceProvider: '',
    isJsonFormat: false,
    thinkingStatus: -1,
    messageLength: 10,
    isEnabled: true,
  });
  const [editingData, setEditingData] = useState<UpdateScenePromptRequest>({ sceneUuid: '' });
  const [providerConfigs, setProviderConfigs] = useState<AiProviderConfig[]>([]);

  const currentScene = useMemo(
    () => scenes.find(item => item.sceneType === currentSceneType),
    [scenes, currentSceneType]
  );

  const selectedPrompt = useMemo(
    () => prompts.find(item => item.sceneUuid === selectedPromptUuid),
    [prompts, selectedPromptUuid]
  );

  const activeProviders = useMemo(() => {
    // 所有场景（文本生成、小黑板、绘图提示词优化）本质上都是文本生成，复用聊天(CHAT)的供应商模型
    return providerConfigs;
  }, [providerConfigs]);

  const providerOptions = useMemo(() => {
    return activeProviders;
  }, [activeProviders]);

  const loadScenes = async () => {
    try {
      const data = await getAllScenes();
      setScenes(data);
      if (data.length > 0) {
        setCurrentSceneType(data[0].sceneType as SceneType);
      }
    } catch (error) {
      console.error('加载场景定义失败:', error);
      toast.error('加载场景定义失败');
    }
  };

  const loadPrompts = async (sceneType: SceneType) => {
    try {
      setLoadingPrompts(true);
      setSelectedPromptUuid(null);
      const data = await getScenePrompts(sceneType);
      setPrompts(data);
    } catch (error) {
      console.error('加载提示词失败:', error);
      toast.error('加载提示词失败');
    } finally {
      setLoadingPrompts(false);
    }
  };

  const loadProviders = async () => {
    try {
      setLoadingProviders(true);
      const data = await listAiProviders();
      setProviderConfigs(data);
    } catch (error) {
      console.error('加载服务商失败:', error);
      toast.error('加载服务商失败');
    } finally {
      setLoadingProviders(false);
    }
  };

  useEffect(() => {
    loadScenes();
    loadProviders();
  }, []);

  useEffect(() => {
    if (currentSceneType) {
      loadPrompts(currentSceneType);
    }
  }, [currentSceneType]);

  const handleSelectPrompt = (sceneUuid: string) => {
    setSelectedPromptUuid(sceneUuid);
  };

  const handleOpenCreateDialog = (initial?: Partial<CreateScenePromptRequest>) => {
    setDialogMode('create');
    setNewPrompt({
      promptName: initial?.promptName || '',
      promptContent: initial?.promptContent || '',
      aiModelName: initial?.aiModelName || '',
      aiServiceProvider: initial?.aiServiceProvider || '',
      isJsonFormat: initial?.isJsonFormat || false,
      thinkingStatus: initial?.thinkingStatus || -1,
      messageLength: initial?.messageLength || 10,
      isEnabled: initial?.isEnabled ?? true,
    });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = () => {
    if (!selectedPrompt) {
      return;
    }
    setDialogMode('edit');
    setEditingData(selectedPrompt);
    setDialogOpen(true);
  };

  const handleCopyPrompt = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('提示词内容已复制');
    } catch (error) {
      console.error('复制提示词失败:', error);
      toast.error('复制提示词失败');
    }
  };

  const handleSubmitCreate = async () => {
    if (!currentSceneType) {
      toast.error('请先选择场景');
      throw new Error('No scene selected');
    }
    if (!newPrompt.promptContent.trim()) {
      toast.error('请填写提示词内容');
      throw new Error('Prompt content is required');
    }
    if (!newPrompt.aiModelName.trim()) {
      toast.error('请填写AI模型名称');
      throw new Error('AI model name is required');
    }
    if (!newPrompt.aiServiceProvider) {
      toast.error('请选择服务提供商');
      throw new Error('Service provider is required');
    }
    
    const created = await createScenePrompt(currentSceneType, newPrompt);
    setPrompts(prev => [...prev, created]);
    setSelectedPromptUuid(created.sceneUuid);
    toast.success('提示词创建成功');
  };

  const handleSubmitEdit = async () => {
    if (!editingData.promptContent?.trim()) {
      toast.error('提示词内容不能为空');
      throw new Error('Prompt content is required');
    }
    
    const updated = await updateScenePrompt(editingData);
    setPrompts(prev => prev.map(item => (item.sceneUuid === updated.sceneUuid ? updated : item)));
    toast.success('提示词更新成功');
  };

  const handleDeletePrompt = async () => {
    if (!selectedPromptUuid) {
      return;
    }
    if (selectedPrompt?.isSystemTemplate) {
      toast.error('系统默认提示词不可删除');
      return;
    }
    if (!window.confirm('确认删除该提示词？')) {
      return;
    }
    try {
      setLoadingPrompts(true);
      await deleteScenePrompt(selectedPromptUuid);
      setPrompts(prev => prev.filter(item => item.sceneUuid !== selectedPromptUuid));
      setSelectedPromptUuid(null);
      toast.success('提示词已删除');
    } catch (error) {
      console.error('删除提示词失败:', error);
      toast.error('删除提示词失败');
    } finally {
      setLoadingPrompts(false);
    }
  };

  return (
    <SettingsLayout
      title="提示词配置"
      description="为各个场景维护 Prompt 模板，确保调用的服务商与模型配置一致。"
    >

      <div className="flex min-h-[calc(100vh-160px)] flex-col gap-4">
        <div className="flex flex-col md:flex-row flex-1 gap-4 overflow-y-auto md:overflow-hidden">

          <div className="w-full md:w-56 flex-shrink-0">
            <SceneSidebar
              scenes={scenes}
              currentSceneType={currentSceneType}
              onSceneChange={value => setCurrentSceneType(value)}
              sceneProviders={activeProviders}
              className="h-auto md:h-full"
            />
          </div>

          <div className="w-full md:w-72 flex-shrink-0">
            <PromptListPanel
              prompts={prompts}
              selectedPromptUuid={selectedPromptUuid}
              onSelectPrompt={handleSelectPrompt}
              onCreatePrompt={() => handleOpenCreateDialog()}
              loading={loadingPrompts}
              disableCreate={activeProviders.length === 0 || loadingProviders}
              isCreating={false}
              className="h-[400px] md:h-full"
            />
          </div>

          <div className="flex-1 min-w-0">
            <PromptEditorPanel
              mode={selectedPrompt ? 'view' : 'empty'}
              currentScene={currentScene}
              selectedPrompt={selectedPrompt || undefined}
              onStartEdit={handleOpenEditDialog}
              onDeletePrompt={handleDeletePrompt}
              onCopyPrompt={handleCopyPrompt}
              loading={loadingPrompts}
              className={`md:h-full ${selectedPrompt ? 'h-auto min-h-[500px]' : 'h-[200px]'}`}
            />
          </div>
        </div>
      </div>

      <PromptDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        title={dialogMode === 'create' ? '创建提示词' : '编辑提示词'}
        data={dialogMode === 'create' ? newPrompt : editingData}
        onDataChange={changes =>
          dialogMode === 'create'
            ? setNewPrompt(prev => ({ ...prev, ...changes }))
            : setEditingData(prev => ({ ...prev, ...changes }))
        }
        onSubmit={dialogMode === 'create' ? handleSubmitCreate : handleSubmitEdit}
        availableProviders={providerOptions}
        sceneName={currentScene?.sceneName}
      />
    </SettingsLayout>
  );
};

export default SceneConfigPage;
