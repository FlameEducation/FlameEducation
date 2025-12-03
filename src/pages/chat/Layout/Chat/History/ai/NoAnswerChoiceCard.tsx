import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { submitExerciseAnswer } from '@/api/exercise';
import { useExerciseContext } from '@/pages/chat/context/ExerciseContext';
import { useChatHistoryContext } from '@/pages/chat/context/ChatHistoryContext';
import { toast } from 'sonner';

export interface NoAnswerChoiceData {
  type: 'noAnswerSingleChoice' | 'noAnswerMultipleChoice';
  title: string;
  question: string;
  options: { [key: string]: string };
  exerciseUuid?: string;
}

interface NoAnswerChoiceCardProps {
  data: NoAnswerChoiceData;
  initialSelectedOptions?: string[];
  initialSubmitted?: boolean;
  onSubmit?: (selectedOptions: string[]) => void;
}

export const NoAnswerChoiceCard: React.FC<NoAnswerChoiceCardProps> = ({
  data,
  initialSelectedOptions = [],
  initialSubmitted = false,
  onSubmit
}) => {
  const { type, title, question, options, exerciseUuid } = data;
  const isMultiple = type === 'noAnswerMultipleChoice';
  
  const { updateExerciseData } = useExerciseContext();
  const { sendMessage } = useChatHistoryContext();
  
  const [selectedOptions, setSelectedOptions] = useState<string[]>(initialSelectedOptions);
  const [isSubmitted, setIsSubmitted] = useState(initialSubmitted);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 监听props变化更新状态
  useEffect(() => {
    if (initialSubmitted) {
      setIsSubmitted(true);
    }
    if (initialSelectedOptions && initialSelectedOptions.length > 0) {
      setSelectedOptions(initialSelectedOptions);
    }
  }, [initialSubmitted, initialSelectedOptions]);

  // 处理选项点击
  const handleOptionClick = (optionKey: string) => {
    if (isSubmitted) return;

    if (isMultiple) {
      // 多选：切换选中状态
      setSelectedOptions(prev =>
        prev.includes(optionKey)
          ? prev.filter(key => key !== optionKey)
          : [...prev, optionKey]
      );
    } else {
      // 单选：直接设置
      setSelectedOptions([optionKey]);
    }
  };

  // 提交答案
  const handleSubmit = async () => {
    if (selectedOptions.length === 0 || isSubmitting) return;
    
    // 如果没有exerciseUuid，只触发本地回调
    if (!exerciseUuid) {
      setIsSubmitted(true);
      onSubmit?.(selectedOptions);
      return;
    }
    
    setIsSubmitting(true);
    try {
      // 提交答案到后端
      const result = await submitExerciseAnswer(exerciseUuid, selectedOptions);
      
      console.log('无答案选择题提交返回:', result);
      
      // 更新Context中的练习题数据
      updateExerciseData(exerciseUuid, result as any);
      
      // 标记为已提交
      setIsSubmitted(true);
      
      // 发送完成消息
      const completionMessage = `我已完成了"${title}"的选择`;
      sendMessage(completionMessage, 'TEXT');
      
      onSubmit?.(selectedOptions);
      
      toast.success('已提交选择');
    } catch (error) {
      console.error('提交选择失败:', error);
      toast.error(error instanceof Error ? error.message : '提交选择时发生错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200/50 shadow-sm">
      {/* 标题 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
          <h3 className="text-base font-bold text-purple-900">{title}</h3>
          {isMultiple && (
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
              可多选
            </span>
          )}
        </div>
        <p className="text-sm text-gray-700 leading-relaxed ml-3.5">{question}</p>
      </div>

      {/* 选项列表 */}
      <div className="space-y-2 mb-4">
        {Object.entries(options).map(([key, value]) => {
          const isSelected = selectedOptions.includes(key);
          
          return (
            <motion.div
              key={key}
              whileHover={!isSubmitted ? { scale: 1.01 } : {}}
              whileTap={!isSubmitted ? { scale: 0.99 } : {}}
            >
              <button
                onClick={() => handleOptionClick(key)}
                disabled={isSubmitted}
                className={cn(
                  "w-full text-left p-3 rounded-lg border-2 transition-all duration-200",
                  "flex items-center gap-3 group",
                  isSelected
                    ? "bg-purple-100 border-purple-400 shadow-md"
                    : "bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50/50",
                  isSubmitted && "cursor-not-allowed opacity-70"
                )}
              >
                {/* 选中图标 */}
                <div className={cn(
                  "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                  isMultiple ? "rounded-sm" : "rounded-full",
                  isSelected
                    ? "bg-purple-500 border-purple-500"
                    : "border-gray-300 group-hover:border-purple-400"
                )}>
                  {isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  )}
                </div>

                {/* 选项内容 */}
                <div className="flex-1">
                  <span className={cn(
                    "text-sm font-medium mr-2",
                    isSelected ? "text-purple-900" : "text-gray-600"
                  )}>
                    {key}.
                  </span>
                  <span className={cn(
                    "text-sm",
                    isSelected ? "text-purple-900 font-medium" : "text-gray-700"
                  )}>
                    {value}
                  </span>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* 操作按钮 */}
      {!isSubmitted && (
        <div className="flex items-center justify-end">
          <Button
            onClick={handleSubmit}
            disabled={selectedOptions.length === 0 || isSubmitting}
            size="sm"
            className={cn(
              "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
              "text-white shadow-sm hover:shadow-md transition-all duration-200",
              (selectedOptions.length === 0 || isSubmitting) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSubmitting ? '提交中...' : '提交选择'}
          </Button>
        </div>
      )}
    </div>
  );
};
