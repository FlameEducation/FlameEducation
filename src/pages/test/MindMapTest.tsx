import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MindMap } from '@/components/mindmap/MindMap';

const MindMapTest = () => {
  const [md1, setMd1] = useState('- Root\n  - Child 1\n  - Child 2');
  const [md2, setMd2] = useState('- Root\n  - Child 1\n  - Child 3');
  const [xSpacing, setXSpacing] = useState(200);
  const [ySpacing, setYSpacing] = useState(50);
  const [theme, setTheme] = useState('classic');
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className="h-screen w-full flex flex-col p-4 gap-4">
      <div className="flex gap-4 h-1/3">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle>Markdown 1 (Base)</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-2">
            <Textarea 
              className="h-full resize-none font-mono" 
              value={md1} 
              onChange={e => setMd1(e.target.value)} 
            />
          </CardContent>
        </Card>
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle>Markdown 2 (New)</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-2">
            <Textarea 
              className="h-full resize-none font-mono" 
              value={md2} 
              onChange={e => setMd2(e.target.value)} 
            />
          </CardContent>
        </Card>
        <Card className="w-64 flex flex-col gap-4 p-4">
          <CardTitle>Controls</CardTitle>
          <div className="flex items-center space-x-2">
            <Switch id="preview-mode" checked={isPreview} onCheckedChange={setIsPreview} />
            <Label htmlFor="preview-mode">Preview Mode</Label>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Theme</label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="vibrant">Vibrant</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">X Spacing: {xSpacing}</label>
            <Slider 
              value={[xSpacing]} 
              onValueChange={v => setXSpacing(v[0])} 
              min={100} 
              max={500} 
              step={10} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Y Spacing: {ySpacing}</label>
            <Slider 
              value={[ySpacing]} 
              onValueChange={v => setYSpacing(v[0])} 
              min={30} 
              max={150} 
              step={5} 
            />
          </div>
        </Card>
      </div>
      
      <Card className="flex-1 overflow-hidden">
        <MindMap 
          baseMarkdown={md1}
          newMarkdown={md2}
          theme={theme}
          xSpacing={xSpacing}
          ySpacing={ySpacing}
          isPreview={isPreview}
        />
      </Card>
    </div>
  );
};

export default MindMapTest;
