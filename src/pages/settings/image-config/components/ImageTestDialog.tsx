import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageProviderConfig, testImageGeneration } from '@/api/image-config';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ImageTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: ImageProviderConfig | null;
}

const ImageTestDialog: React.FC<ImageTestDialogProps> = ({
  open,
  onOpenChange,
  provider
}) => {
  const [prompt, setPrompt] = useState('A cute cat sitting on a sofa');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleTest = async () => {
    if (!provider) return;
    try {
      setLoading(true);
      setResultUrl(null);
      const result = await testImageGeneration(provider, prompt);
      setResultUrl(result.url);
      toast.success('生成成功');
    } catch (error) {
      console.error('Test failed:', error);
      toast.error('生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>测试图片生成 - {provider?.providerName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>提示词 (Prompt)</Label>
            <div className="flex gap-2">
              <Input 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                placeholder="输入提示词..."
              />
              <Button onClick={handleTest} disabled={loading || !prompt}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                生成
              </Button>
            </div>
          </div>

          {resultUrl && (
            <div className="mt-4 rounded-lg border border-slate-200 p-2">
              <img 
                src={resultUrl} 
                alt="Generated" 
                className="w-full rounded-md object-contain max-h-[400px]" 
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageTestDialog;
