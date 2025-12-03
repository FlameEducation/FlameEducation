import React, { useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { listTtsProviders, saveTtsProviderConfig, deleteTtsProviderConfig, TtsProviderConfig, CreateTtsProviderConfig } from '@/api/tts-config';
import VoiceProviderCard from './components/VoiceProviderCard';
import VoiceProviderDialog from './components/VoiceProviderDialog';

const ProviderConfigTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<TtsProviderConfig[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<TtsProviderConfig | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await listTtsProviders();
      setProviders(data);
    } catch (error) {
      toast.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setEditingProvider(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (provider: TtsProviderConfig) => {
    setEditingProvider(provider);
    setDialogOpen(true);
  };

  const handleDelete = async (providerName: string) => {
    if (!confirm('确定要删除该配置吗？')) return;
    try {
      await deleteTtsProviderConfig(providerName);
      toast.success('删除成功');
      loadConfig();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleSave = async (data: CreateTtsProviderConfig) => {
    await saveTtsProviderConfig(data);
    loadConfig();
  };

  const SUPPORTED_VOICE_PROVIDERS = ['doubao', 'azure'];
  const configuredProviderNames = providers.map(p => p.providerName);
  const showAddButton = SUPPORTED_VOICE_PROVIDERS.some(p => !configuredProviderNames.includes(p));

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex h-[200px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <VoiceProviderCard
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

      <VoiceProviderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={editingProvider ? 'edit' : 'create'}
        editingProvider={editingProvider}
        onSave={handleSave}
        existingProviders={providers}
      />
    </div>
  );
};

export default ProviderConfigTab;
