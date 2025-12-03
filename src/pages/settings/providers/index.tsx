import React, { useEffect, useState } from 'react';
import SettingsLayout from '../components/SettingsLayout';
import ProviderListItem from './components/ProviderCard';
import MultiStepProviderDialog, { PROVIDER_OPTIONS } from './components/MultiStepProviderDialog';
import { listAiProviders, updateAiProviderConfig, createAiProviderConfig, deleteAiProviderConfig, AiProviderConfig, CreateAiProviderConfigRequest } from '@/api/ai-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Plus, RefreshCw, PackagePlus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const ProvidersSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<AiProviderConfig[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingProvider, setEditingProvider] = useState<AiProviderConfig | undefined>(undefined);

  const loadData = async () => {
    try {
      setLoading(true);
      const providerList = await listAiProviders();
      setProviders(providerList);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateDialog = () => {
    setDialogMode('create');
    setEditingProvider(undefined);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (provider: AiProviderConfig) => {
    setDialogMode('edit');
    setEditingProvider(provider);
    setDialogOpen(true);
  };

  const handleSave = async (data: CreateAiProviderConfigRequest) => {
    try {
      if (dialogMode === 'edit' && editingProvider) {
        await updateAiProviderConfig(editingProvider.providerName, data);
        toast.success('更新成功');
      } else {
        await createAiProviderConfig(data);
        toast.success('添加成功');
      }
      await loadData();
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败');
      throw error;
    }
  };

  const handleDelete = async (providerName: string) => {
    if (!window.confirm('确认删除该服务商配置？')) {
      return;
    }
    try {
      await deleteAiProviderConfig(providerName);
      toast.success('删除成功');
      await loadData();
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败');
    }
  };

  const supportedProviderCodes = PROVIDER_OPTIONS.map(p => p.code);
  const configuredProviderCodes = providers.map(p => p.providerName);
  const showAddButton = supportedProviderCodes.some(code => !configuredProviderCodes.includes(code));

  return (
    <SettingsLayout
      title="文本生成配置"
      description="管理文本生成服务商配置，支持添加、编辑和删除服务商。"
    >

      <Alert className='mb-8'>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>关于文本生成配置</AlertTitle>
        <AlertDescription>
          用于系统中的各类文本生成任务。 请确保所配置的服务商和模型可用。
        </AlertDescription>
      </Alert>

      <div className="space-y-8">
        {loading ? (
          <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map(provider => (
              <ProviderListItem
                key={provider.providerName}
                provider={provider}
                onEdit={handleOpenEditDialog}
                onDelete={handleDelete}
              />
            ))}

            {showAddButton && (
              <button
                onClick={handleOpenCreateDialog}
                className="group relative flex h-full min-h-[200px] flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 transition-all hover:border-blue-500 hover:bg-blue-50/50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition-all group-hover:scale-110 group-hover:ring-blue-200">
                  <Plus className="h-6 w-6 text-slate-400 group-hover:text-blue-600" />
                </div>
                <span className="font-medium text-slate-600 group-hover:text-blue-700">添加新配置</span>
              </button>
            )}
          </div>
        )}
      </div>

      <MultiStepProviderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        editingProvider={editingProvider}
        onSave={handleSave}
        existingProviders={providers}
      />
    </SettingsLayout>
  );
};

export default ProvidersSettingsPage;

