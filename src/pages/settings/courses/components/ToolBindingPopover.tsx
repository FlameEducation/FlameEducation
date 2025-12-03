import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';

interface ToolBinding {
  toolUuid: string;
  toolName: string;
  toolDescription: string;
  isEnabled: boolean;
}

interface ToolBindingPopoverProps {
  toolBindings: ToolBinding[];
  onToggleTool: (toolUuid: string, enabled: boolean) => void;
}

/**
 * 工具绑定Popover组件
 * 用于管理课程可用工具的启用/禁用状态
 */
export const ToolBindingPopover: React.FC<ToolBindingPopoverProps> = ({
  toolBindings,
  onToggleTool,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          title="配置工具"
          className="h-8 px-2 text-xs md:text-sm"
        >
          🧰 工具
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 md:w-80 text-xs md:text-sm">
        <div className="space-y-3">
          <h3 className="font-semibold">选择可用工具</h3>
          {toolBindings.length > 0 ? (
            <div className="space-y-2">
              {toolBindings.map((tool) => (
                <div
                  key={tool.toolUuid}
                  className="flex items-start justify-between gap-3 border rounded-md px-2 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700 truncate">
                      {tool.toolName}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {tool.toolDescription}
                    </p>
                  </div>
                  <Switch
                    checked={tool.isEnabled}
                    onCheckedChange={(checked) =>
                      onToggleTool(tool.toolUuid, checked)
                    }
                    className="scale-75 md:scale-100"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">工具配置加载中...</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
