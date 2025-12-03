import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PromptTemplate {
  uuid?: string;
  sceneUuid?: string;
  promptName?: string;
  name?: string;
  aiModelName?: string;
  templateType?: string;
  sceneType?: string;
}

interface CoursePromptBinding {
  courseUuid: string;
  chatPromptUuid?: string;
  blackboardPromptUuid?: string;
  imagePromptUuid?: string;
}

interface PromptBindingPopoverProps {
  promptTemplates: PromptTemplate[];
  coursePromptBinding: CoursePromptBinding;
  onUpdatePromptBinding: (
    sceneType: 'chat' | 'blackboard' | 'image',
    promptUuid?: string
  ) => void;
}

/**
 * Prompt绑定Popover组件
 * 用于管理课程的三个场景Prompt绑定（聊天、小黑板、画图）
 */
export const PromptBindingPopover: React.FC<PromptBindingPopoverProps> = ({
  promptTemplates,
  coursePromptBinding,
  onUpdatePromptBinding,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          title="设置Prompt"
          className="h-8 px-2 text-xs md:text-sm"
        >
          ⚙️ Prompt
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 md:w-80 text-xs md:text-sm">
        <div className="space-y-3">
          <h3 className="font-semibold">选择场景Prompt</h3>

          {/* 聊天场景 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">💬 聊天</label>
            <Select
              defaultValue={coursePromptBinding.chatPromptUuid || 'none'}
              onValueChange={(value) =>
                onUpdatePromptBinding('chat', value === 'none' ? undefined : value)
              }
            >
              <SelectTrigger className="w-full h-7 text-xs">
                <SelectValue placeholder="选择" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">不绑定</SelectItem>
                {promptTemplates
                  .filter((t) => t.templateType === 'CHAT' || t.sceneType === 'CHAT')
                  .map((template) => (
                    <SelectItem
                      key={template.uuid || template.sceneUuid}
                      value={template.uuid || template.sceneUuid || ''}
                    >
                      {template.promptName || template.name || template.aiModelName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* 小黑板场景 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">📝 小黑板</label>
            <Select
              defaultValue={coursePromptBinding.blackboardPromptUuid || 'none'}
              onValueChange={(value) =>
                onUpdatePromptBinding('blackboard', value === 'none' ? undefined : value)
              }
            >
              <SelectTrigger className="w-full h-7 text-xs">
                <SelectValue placeholder="选择" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">不绑定</SelectItem>
                {promptTemplates
                  .filter((t) => t.templateType === 'BLACKBOARD' || t.sceneType === 'BLACKBOARD')
                  .map((template) => (
                    <SelectItem
                      key={template.uuid || template.sceneUuid}
                      value={template.uuid || template.sceneUuid || ''}
                    >
                      {template.promptName || template.name || template.aiModelName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* 画图场景 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">🎨 画图</label>
            <Select
              defaultValue={coursePromptBinding.imagePromptUuid || 'none'}
              onValueChange={(value) =>
                onUpdatePromptBinding('image', value === 'none' ? undefined : value)
              }
            >
              <SelectTrigger className="w-full h-7 text-xs">
                <SelectValue placeholder="选择" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">不绑定</SelectItem>
                {promptTemplates
                  .filter(
                    (t) =>
                      t.templateType === 'IMAGE_PROMPT_OPTIMIZATION' ||
                      t.sceneType === 'IMAGE_PROMPT_OPTIMIZATION'
                  )
                  .map((template) => (
                    <SelectItem
                      key={template.uuid || template.sceneUuid}
                      value={template.uuid || template.sceneUuid || ''}
                    >
                      {template.promptName || template.name || template.aiModelName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
