import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface MultiStepProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  editingProvider?: {
    providerName: string;
    baseUrl: string;
    models?: string[];
  };
  onSave: (data: { providerName: string; baseUrl: string; apiKey: string; models: string[] }) => Promise<void>;
  existingProviders?: Array<{ providerName: string }>;
}

interface FormData {
  providerName: string;
  baseUrl: string;
  apiKey: string;
  models: string;
}

interface ProviderOption {
  code: string;
  name: string;
  description: string;
  logo: React.ReactNode;
  defaultBaseUrl?: string;
  allowCustomModels?: boolean;
}

export const PROVIDER_OPTIONS: ProviderOption[] = [
  {
    code: 'doubao',
    name: '豆包',
    description: '字节跳动旗下AI助手',
    logo: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-lg font-bold text-white shadow">
        豆
      </div>
    ),
    allowCustomModels: true,
  },
  {
    code: 'google',
    name: 'Google Gemini',
    description: 'Google 多模态大语言模型',
    logo: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500 text-lg font-bold text-white shadow">
        G
      </div>
    ),
    allowCustomModels: true,
  },
  {
    code: 'openai',
    name: 'OpenAI',
    description: 'OpenAI GPT 系列模型',
    logo: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-black text-lg font-bold text-white shadow">
        O
      </div>
    ),
    allowCustomModels: true,
  },
  {
    code: 'deepseek',
    name: 'DeepSeek',
    description: '深度求索大语言模型',
    logo: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white shadow">
        D
      </div>
    ),
    defaultBaseUrl: 'https://api.deepseek.com',
    allowCustomModels: true,
  },
  {
    code: 'zhipu',
    name: '智谱清言',
    description: '智谱 AI 大语言模型',
    logo: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-purple-600 text-lg font-bold text-white shadow">
        Z
      </div>
    ),
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4/',
    allowCustomModels: true,
  },
];

const MultiStepProviderDialog: React.FC<MultiStepProviderDialogProps> = ({
  open,
  onOpenChange,
  mode,
  editingProvider,
  onSave,
  existingProviders = [],
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(() => {
    if (mode === 'edit' && editingProvider) {
      return {
        providerName: editingProvider.providerName,
        baseUrl: editingProvider.baseUrl || '',
        apiKey: '', // 编辑时不显示原密钥
        models: editingProvider.models?.join(',') || '',
      };
    }
    return {
      providerName: '',
      baseUrl: '',
      apiKey: '',
      models: '',
    };
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      if (mode === 'create') {
        setFormData({
          providerName: '',
          baseUrl: '',
          apiKey: '',
          models: '',
        });
      }
    } else {
      // 编辑模式下直接跳到第2步（配置信息）
      if (mode === 'edit') {
        setCurrentStep(2);
      } else {
        setCurrentStep(1);
      }
    }
  }, [open, mode]);

  useEffect(() => {
    if (mode === 'edit' && editingProvider) {
      setFormData({
        providerName: editingProvider.providerName,
        baseUrl: editingProvider.baseUrl || '',
        apiKey: '',
        models: editingProvider.models?.join(',') || '',
      });
    }
  }, [mode, editingProvider]);

  const handleProviderSelect = (code: string) => {
    const selectedOption = PROVIDER_OPTIONS.find(p => p.code === code);
    const defaultBaseUrl = selectedOption?.defaultBaseUrl || '';
    
    setFormData(prev => ({
      ...prev,
      providerName: code,
      baseUrl: defaultBaseUrl,
    }));
  };

  const handleFieldChange = (field: keyof FormData, value: string | string[]) => {
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
    const trimmedApiKey = formData.apiKey.trim();
    if (!trimmedApiKey && mode === 'create') {
      toast.error('请填写API密钥');
      return;
    }

    setSaving(true);
    try {
      const submitData = {
        providerName: formData.providerName,
        baseUrl: formData.baseUrl.trim(),
        apiKey: formData.apiKey.trim(),
        models: formData.models.split(',').map(s => s.trim()).filter(s => s),
      };

      await onSave(submitData);
      onOpenChange(false);
      toast.success(mode === 'create' ? '创建成功' : '更新成功');
    } catch (error) {
      console.error('保存失败:', error);
      toast.error(mode === 'create' ? '创建失败' : '更新失败');
    } finally {
      setSaving(false);
    }
  };

  // 检查步骤1是否可以进入下一步
  const canProceedFromStep1 = () => {
    return !!formData.providerName;
  };

  // 检查步骤2是否可以提交
  const canSubmit = () => {
    if (mode === 'create') {
      return !!formData.apiKey.trim();
    }
    // 编辑模式下，apiKey可以为空（表示不修改）
    return true;
  };

  const renderStep1 = () => {
    // 获取已存在的提供商名称
    const existingProviderNames = new Set(
      existingProviders
        .filter(p => p.providerName !== editingProvider?.providerName)
        .map(p => p.providerName)
    );

    // 过滤出可用的提供商
    const availableProviders = PROVIDER_OPTIONS.filter(
      provider => !existingProviderNames.has(provider.code)
    );

    // 如果没有可用的提供商，显示提示
    if (availableProviders.length === 0) {
      return (
        <div className="space-y-4 py-4">
          <div className="text-center">
            <h3 className="text-base font-semibold text-slate-900">选择服务商</h3>
            <p className="mt-1 text-xs text-slate-600">请选择您要配置的 AI 服务商</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-sm text-amber-800">所有服务商均已配置，无法添加更多服务商</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 py-4">
        <div className="text-center">
          <h3 className="text-base font-semibold text-slate-900">选择服务商</h3>
          <p className="mt-1 text-xs text-slate-600">请选择您要配置的 AI 服务商</p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
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

  const handleAddModel = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (val) {
        const currentModels = formData.models ? formData.models.split(',').filter(Boolean) : [];
        if (!currentModels.includes(val)) {
          const newModels = [...currentModels, val].join(',');
          handleFieldChange('models', newModels);
        }
        e.currentTarget.value = '';
      }
    }
  };

  const handleRemoveModel = (modelToRemove: string) => {
    const currentModels = formData.models ? formData.models.split(',').filter(Boolean) : [];
    const newModels = currentModels.filter(m => m !== modelToRemove).join(',');
    handleFieldChange('models', newModels);
  };

  const renderStep2 = () => {
    const selectedProviderOption = PROVIDER_OPTIONS.find(p => p.code === formData.providerName);
    const showModels = selectedProviderOption?.allowCustomModels !== false;

    return (
    <div className="space-y-4 py-4">
      <div className="text-center">
        <h3 className="text-base font-semibold text-slate-900">配置信息</h3>
        <p className="mt-1 text-xs text-slate-600">填写服务商配置信息</p>
      </div>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="apiKey" className="text-sm">
            API密钥 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="apiKey"
            type="password"
            value={formData.apiKey}
            onChange={e => handleFieldChange('apiKey', e.target.value)}
            placeholder={mode === 'edit' ? '留空则不修改密钥' : '请输入 API Key'}
            className="text-sm"
          />
          {mode === 'edit' && (
            <p className="text-xs text-slate-500">留空则保持原密钥不变</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="baseUrl" className="text-sm">
            代理地址 <span className="text-slate-400">(可选)</span>
          </Label>
          <Input
            id="baseUrl"
            value={formData.baseUrl}
            onChange={e => handleFieldChange('baseUrl', e.target.value)}
            placeholder="https://api.example.com"
            className="text-sm"
          />
          <p className="text-xs text-slate-500">如需使用代理，请输入代理地址</p>
        </div>
        {showModels && (
        <div className="space-y-1.5">
          <Label htmlFor="models" className="text-sm">
            可用模型 <span className="text-slate-400">(可选)</span>
          </Label>
          <div className="rounded-md border border-slate-200 p-2 bg-white">
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.models.split(',').filter(Boolean).map(model => (
                <Badge key={model} variant="secondary" className="gap-1 pr-1">
                  {model}
                  <button
                    type="button"
                    onClick={() => handleRemoveModel(model)}
                    className="rounded-full hover:bg-slate-200 p-0.5"
                  >
                    <X className="h-3 w-3 text-slate-500" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              id="models"
              placeholder="输入模型名称后按回车添加"
              className="border-0 p-0 h-auto focus-visible:ring-0 text-sm placeholder:text-slate-400"
              onKeyDown={handleAddModel}
            />
          </div>
          <p className="text-xs text-slate-500">请输入该服务商支持的模型列表，按回车添加</p>
        </div>
        )}
      </div>
    </div>
  );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">
            {mode === 'edit' ? '编辑文本生成配置' : '添加文本生成配置'}
          </DialogTitle>
        </DialogHeader>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-center gap-2 py-3">
          {mode === 'edit' ? (
            // 编辑模式只显示步骤2
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-all bg-blue-500 text-white'
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
            </div>
          ) : (
            // 创建模式显示所有步骤
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
                (currentStep === 1 && !canProceedFromStep1())
              }
            >
              下一步
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} disabled={saving || !canSubmit()}>
              {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              {mode === 'create' ? '创建' : '保存'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MultiStepProviderDialog;



