import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { TtsProviderConfig, CreateTtsProviderConfig } from '@/api/tts-config';

interface VoiceProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  editingProvider?: TtsProviderConfig | null;
  onSave: (data: CreateTtsProviderConfig) => Promise<void>;
  existingProviders?: Array<{ providerName: string }>;
}

interface ProviderOption {
  code: string;
  name: string;
  description: string;
  logo: React.ReactNode;
}

export const VOICE_PROVIDER_OPTIONS: ProviderOption[] = [
  {
    code: 'doubao',
    name: '豆包语音',
    description: '字节跳动火山引擎语音合成',
    logo: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-lg font-bold text-white shadow">
        豆
      </div>
    ),
  },
  {
    code: 'azure',
    name: 'Azure Speech',
    description: '微软 Azure 语音合成服务',
    logo: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0078D4] text-lg font-bold text-white shadow">
        A
      </div>
    ),
  },
];

const VoiceProviderDialog: React.FC<VoiceProviderDialogProps> = ({
  open,
  onOpenChange,
  mode,
  editingProvider,
  onSave,
  existingProviders = [],
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CreateTtsProviderConfig>({
    providerName: '',
    subscriptionKey: '',
    region: '',
    appId: '',
    accessToken: '',
    clusterId: 'volcano_tts',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      if (mode === 'create') {
        setFormData({
          providerName: '',
          subscriptionKey: '',
          region: '',
          appId: '',
          accessToken: '',
          clusterId: 'volcano_tts',
        });
      }
    } else {
      if (mode === 'edit' && editingProvider) {
        setCurrentStep(2);
        setFormData({
          providerName: editingProvider.providerName,
          subscriptionKey: editingProvider.subscriptionKey || '',
          region: editingProvider.region || '',
          appId: editingProvider.appId || '',
          accessToken: editingProvider.accessToken || '',
          clusterId: editingProvider.clusterId || 'volcano_tts',
        });
      } else {
        setCurrentStep(1);
      }
    }
  }, [open, mode, editingProvider]);

  const handleProviderSelect = (code: string) => {
    setFormData(prev => ({
      ...prev,
      providerName: code,
    }));
  };

  const handleFieldChange = (field: keyof CreateTtsProviderConfig, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.providerName) {
        toast.error('请选择服务商');
        return;
      }
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Basic validation
    if (formData.providerName === 'azure') {
      if (!formData.subscriptionKey || !formData.region) {
        toast.error('请填写完整 Azure 配置');
        return;
      }
    } else if (formData.providerName === 'doubao') {
      if (!formData.appId || !formData.accessToken) {
        toast.error('请填写完整豆包配置');
        return;
      }
    }

    setSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
      toast.success(mode === 'create' ? '创建成功' : '更新成功');
    } catch (error) {
      console.error('保存失败:', error);
      toast.error(mode === 'create' ? '创建失败' : '更新失败');
    } finally {
      setSaving(false);
    }
  };

  const renderStep1 = () => {
    const existingProviderNames = new Set(
      existingProviders
        .filter(p => p.providerName !== editingProvider?.providerName)
        .map(p => p.providerName)
    );

    const availableProviders = VOICE_PROVIDER_OPTIONS.filter(
      provider => !existingProviderNames.has(provider.code)
    );

    if (availableProviders.length === 0) {
      return (
        <div className="space-y-4 py-4">
          <div className="text-center">
            <h3 className="text-base font-semibold text-slate-900">选择服务商</h3>
            <p className="mt-1 text-xs text-slate-600">请选择您要配置的语音合成服务商</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-sm text-amber-800">所有服务商均已配置</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 py-4">
        <div className="text-center">
          <h3 className="text-base font-semibold text-slate-900">选择服务商</h3>
          <p className="mt-1 text-xs text-slate-600">请选择您要配置的语音合成服务商</p>
        </div>
        <div className="flex gap-3 justify-center">
          {availableProviders.map(provider => (
            <div
              key={provider.code}
              onClick={() => handleProviderSelect(provider.code)}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:shadow w-40',
                formData.providerName === provider.code
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              {provider.logo}
              <div className="text-center">
                <div className="text-sm font-semibold text-slate-900">{provider.name}</div>
                <div className="mt-0.5 text-xs text-slate-500">{provider.description}</div>
              </div>
              {formData.providerName === provider.code && (
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStep2 = () => (
    <div className="space-y-4 py-4">
      <div className="text-center">
        <h3 className="text-base font-semibold text-slate-900">配置信息</h3>
        <p className="mt-1 text-xs text-slate-600">填写服务商配置信息</p>
      </div>
      
      {formData.providerName === 'azure' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="subscriptionKey" className="text-sm">
              Subscription Key <span className="text-red-500">*</span>
            </Label>
            <Input
              id="subscriptionKey"
              type="password"
              value={formData.subscriptionKey}
              onChange={e => handleFieldChange('subscriptionKey', e.target.value)}
              placeholder="Azure Speech Subscription Key"
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="region" className="text-sm">
              Region <span className="text-red-500">*</span>
            </Label>
            <Input
              id="region"
              value={formData.region}
              onChange={e => handleFieldChange('region', e.target.value)}
              placeholder="e.g. eastus"
              className="text-sm"
            />
          </div>
        </div>
      )}

      {formData.providerName === 'doubao' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="appId" className="text-sm">
              App ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="appId"
              value={formData.appId}
              onChange={e => handleFieldChange('appId', e.target.value)}
              placeholder="Volcengine App ID"
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accessToken" className="text-sm">
              Access Token <span className="text-red-500">*</span>
            </Label>
            <Input
              id="accessToken"
              type="password"
              value={formData.accessToken}
              onChange={e => handleFieldChange('accessToken', e.target.value)}
              placeholder="Volcengine Access Token"
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clusterId" className="text-sm">
              Cluster ID
            </Label>
            <Input
              id="clusterId"
              value={formData.clusterId}
              onChange={e => handleFieldChange('clusterId', e.target.value)}
              placeholder="Default: volcano_tts"
              className="text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">
            {mode === 'edit' ? '编辑语音合成配置' : '添加语音合成配置'}
          </DialogTitle>
        </DialogHeader>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-center gap-2 py-3">
          {mode === 'edit' ? (
            <div className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-all bg-blue-500 text-white">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          ) : (
            <>
              {[1, 2].map(step => (
                <React.Fragment key={step}>
                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-all',
                      currentStep === step
                        ? 'bg-blue-500 text-white'
                        : currentStep > step
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                    )}
                  >
                    {currentStep > step ? <CheckCircle2 className="h-4 w-4" /> : step}
                  </div>
                  {step < 2 && (
                    <div
                      className={cn(
                        'h-0.5 w-8 transition-all',
                        currentStep > step ? 'bg-green-500' : 'bg-slate-200'
                      )}
                    />
                  )}
                </React.Fragment>
              ))}
            </>
          )}
        </div>

        {/* 步骤内容 */}
        <div className="min-h-[280px]">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevStep}
            disabled={(mode === 'edit' && currentStep === 2) || currentStep === 1 || saving}
          >
            <ChevronLeft className="mr-1 h-3 w-3" />
            上一步
          </Button>
          <div className="text-xs text-slate-600">
            {mode === 'edit' 
              ? `编辑配置`
              : `第 ${currentStep} / 2 步`
            }
          </div>
          {currentStep < 2 ? (
            <Button 
              size="sm" 
              onClick={handleNextStep} 
              disabled={
                saving || 
                (currentStep === 1 && !formData.providerName)
              }
            >
              下一步
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              {mode === 'create' ? '创建' : '保存'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceProviderDialog;
