import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { ExerciseResultData, submitExerciseAnswer } from '@/api/exercise';
import { useExerciseContext } from '../../context/ExerciseContext';
import { useChatHistoryContext } from '../../context/ChatHistoryContext';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { ExerciseResultCard } from './ExerciseResultCard';

interface MultipleChoiceExerciseProps {
  exerciseId: string;
  exerciseData: ExerciseResultData;
  onComplete?: (result: any) => void;
}

export const MultipleChoiceExerciseComponent: React.FC<MultipleChoiceExerciseProps> = ({
  exerciseId,
  exerciseData,
  onComplete
}) => {
  const { updateExerciseData } = useExerciseContext();
  const { sendMessage } = useChatHistoryContext();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResultCard, setShowResultCard] = useState(false);
  
  // 安全检查
  if (!exerciseData) {
    return <div className="p-4 text-center text-gray-500">练习题数据加载中...</div>;
  }

  // 简化的数据获取
  const options = exerciseData.options; // { "A": "选项A", "B": "选项B", ... }
  const userAnswer = exerciseData.userAnswer || []; // ["A", "B"]
  const correctAnswer = exerciseData.answer || []; // ["A", "C"]
  const isCompleted = exerciseData.submitted;
  const isCorrect = exerciseData.correct;

  const [selectedOptions, setSelectedOptions] = useState<string[]>(() => {
    return isCompleted && userAnswer.length > 0 ? userAnswer : [];
  });

  // 同步外部答案
  useEffect(() => {
    if (isCompleted && userAnswer.length > 0 && JSON.stringify(userAnswer) !== JSON.stringify(selectedOptions)) {
      setSelectedOptions(userAnswer);
    }
  }, [isCompleted, userAnswer, selectedOptions]);

  const handleOptionToggle = (optionId: string) => {
    if (!isCompleted && !isSubmitting) {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  // 提交答案
  const handleSubmit = useCallback(async () => {
    if (selectedOptions.length === 0 || isCompleted || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // 提交答案,后端返回完整的题目数据
      const result = await submitExerciseAnswer(exerciseId, selectedOptions);
      
      console.log('多选题提交返回:', result);
      
      // 直接使用返回的完整数据更新Context
      updateExerciseData(exerciseId, result as any);
      
      // 显示结果卡片
      setShowResultCard(true);
      
      // 发送完成消息
      const exerciseTitle = exerciseData.title || '练习题';
      const completionMessage = result.correct
        ? `我已经完成了"${exerciseTitle}"，答题正确！`
        : `我已经完成了"${exerciseTitle}"的作答，但答案不正确。`;
      sendMessage(completionMessage, 'TEXT');
      
      onComplete?.(result);
    } catch (error) {
      console.error('提交答案失败:', error);
      toast.error(error instanceof Error ? error.message : '提交答案时发生错误');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedOptions, isCompleted, isSubmitting, exerciseId, updateExerciseData, onComplete, exerciseData.title, sendMessage]);

  // 显示/隐藏解析
  const handleShowExplanation = useCallback(() => {
    setShowResultCard(prev => !prev);
  }, []);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 顶部标题区 */}
      <div className="px-5 py-3 sm:px-8 sm:py-4 pr-12 bg-blue-50 flex-shrink-0">
        <h2 className="text-lg sm:text-xl font-bold text-blue-900">{exerciseData.title}</h2>
      </div>

      {/* 中间内容区 */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-5 py-3 sm:px-8 sm:py-4">
          {/* 题目描述 */}
          <div className="mb-4 sm:mb-5">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">多选题</h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{exerciseData.question}</p>
          </div>

          {/* 答题结果卡片 */}
          <AnimatePresence>
            {showResultCard && isCompleted && (
              <ExerciseResultCard
                isCorrect={isCorrect}
                explanation={exerciseData.explanation || ''}
                score={isCorrect ? 100 : 0}
              />
            )}
          </AnimatePresence>

          {/* 选项列表 */}
          <div className="space-y-2 sm:space-y-3">
            {options && Object.entries(options).map(([key, text]) => {
              const isSelected = selectedOptions.includes(key);
              const isUserChoice = userAnswer.includes(key);
              const isCorrectAnswer = correctAnswer.includes(key);
              const showResult = isCompleted;
              
              let optionClass = "flex items-center space-x-3 p-3 sm:p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ";
              
              if (showResult) {
                if (isUserChoice && isCorrectAnswer) {
                  optionClass += " bg-green-50 text-green-800 border-green-300";
                } else if (isUserChoice && !isCorrectAnswer) {
                  optionClass += " bg-red-50 text-red-800 border-red-300";
                } else if (!isUserChoice && isCorrectAnswer) {
                  optionClass += " bg-blue-50 text-blue-800 border-blue-300";
                } else {
                  optionClass += " bg-gray-50 text-gray-600 border-gray-200";
                }
              } else {
                if (isSelected) {
                  optionClass += " bg-blue-50 text-blue-800 border-blue-300";
                } else {
                  optionClass += " hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300";
                }
              }

              return (
                <div 
                  key={key} 
                  className={optionClass}
                  onClick={() => handleOptionToggle(key)}
                >
                  <div className="flex-shrink-0">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      showResult 
                        ? (isUserChoice ? 'border-current' : 'border-gray-300')
                        : (isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300')
                    }`}>
                      {(showResult ? isUserChoice : isSelected) && (
                        <div className={`w-2.5 h-2.5 ${
                          showResult 
                            ? (isUserChoice && isCorrectAnswer ? 'bg-green-600' : isUserChoice ? 'bg-red-600' : 'bg-blue-600')
                            : 'bg-white'
                        }`} />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm sm:text-base cursor-pointer leading-relaxed">
                      <span className="font-semibold text-base sm:text-lg mr-2">{key.toUpperCase()}.</span>
                      <span>{text}</span>
                    </div>
                    {showResult && (
                      <div className="mt-1 sm:mt-1.5 flex items-center gap-2">
                        {isUserChoice && (
                          <div className="flex items-center gap-1">
                            {isCorrectAnswer ? (
                              <>
                                <span className="text-green-600 font-semibold text-sm">✓</span>
                                <span className="text-green-600 text-sm font-medium">您的选择</span>
                              </>
                            ) : (
                              <>
                                <span className="text-red-600 font-semibold text-sm">✗</span>
                                <span className="text-red-600 text-sm font-medium">您的选择</span>
                              </>
                            )}
                          </div>
                        )}
                        {isCorrectAnswer && (
                          <div className="flex items-center gap-1">
                            <span className="text-blue-600 font-semibold text-sm">⭐</span>
                            <span className="text-blue-600 text-sm font-medium">正确答案</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 底部操作区 */}
      <div className="px-5 py-2 sm:px-8 sm:py-3 bg-gray-50 border-t border-gray-200 flex-shrink-0">
        <div className="flex justify-between items-center">
          {isCompleted ? (
            <Button 
              variant="outline" 
              onClick={handleShowExplanation}
              className="text-sm sm:text-base px-4 py-2 sm:px-5 sm:py-2 h-auto"
            >
              {showResultCard ? '隐藏解析' : '查看解析'}
            </Button>
          ) : (
            <div></div>
          )}
          
          <div className="flex items-center gap-2 sm:gap-3">
            {isCompleted && (
              <div className="text-sm sm:text-base">
                {isCorrect ? (
                  <span className="text-green-600 font-semibold">✓ 回答正确！</span>
                ) : (
                  <span className="text-red-600 font-semibold">✗ 回答错误</span>
                )}
              </div>
            )}
            
            {!isCompleted && (
              <Button 
                onClick={handleSubmit}
                disabled={selectedOptions.length === 0 || isSubmitting}
                className="text-sm sm:text-base px-5 py-2 sm:px-8 sm:py-2 h-auto bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? '提交中...' : '提交答案'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
