import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { ExerciseResultData, submitExerciseAnswer } from '@/api/exercise';
import { useExerciseContext } from '../../context/ExerciseContext';
import { useChatHistoryContext } from '../../context/ChatHistoryContext';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { ExerciseResultCard } from './ExerciseResultCard';

interface TrueFalseExerciseProps {
  exerciseId: string;
  exerciseData: ExerciseResultData;
  onComplete?: (result: any) => void;
}

export const TrueFalseExerciseComponent: React.FC<TrueFalseExerciseProps> = ({
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

  // 简化的数据获取 - 判断题使用 A(正确)/B(错误)
  const userAnswer = exerciseData.userAnswer?.[0]; // "A" 或 "B"
  const correctAnswer = exerciseData.answer?.[0]; // "A" 或 "B"
  const isCompleted = exerciseData.submitted;
  const isCorrect = exerciseData.correct;

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(() => {
    return isCompleted && userAnswer ? userAnswer : null;
  });

  // 同步外部答案
  useEffect(() => {
    if (isCompleted && userAnswer && userAnswer !== selectedAnswer) {
      setSelectedAnswer(userAnswer);
    }
  }, [isCompleted, userAnswer, selectedAnswer]);

  const handleAnswerSelect = (answer: string) => {
    if (!isCompleted && !isSubmitting) {
      setSelectedAnswer(answer);
    }
  };

  // 提交答案
  const handleSubmit = useCallback(async () => {
    if (!selectedAnswer || isCompleted || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // 提交答案,后端返回完整的题目数据
      const result = await submitExerciseAnswer(exerciseId, [selectedAnswer]);
      
      console.log('判断题提交返回:', result);
      
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
  }, [selectedAnswer, isCompleted, isSubmitting, exerciseId, updateExerciseData, onComplete, exerciseData.title, sendMessage]);

  // 显示/隐藏解析
  const handleShowExplanation = useCallback(() => {
    setShowResultCard(prev => !prev);
  }, []);

  // 渲染选项
  const renderOption = (value: string, label: string, icon: string) => {
    const isSelected = selectedAnswer === value;
    const isUserChoice = userAnswer === value;
    const isCorrectAnswer = correctAnswer === value;
    const showResult = isCompleted;
    
    let optionClass = "flex flex-col items-center justify-center space-y-2 p-5 sm:p-6 rounded-lg cursor-pointer transition-all duration-200 border-2 ";
    
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
        optionClass += value === 'A' 
          ? " bg-green-50 text-green-800 border-green-300"
          : " bg-red-50 text-red-800 border-red-300";
      } else {
        optionClass += " hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300";
      }
    }

    return (
      <div 
        className={optionClass}
        onClick={() => handleAnswerSelect(value)}
      >
        <span className="text-5xl sm:text-6xl">{icon}</span>
        <div className="text-center">
          <div className="text-lg sm:text-xl font-bold mb-1">{label}</div>
          {showResult && (
            <div className="mt-1.5 flex justify-center items-center gap-1">
              {isUserChoice && (
                <span className={`text-sm font-medium ${
                  isCorrectAnswer ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isCorrectAnswer ? '✓ 您的选择' : '✗ 您的选择'}
                </span>
              )}
              {isCorrectAnswer && !isUserChoice && (
                <span className="text-sm font-medium text-blue-600">
                  ⭐ 正确答案
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 顶部标题区 */}
      <div className="px-5 py-3 sm:px-8 sm:py-4 bg-orange-50 flex-shrink-0">
        <h2 className="text-lg sm:text-xl font-bold text-orange-900">{exerciseData.title}</h2>
      </div>

      {/* 中间内容区 */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-5 py-3 sm:px-8 sm:py-4">
          {/* 题目描述 */}
          <div className="mb-4 sm:mb-5">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">判断题</h3>
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
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {renderOption('A', '正确', '✓')}
            {renderOption('B', '错误', '✗')}
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
                disabled={!selectedAnswer || isSubmitting}
                className="text-sm sm:text-base px-5 py-2 sm:px-8 sm:py-2 h-auto bg-orange-600 hover:bg-orange-700"
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
