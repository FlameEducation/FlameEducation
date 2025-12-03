import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { ExerciseResultData, submitExerciseAnswer } from '@/api/exercise';
import { useExerciseContext } from '../../context/ExerciseContext';
import { useChatHistoryContext } from '../../context/ChatHistoryContext';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { ExerciseResultCard } from './ExerciseResultCard';

interface FillBlankExerciseProps {
  exerciseId: string;
  exerciseData: ExerciseResultData;
  onComplete?: (result: any) => void;
}

export const FillBlankExerciseComponent: React.FC<FillBlankExerciseProps> = ({
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
  const userAnswer = exerciseData.userAnswer || []; // ["答案1", "答案2"]
  const correctAnswer = exerciseData.answer || []; // ["正确答案1", "正确答案2"]
  const isCompleted = exerciseData.submitted;
  const isCorrect = exerciseData.correct;

  // 解析题目中的空格占位符 - 格式为 ${0}, ${1}, ${2}...
  const question = exerciseData.question || '';
  const blankPattern = /\$\{(\d+)\}/g;
  const blanks = Array.from(question.matchAll(blankPattern));
  const blankCount = blanks.length;

  const [blankAnswers, setBlankAnswers] = useState<string[]>(() => {
    if (isCompleted && userAnswer.length > 0) {
      return userAnswer;
    }
    return new Array(blankCount).fill('');
  });

  // 同步外部答案
  useEffect(() => {
    if (isCompleted && userAnswer.length > 0 && JSON.stringify(userAnswer) !== JSON.stringify(blankAnswers)) {
      setBlankAnswers(userAnswer);
    }
  }, [isCompleted, userAnswer, blankAnswers]);

  const handleBlankChange = (index: number, value: string) => {
    if (!isCompleted && !isSubmitting) {
      const newAnswers = [...blankAnswers];
      newAnswers[index] = value;
      setBlankAnswers(newAnswers);
    }
  };

  // 提交答案
  const handleSubmit = useCallback(async () => {
    if (blankAnswers.some(ans => !ans.trim()) || isCompleted || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // 提交答案,后端返回完整的题目数据
      const result = await submitExerciseAnswer(exerciseId, blankAnswers);
      
      console.log('填空题提交返回:', result);
      
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
  }, [blankAnswers, isCompleted, isSubmitting, exerciseId, updateExerciseData, onComplete, exerciseData.title, sendMessage]);

  // 显示/隐藏解析
  const handleShowExplanation = useCallback(() => {
    setShowResultCard(prev => !prev);
  }, []);

  // 渲染带输入框的题目
  const renderQuestionWithBlanks = () => {
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    
    // 找到所有的占位符 ${0}, ${1}, ${2}...
    const matches = Array.from(question.matchAll(/\$\{(\d+)\}/g));
    
    matches.forEach((match, idx) => {
      const matchIndex = match.index!;
      const blankIndex = parseInt(match[1]);
      
      // 添加占位符之前的文本
      if (matchIndex > lastIndex) {
        const text = question.substring(lastIndex, matchIndex);
        parts.push(
          <span key={`text-${idx}`} className="text-sm sm:text-base text-gray-700">
            {text}
          </span>
        );
      }
      
      // 添加输入框
      const isUserAnswerCorrect = isCompleted && userAnswer[blankIndex] === correctAnswer[blankIndex];
      
      parts.push(
        <span key={`blank-${idx}`} className="inline-flex flex-col items-start gap-1 mx-1.5">
          <Input
            value={blankAnswers[blankIndex] || ''}
            onChange={(e) => handleBlankChange(blankIndex, e.target.value)}
            disabled={isCompleted}
            placeholder={`空${blankIndex + 1}`}
            className={`w-32 sm:w-40 h-9 text-sm sm:text-base inline-block ${
              isCompleted 
                ? isUserAnswerCorrect
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'
                : ''
            }`}
          />
          {isCompleted && (
            <span className="text-sm flex items-center gap-1">
              {isUserAnswerCorrect ? (
                <>
                  <span className="text-green-600 font-semibold">✓</span>
                  <span className="text-green-600">正确</span>
                </>
              ) : (
                <>
                  <span className="text-red-600 font-semibold">✗</span>
                  <span className="text-red-600">错误，正确答案：{correctAnswer[blankIndex]}</span>
                </>
              )}
            </span>
          )}
        </span>
      );
      
      lastIndex = matchIndex + match[0].length;
    });
    
    // 添加最后剩余的文本
    if (lastIndex < question.length) {
      const text = question.substring(lastIndex);
      parts.push(
        <span key={`text-end`} className="text-sm sm:text-base text-gray-700">
          {text}
        </span>
      );
    }
    
    return <div className="leading-relaxed">{parts}</div>;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 顶部标题区 */}
      <div className="px-5 py-3 sm:px-8 sm:py-4 bg-purple-50 flex-shrink-0">
        <h2 className="text-lg sm:text-xl font-bold text-purple-900">{exerciseData.title}</h2>
      </div>

      {/* 中间内容区 */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-5 py-3 sm:px-8 sm:py-4">
          {/* 题目描述 */}
          <div className="mb-4 sm:mb-5">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">填空题</h3>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              {renderQuestionWithBlanks()}
            </div>
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
                disabled={blankAnswers.some(ans => !ans.trim()) || isSubmitting}
                className="text-sm sm:text-base px-5 py-2 sm:px-8 sm:py-2 h-auto bg-purple-600 hover:bg-purple-700"
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
