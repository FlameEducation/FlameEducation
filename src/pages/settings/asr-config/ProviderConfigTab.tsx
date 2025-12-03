import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Plus, RefreshCw, PackagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { AsrProviderConfig, CreateAsrProviderConfig, listAsrProviders, saveAsrProviderConfig, deleteAsrProviderConfig } from '@/api/asr-config';
import AsrProviderCard from './components/AsrProviderCard';
import AsrProviderDialog from './components/AsrProviderDialog';

const ProviderConfigTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<AsrProviderConfig[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingProvider, setEditingProvider] = useState<AsrProviderConfig | undefined>(undefined);

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await listAsrProviders();
      setProviders(list);
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

  const handleOpenEditDialog = (provider: AsrProviderConfig) => {
    setDialogMode('edit');
    setEditingProvider(provider);
    setDialogOpen(true);
  };

  const handleSave = async (data: CreateAsrProviderConfig) => {
    try {
      await saveAsrProviderConfig(data);
      toast.success(dialogMode === 'create' ? '添加成功' : '更新成功');
      await loadData();
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败');
      throw error;
    }
  };

  const handleDelete = async (providerName: string) => {
    if (!window.confirm('确认删除该配置？')) {
      return;
    }
    try {
      await deleteAsrProviderConfig(providerName);
      toast.success('删除成功');
      await loadData();
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-wrap items-center justify-between gap-4 border border-slate-200 bg-white px-6 py-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">服务商列表</h3>
          <p className="mt-1 text-sm text-slate-600">
            配置语音识别服务商，目前支持豆包和 Google Gemini。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            刷新
          </Button>
          <Button size="sm" onClick={handleOpenCreateDialog}>
            <Plus className="mr-2 h-4 w-4" /> 添加配置
          </Button>
        </div>
      </Card>

      {loading ? (
        <Card className="flex min-h-[300px] items-center justify-center border border-slate-200 bg-white">
          <Loader2 className="mr-2 h-6 w-6 animate-spin text-slate-400" />
          <span className="text-slate-500">加载中...</span>
        </Card>
      ) : providers.length === 0 ? (
        <Card className="flex min-h-[300px] flex-col items-center justify-center gap-4 border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <div className="rounded-full bg-slate-100 p-4">
            <PackagePlus className="h-8 w-8 text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">还没有配置服务商</h3>
            <p className="mt-1 text-sm text-slate-600">点击下方按钮添加第一个服务商配置</p>
          </div>
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="mr-2 h-4 w-4" /> 添加配置
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-3 md:grid-cols-2">
          {providers.map(provider => (
            <AsrProviderCard
              key={provider.providerName}
              provider={provider}
              onEdit={handleOpenEditDialog}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AsrProviderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        editingProvider={editingProvider}
        onSave={handleSave}
        existingProviders={providers}
      />
    </div>
  );
};

export default ProviderConfigTab;
