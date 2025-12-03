import React, { useEffect, useState, useRef } from 'react';
import SettingsLayout from '../components/SettingsLayout';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  listAsrProviders,
  createAsrProvider,
  updateAsrProvider,
  deleteAsrProvider,
  AsrProviderConfig,
  CreateAsrProviderConfig
} from '@/api/asr-config';
import { getAsrActiveConfig, updateAsrActiveConfig, AsrActiveConfig } from '@/api/asr-active-config';
import AsrProviderCard from './components/AsrProviderCard';
import AsrProviderDialog from './components/AsrProviderDialog';
import AsrTestDialog from './components/AsrTestDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AsrConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<AsrProviderConfig[]>([]);
  const [activeConfig, setActiveConfig] = useState<AsrActiveConfig | null>(null);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingProvider, setEditingProvider] = useState<AsrProviderConfig | undefined>(undefined);

  // Test state
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testingProvider, setTestingProvider] = useState<AsrProviderConfig | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [providersData, activeData] = await Promise.all([
        listAsrProviders(),
        getAsrActiveConfig()
      ]);
      setProviders(providersData);
      // @ts-ignore
      setActiveConfig(activeData);
    } catch (error) {
      console.error('Failed to load ASR configuration:', error);
      toast.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (providerName: string) => {
    try {
      await updateAsrActiveConfig({ activeProvider: providerName });
      toast.success('已切换生效配置');
      loadData();
    } catch (error) {
      console.error('Failed to set active provider:', error);
      toast.error('切换失败');
    }
  };

  const handleDelete = async (providerName: string) => {
    if (!confirm('确定要删除该配置吗？')) return;
    try {
      await deleteAsrProvider(providerName);
      toast.success('删除成功');
      loadData();
    } catch (error) {
      console.error('Failed to delete provider:', error);
      toast.error('删除失败');
    }
  };

  const handleEdit = (provider: AsrProviderConfig) => {
    setEditingProvider(provider);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleTest = (provider: AsrProviderConfig) => {
    setTestingProvider(provider);
    setTestDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingProvider(undefined);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleSaveProvider = async (data: CreateAsrProviderConfig) => {
    try {
      if (dialogMode === 'create') {
        await createAsrProvider(data);
        toast.success('创建成功');
      } else {
        await updateAsrProvider(data);
        toast.success('更新成功');
      }
      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to save provider:', error);
      toast.error('保存失败');
      throw error;
    }
  };

  const SUPPORTED_ASR_PROVIDERS = ['doubao', 'google'];
  const configuredProviderNames = providers.map(p => p.providerName);
  const showAddButton = SUPPORTED_ASR_PROVIDERS.some(p => !configuredProviderNames.includes(p));

  if (loading) {
    return (
      <SettingsLayout title="语音识别配置" description="配置语音识别服务商参数及生效模型。">
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="语音识别配置" description="配置语音识别服务商参数及生效模型。">
      <div className="space-y-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>关于音频格式</AlertTitle>
          <AlertDescription>
            Google Gemini 系列模型支持识别音频文件，可以通过非流式方式识别音频内容；其余服务商当前仅支持流式识别。
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <AsrProviderCard
              key={provider.providerName}
              provider={provider}
              isActive={activeConfig?.activeProvider === provider.providerName}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetActive={handleSetActive}
              onTest={handleTest}
            />
          ))}

          {showAddButton && (
            <button
              onClick={handleAdd}
              className="group relative flex h-full min-h-[200px] flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 transition-all hover:border-blue-500 hover:bg-blue-50/50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition-all group-hover:scale-110 group-hover:ring-blue-200">
                <Plus className="h-6 w-6 text-slate-400 group-hover:text-blue-600" />
              </div>
              <span className="font-medium text-slate-600 group-hover:text-blue-700">添加新配置</span>
            </button>
          )}
        </div>

        <AsrProviderDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          mode={dialogMode}
          editingProvider={editingProvider}
          onSave={handleSaveProvider}
          existingProviders={providers}
        />

        <AsrTestDialog
          open={testDialogOpen}
          onOpenChange={setTestDialogOpen}
          provider={testingProvider}
        />
      </div>
    </SettingsLayout>
  );
};

export default AsrConfigPage;
