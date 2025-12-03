import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AiProviderConfig, CreateAiProviderConfigRequest, UpdateAiProviderConfigRequest } from '@/api/ai-provider';
import { SceneInfo, SceneType } from '@/api/sceneConfig';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProviderDialogSubmitData = CreateAiProviderConfigRequest | UpdateAiProviderConfigRequest;

interface ProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  editingProvider?: AiProviderConfig;
  providerTypes: Array<{ code: string; name: string }>;
  scenes: SceneInfo[];
  onSave: (data: ProviderDialogSubmitData) => Promise<void>;
  onTest?: (data: CreateAiProviderConfigRequest) => Promise<boolean>;
}

interface FormData {
  providerType: string;
  displayName: string;
  modelName: string;
  proxyUrl: string;
  serviceKey: string;
  supportedScenes: SceneType[];
  isActive: boolean;
  notes: string;
}

const PROVIDER_FIELDS: Record<string, { requireProxy?: boolean; fields: string[] }> = {
  google: {
    requireProxy: true,
    fields: ['displayName', 'modelName', 'proxyUrl', 'serviceKey'],
  },
  doubao: {
    requireProxy: false,
    fields: ['displayName', 'modelName', 'serviceKey'],
  },
};

const ProviderDialog: React.FC<ProviderDialogProps> = ({
  open,
  onOpenChange,
  mode,
  editingProvider,
  providerTypes,
  scenes,
  onSave,
  onTest,
}) => {
  const [formData, setFormData] = useState<FormData>(() => {
    if (mode === 'edit' && editingProvider) {
      return {
        uuid: editingProvider.uuid,
        providerType: editingProvider.providerType,
        displayName: editingProvider.displayName || '',
        modelName: editingProvider.modelName,
  proxyUrl: editingProvider.proxyUrl || '',
  serviceKey: '',
        supportedScenes: editingProvider.supportedScenes,
        isActive: editingProvider.isActive,
        notes: editingProvider.notes || '',
      };
    }
    return {
      providerType: '',
      displayName: '',
      modelName: '',
      proxyUrl: '',
      serviceKey: '',
      supportedScenes: [],
      isActive: true,
      notes: '',
    };
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [saving, setSaving] = useState(false);

  const currentProviderConfig = PROVIDER_FIELDS[formData.providerType] || { fields: [] };

  const handleFieldChange = (field: keyof FormData, value: string | boolean | SceneType[] | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTestResult(null);
  };

  const handleToggleScene = (sceneType: SceneType, checked: boolean | string) => {
    setFormData(prev => {
      const set = new Set(prev.supportedScenes);
      if (checked) {
        set.add(sceneType);
      } else {
        set.delete(sceneType);
      }
      return { ...prev, supportedScenes: Array.from(set) as SceneType[] };
    });
  };

  const handleTest = async () => {
    if (!onTest) return;
    const serviceKey = formData.serviceKey.trim();
    if (!serviceKey) {
      return;
    }
    try {
      setTesting(true);
      setTestResult(null);
      const payload: CreateAiProviderConfigRequest = {
        providerType: formData.providerType,
        displayName: formData.displayName.trim(),
        modelName: formData.modelName.trim(),
        proxyUrl: formData.proxyUrl ? formData.proxyUrl.trim() : undefined,
        serviceKey,
        supportedScenes: formData.supportedScenes,
        isActive: formData.isActive,
        notes: formData.notes ? formData.notes.trim() : undefined,
      };
      const success = await onTest(payload);
      setTestResult(success ? 'success' : 'error');
    } catch (error) {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    const modelName = formData.modelName.trim();
    if (!modelName || formData.supportedScenes.length === 0) {
      return;
    }
    try {
      setSaving(true);
      if (mode === 'create') {
        const serviceKey = formData.serviceKey.trim();
        if (!formData.providerType || !serviceKey) {
          return;
        }
        const payload: CreateAiProviderConfigRequest = {
          providerType: formData.providerType,
          displayName: formData.displayName.trim(),
          modelName,
          proxyUrl: formData.proxyUrl ? formData.proxyUrl.trim() : undefined,
          serviceKey,
          supportedScenes: formData.supportedScenes,
          isActive: formData.isActive,
          notes: formData.notes ? formData.notes.trim() : undefined,
        };
        await onSave(payload);
      } else if (editingProvider) {
        const payload: UpdateAiProviderConfigRequest = {
          uuid: editingProvider.uuid,
          providerType: editingProvider.providerType,
          displayName: formData.displayName.trim(),
          modelName,
          proxyUrl: formData.proxyUrl ? formData.proxyUrl.trim() : undefined,
          supportedScenes: formData.supportedScenes,
          isActive: formData.isActive,
          notes: formData.notes ? formData.notes.trim() : undefined,
        };
        if (formData.serviceKey.trim()) {
          payload.serviceKey = formData.serviceKey.trim();
        }
        await onSave(payload);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? '添加服务商' : '编辑服务商'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {mode === 'create' ? (
            <div className="space-y-2">
              <Label>服务商类型 *</Label>
              <Select
                value={formData.providerType}
                onValueChange={value => handleFieldChange('providerType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择服务商类型" />
                </SelectTrigger>
                <SelectContent>
                  {providerTypes.map(type => (
                    <SelectItem key={type.code} value={type.code}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              <div className="font-medium">服务商类型：{editingProvider?.providerName}</div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>展示名称（可选）</Label>
              <Input
                value={formData.displayName}
                onChange={e => handleFieldChange('displayName', e.target.value)}
                placeholder="例如：Google Gemini Pro"
              />
            </div>
            <div className="space-y-2">
              <Label>模型名称 *</Label>
              <Input
                value={formData.modelName}
                onChange={e => handleFieldChange('modelName', e.target.value)}
                placeholder="例如：gemini-1.5-pro"
              />
            </div>
          </div>

          {currentProviderConfig.requireProxy && (
            <div className="space-y-2">
              <Label>服务代理地址（可选）</Label>
              <Input
                value={formData.proxyUrl}
                onChange={e => handleFieldChange('proxyUrl', e.target.value)}
                placeholder="https://your-proxy.example.com"
              />
              <p className="text-xs text-slate-500">国内环境建议配置代理地址</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>服务密钥 *</Label>
            <Input
              type="password"
              value={formData.serviceKey}
              onChange={e => handleFieldChange('serviceKey', e.target.value)}
              placeholder="请输入服务密钥"
            />
          </div>

          <div className="space-y-3">
            <Label>支持的场景 *</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {scenes.map(scene => {
                const sceneType = scene.sceneType as SceneType;
                const checked = formData.supportedScenes.includes(sceneType);
                return (
                  <label
                    key={scene.sceneType}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors cursor-pointer',
                      checked ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={value => handleToggleScene(sceneType, value)}
                    />
                    <span className="text-slate-700">{scene.sceneName}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>备注</Label>
            <Textarea
              value={formData.notes}
              onChange={e => handleFieldChange('notes', e.target.value)}
              placeholder="补充说明、额度信息等"
              className="min-h-[80px]"
            />
          </div>

          {onTest && (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={!formData.serviceKey || testing}
              >
                {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                测试连接
              </Button>
              {testResult === 'success' && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  测试通过
                </div>
              )}
              {testResult === 'error' && (
                <div className="text-sm text-red-600">
                  测试失败，请检查配置
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              (mode === 'create' && (!formData.providerType || !formData.serviceKey.trim())) ||
              !formData.modelName.trim() ||
              formData.supportedScenes.length === 0 ||
              saving
            }
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {mode === 'create' ? '添加' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderDialog;
