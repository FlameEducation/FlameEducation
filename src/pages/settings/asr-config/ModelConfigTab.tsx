import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Loader2, Save, Mic, Square } from 'lucide-react';
import { getAsrActiveConfig, updateAsrActiveConfig, AsrActiveConfig } from '@/api/asr-active-config';
import { listAsrProviders, AsrProviderConfig, testAsr } from '@/api/asr-config';

const ModelConfigTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AsrActiveConfig>({
    activeProvider: 'doubao'
  });
  const [providers, setProviders] = useState<AsrProviderConfig[]>([]);

  // Test state
  const [recording, setRecording] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [activeConfig, providerList] = await Promise.all([
        getAsrActiveConfig(),
        listAsrProviders()
      ]);
      // @ts-ignore
      setConfig(activeConfig);
      setProviders(providerList);
    } catch (error) {
      console.error('加载配置失败:', error);
      toast.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateAsrActiveConfig(config);
      toast.success('保存成功');
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], "test_audio.webm", { type: 'audio/webm' });
        handleTestAsr(file);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setTestResult('');
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast.error("无法访问麦克风");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleTestAsr = async (file: File) => {
      try {
          setTesting(true);
          const res = await testAsr(file, config.activeProvider);
          setTestResult(res);
          toast.success("识别成功");
      } catch (e: any) {
          console.error(e);
          toast.error("识别失败: " + (e.response?.data?.message || e.message));
      } finally {
          setTesting(false);
      }
  }

  if (loading) {
    return (
      <Card className="flex min-h-[200px] items-center justify-center border border-slate-200 bg-white">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-slate-400" />
        <span className="text-slate-500">加载中...</span>
      </Card>
    );
  }

  const enabledProviders = providers.filter(p => p.enabled);

  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-slate-200 bg-white p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-slate-900">生效服务商</h3>
            <p className="text-sm text-slate-500">选择当前生效的语音识别服务商。</p>
          </div>

          {enabledProviders.length === 0 ? (
             <div className="text-sm text-amber-600 bg-amber-50 p-4 rounded-md">
                 暂无已启用的服务商，请先在“服务商配置”中添加并启用服务商。
             </div>
          ) : (
              <RadioGroup
                value={config.activeProvider}
                onValueChange={(val) => setConfig({ ...config, activeProvider: val })}
                className="grid gap-4 md:grid-cols-2"
              >
                {enabledProviders.map(p => (
                    <div key={p.providerName}>
                      <RadioGroupItem value={p.providerName} id={p.providerName} className="peer sr-only" />
                      <Label
                        htmlFor={p.providerName}
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <span className="text-lg font-semibold">
                            {p.providerName === 'doubao' ? '豆包语音识别' : p.providerName === 'google' ? 'Google Gemini ASR' : p.providerName}
                        </span>
                        <span className="text-sm text-slate-500 mt-1">
                            {p.providerName === 'doubao' ? '流式识别 (Streaming)' : p.providerName === 'google' ? '多模态模型识别' : '自定义服务商'}
                        </span>
                      </Label>
                    </div>
                ))}
              </RadioGroup>
          )}

          {/* Google Model Name config removed as it is now in Provider Config */}

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> 保存配置
            </Button>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-lg font-medium mb-4">语音识别测试</h3>
            <p className="text-sm text-slate-500 mb-4">使用当前选中的服务商进行麦克风录音测试。</p>
            
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant={recording ? "destructive" : "secondary"}
                        onClick={recording ? stopRecording : startRecording}
                        disabled={testing}
                    >
                        {recording ? <Square className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                        {recording ? "停止录音" : "开始录音"}
                    </Button>
                    {testing && (
                        <div className="flex items-center text-slate-500 text-sm">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            正在识别...
                        </div>
                    )}
                </div>
                
                {testResult && (
                    <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
                        <Label className="text-xs text-slate-500 mb-1 block">识别结果:</Label>
                        <p className="text-sm text-slate-900 whitespace-pre-wrap">{testResult}</p>
                    </div>
                )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ModelConfigTab;
