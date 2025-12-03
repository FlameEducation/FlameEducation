import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ImageProviderConfig, CreateImageProviderConfig } from '@/api/image-config';
import * as promptTemplateApi from '@/api/promptTemplate';
import { PromptTemplate } from '@/api/promptTemplate';

interface ImageProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  editingProvider?: ImageProviderConfig;
  onSave: (data: CreateImageProviderConfig) => Promise<void>;
  existingProviders: ImageProviderConfig[];
}

interface ProviderOption {
  code: string;
  name: string;
  description: string;
  logo: React.ReactNode;
}

export const IMAGE_PROVIDER_OPTIONS: ProviderOption[] = [
  {
    code: 'siliconflow',
    name: 'SiliconFlow',
    description: '硅基流动 FLUX 绘图',
    logo: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-lg font-bold text-white shadow">
        SF
      </div>
    ),
  },
  {
    code: 'google',
    name: 'Google Imagen',
    description: 'Google Imagen 3',
    logo: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500 text-lg font-bold text-white shadow">
        G
      </div>
    ),
  },
  {
    code: 'doubao',
    name: '豆包绘图',
    description: '字节跳动火山引擎绘图',
    logo: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-lg font-bold text-white shadow">
        豆
      </div>
    ),
  },
];

const ImageProviderDialog: React.FC<ImageProviderDialogProps> = ({
  open,
  onOpenChange,
  mode,
  editingProvider,
  onSave,
  existingProviders
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CreateImageProviderConfig>({
    providerName: '',
    apiKey: '',
    model: '',
    imageSize: '',
    baseUrl: '',
    enablePromptOptimization: false,
    promptOptimizationTemplateUuid: ''
  });

  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await promptTemplateApi.listPromptTemplates({
          page: 1,
          pageSize: 100,
          templateType: 'IMAGE_PROMPT_OPTIMIZATION'
        });
        // @ts-ignore
        setTemplates(res.list || res || []);
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      }
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      if (mode === 'create') {
        setFormData({
          providerName: '',
          apiKey: '',
          model: '',
          imageSize: '',
          baseUrl: '',
          enablePromptOptimization: false,
          promptOptimizationTemplateUuid: ''
        });
      }
    } else {
      if (mode === 'edit' && editingProvider) {
        setCurrentStep(2);
        setFormData({
          providerName: editingProvider.providerName,
          apiKey: editingProvider.apiKey || '',
          model: editingProvider.model || '',
          imageSize: editingProvider.imageSize || '',
          baseUrl: editingProvider.baseUrl || '',
          enablePromptOptimization: editingProvider.enablePromptOptimization || false,
          promptOptimizationTemplateUuid: editingProvider.promptOptimizationTemplateUuid || ''
        });
      } else {
        setCurrentStep(1);
      }
    }
  }, [open, mode, editingProvider]);

  const handleProviderSelect = (code: string) => {
    let defaultModel = '';
    let defaultSize = '';
    
    if (code === 'siliconflow') {
      defaultModel = 'black-forest-labs/FLUX.1-schnell';
      defaultSize = '1024x576';
    }
    if (code === 'google') {
      defaultModel = 'imagen-3.0-generate-001';
      defaultSize = '16:9';
    }
    if (code === 'doubao') {
      defaultModel = 'cv_20240604_2.0_txt2img_mj_v2_0_schnell';
      defaultSize = '1024x1024';
    }

    setFormData(prev => ({
      ...prev,
      providerName: code,
      model: defaultModel,
      imageSize: defaultSize
    }));
  };

  const handleFieldChange = (field: keyof CreateImageProviderConfig, value: string) => {
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
    if (formData.providerName === 'siliconflow') {
      if (!formData.apiKey) {
        toast.error('请填写 API Key');
        return;
      }
    } else if (formData.providerName === 'google') {
      if (!formData.apiKey) {
        toast.error('请填写 API Key');
        return;
      }
    } else if (formData.providerName === 'doubao') {
      // Doubao might use apiKey or accessKey/secretKey depending on implementation
      // Based on previous file, it seemed to use apiKey, but let's support both if needed or stick to what was there.
      // The previous file had apiKey for doubao. Let's stick to apiKey for consistency with the read file.
      if (!formData.apiKey) {
         toast.error('请填写 API Key');
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

    const availableProviders = IMAGE_PROVIDER_OPTIONS.filter(
      provider => !existingProviderNames.has(provider.code)
    );

    if (availableProviders.length === 0) {
      return (
        <div className="space-y-4 py-4">
          <div className="text-center">
            <h3 className="text-base font-semibold text-slate-900">选择服务商</h3>
            <p className="mt-1 text-xs text-slate-600">请选择您要配置的绘图服务商</p>
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
          <p className="mt-1 text-xs text-slate-600">请选择您要配置的绘图服务商</p>
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          {availableProviders.map(provider => (
            <div
              key={provider.code}
              onClick={() => handleProviderSelect(provider.code)}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:shadow w-32',
                formData.providerName === provider.code
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              {provider.logo}
              <div className="text-center">
                <div className="text-sm font-semibold text-slate-900">{provider.name}</div>
                <div className="mt-0.5 text-xs text-slate-500 line-clamp-1">{provider.description}</div>
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

      {formData.providerName === 'siliconflow' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="apiKey" className="text-sm">
              API Key <span className="text-red-500">*</span>
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={formData.apiKey}
              onChange={e => handleFieldChange('apiKey', e.target.value)}
              placeholder="SiliconFlow API Key"
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="model" className="text-sm">
              模型名称
            </Label>
            <Input
              id="model"
              value={formData.model}
              onChange={e => handleFieldChange('model', e.target.value)}
              placeholder="black-forest-labs/FLUX.1-schnell"
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="imageSize" className="text-sm">
              图片尺寸
            </Label>
            <Input
              id="imageSize"
              value={formData.imageSize}
              onChange={e => handleFieldChange('imageSize', e.target.value)}
              placeholder="1024x576"
              className="text-sm"
            />
          </div>
        </div>
      )}

      {formData.providerName === 'google' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="apiKey" className="text-sm">
              API Key <span className="text-red-500">*</span>
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={formData.apiKey}
              onChange={e => handleFieldChange('apiKey', e.target.value)}
              placeholder="Google AI Studio API Key"
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="model" className="text-sm">
              模型名称
            </Label>
            <Input
              id="model"
              value={formData.model}
              onChange={e => handleFieldChange('model', e.target.value)}
              placeholder="imagen-3.0-generate-001"
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="baseUrl" className="text-sm">
              代理地址 (Base URL)
            </Label>
            <Input
              id="baseUrl"
              value={formData.baseUrl}
              onChange={e => handleFieldChange('baseUrl', e.target.value)}
              placeholder="Optional, e.g. https://gemini.mashangrun.com"
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="imageSize" className="text-sm">
              图片尺寸 (Aspect Ratio)
            </Label>
            <Input
              id="imageSize"
              value={formData.imageSize}
              onChange={e => handleFieldChange('imageSize', e.target.value)}
              placeholder="16:9"
              className="text-sm"
            />
            <p className="text-xs text-slate-500">Google Imagen 使用宽高比，如 16:9, 1:1, 4:3</p>
          </div>
        </div>
      )}

      {formData.providerName === 'doubao' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="apiKey" className="text-sm">
              API Key <span className="text-red-500">*</span>
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={formData.apiKey}
              onChange={e => handleFieldChange('apiKey', e.target.value)}
              placeholder="Volcengine API Key"
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="model" className="text-sm">
              模型名称
            </Label>
            <Input
              id="model"
              value={formData.model}
              onChange={e => handleFieldChange('model', e.target.value)}
              placeholder="cv_20240604_2.0_txt2img_mj_v2_0_schnell"
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="imageSize" className="text-sm">
              图片尺寸
            </Label>
            <Input
              id="imageSize"
              value={formData.imageSize}
              onChange={e => handleFieldChange('imageSize', e.target.value)}
              placeholder="1024x1024"
              className="text-sm"
            />
          </div>
        </div>
      )}

      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm">提示词优化</Label>
            <p className="text-xs text-slate-500">使用 AI 优化绘图提示词</p>
          </div>
          <Switch
            checked={formData.enablePromptOptimization || false}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enablePromptOptimization: checked }))}
          />
        </div>
        
        {formData.enablePromptOptimization && (
          <div className="space-y-1.5">
            <Label className="text-sm">优化模板</Label>
            <Select
              value={formData.promptOptimizationTemplateUuid}
              onValueChange={(value) => setFormData(prev => ({ ...prev, promptOptimizationTemplateUuid: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择优化模板" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(t => (
                  <SelectItem key={t.uuid} value={t.uuid}>
                    {t.templateName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">
            {mode === 'edit' ? '编辑绘图配置' : '添加绘图配置'}
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

export default ImageProviderDialog;
