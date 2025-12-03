import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Slider } from "@/components/ui/slider.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { EditorSettings } from '../../types.ts';

interface EditorSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: EditorSettings;
  onSettingsChange: (settings: EditorSettings) => void;
}

export const EditorSettingsDialog: React.FC<EditorSettingsDialogProps> = ({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}) => {
  const handleSettingChange = <K extends keyof EditorSettings>(
    key: K,
    value: EditorSettings[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>编辑器设置</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* 字体大小设置 */}
          <div className="grid gap-2">
            <Label>字体大小: {settings.fontSize}px</Label>
            <Slider
              value={[settings.fontSize]}
              onValueChange={([value]) => handleSettingChange('fontSize', value)}
              min={12}
              max={24}
              step={1}
            />
          </div>

          {/* 主题设置 */}
          <div className="grid gap-2">
            <Label>主题</Label>
            <Select
              value={settings.theme}
              onValueChange={(value: 'vs-dark' | 'vs-light') => 
                handleSettingChange('theme', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vs-dark">深色</SelectItem>
                <SelectItem value="vs-light">浅色</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tab 大小设置 */}
          <div className="grid gap-2">
            <Label>Tab 大小: {settings.tabSize}</Label>
            <Slider
              value={[settings.tabSize]}
              onValueChange={([value]) => handleSettingChange('tabSize', value)}
              min={2}
              max={8}
              step={2}
            />
          </div>

          {/* 其他开关设置 */}
          <div className="flex items-center justify-between">
            <Label>显示小地图</Label>
            <Switch
              checked={settings.minimap}
              onCheckedChange={(checked) => handleSettingChange('minimap', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>自动换行</Label>
            <Switch
              checked={settings.wordWrap === 'on'}
              onCheckedChange={(checked) => 
                handleSettingChange('wordWrap', checked ? 'on' : 'off')
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>显示行号</Label>
            <Switch
              checked={settings.lineNumbers === 'on'}
              onCheckedChange={(checked) => 
                handleSettingChange('lineNumbers', checked ? 'on' : 'off')
              }
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 