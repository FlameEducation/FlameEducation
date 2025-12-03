import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { BookOpen, CheckCircle, Clock, Trophy, Loader2, RefreshCw } from 'lucide-react';
import { useExerciseContext } from '@/pages/chat/context/ExerciseContext.tsx';
import { ExerciseResultData } from '@/api/exercise.ts';
import { NoAnswerChoiceCard } from './NoAnswerChoiceCard.tsx';

interface ExerciseInfoCardProps {
  exerciseUuid: string;
}

export const ExerciseInfoCard: React.FC<ExerciseInfoCardProps> = ({
  exerciseUuid
}) => {
  const { startExercise, viewExercise, getExerciseById, loadExerciseData, isExerciseCompleted } = useExerciseContext();
  const [exerciseData, setExerciseData] = useState<ExerciseResultData | null>(() => getExerciseById(exerciseUuid));
  const [loading, setLoading] = useState(!exerciseData);
  const [error, setError] = useState<string | null>(null);

  // 重试加载
  const handleRetry = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadExerciseData(exerciseUuid);
      setExerciseData(data);
      setError(data ? null : '获取练习题信息失败');
    } catch (err) {
      setError('获取练习题信息失败');
      console.error('获取练习题信息失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 获取练习题数据
  useEffect(() => {
    const fetchData = async () => {
      const cached = getExerciseById(exerciseUuid);
      if (cached) {
        setExerciseData(cached);
        setLoading(false);
        return;
      }

      try {
        const data = await loadExerciseData(exerciseUuid);
        setExerciseData(data);
        setError(data ? null : '获取练习题信息失败');
      } catch (err) {
        setError('获取练习题信息失败');
        console.error('获取练习题信息失败:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [exerciseUuid, getExerciseById, loadExerciseData]);


  // 轮询刷新练习进度，直到完成
  useEffect(() => {
    const completed = isExerciseCompleted(exerciseUuid);
    if (!exerciseData || completed) return;

    const timer = setInterval(async () => {
      const data = await loadExerciseData(exerciseUuid);
      if (data) {
        setExerciseData(data);
      }
    }, 5000); // 每5秒刷新一次

    return () => clearInterval(timer);
  }, [exerciseData, exerciseUuid, loadExerciseData, isExerciseCompleted]);


  // 加载状态
  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          </div>
          <div className="flex-1">
            <div className="h-4 bg-blue-200/50 rounded animate-pulse mb-2"></div>
            <div className="h-3 bg-blue-200/30 rounded animate-pulse w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !exerciseData) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border border-red-200/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-red-900">练习题加载失败</div>
            <div className="text-sm text-red-600">{error}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRetry}
            className="text-red-600 hover:text-red-700 hover:bg-red-100 h-8 w-8"
            title="重试"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // 获取练习状态
  const completed = exerciseData.submitted;
  const correct = exerciseData.correct
  const title = exerciseData.title || '练习题';
  const exerciseType = exerciseData.type;

  // 判断是否为无答案选择题
  const isNoAnswerChoice = exerciseType === 'noAnswerSingleChoice' || exerciseType === 'noAnswerMultipleChoice';

  // 如果是无答案选择题，直接渲染NoAnswerChoiceCard
  if (isNoAnswerChoice) {
    // 提取用户答案
    let savedOptions: string[] = [];
    if (Array.isArray(exerciseData.userAnswer)) {
      savedOptions = exerciseData.userAnswer;
    } else if (Array.isArray((exerciseData as any).answerData)) {
      savedOptions = (exerciseData as any).answerData;
    }
    
    // 提取完成状态
    const isDone = completed || (exerciseData as any).isCompleted || (exerciseData as any).status?.isCompleted;

    return (
      <NoAnswerChoiceCard
        data={{
          type: exerciseType as 'noAnswerSingleChoice' | 'noAnswerMultipleChoice',
          title: exerciseData.title,
          question: exerciseData.question,
          options: exerciseData.options || {},
          exerciseUuid: exerciseUuid
        }}
        initialSelectedOptions={savedOptions}
        initialSubmitted={!!isDone}
      />
    );
  }

  // 处理按钮点击
  const handleButtonClick = () => {
    if (completed) {
      viewExercise(exerciseUuid);
    } else {
      startExercise(exerciseUuid);
    }
  };

  return (
    <div className={`rounded-xl p-4 border transition-all duration-200 hover:shadow-md ${completed
        ? correct
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200/50'
          : 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200/50'
        : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/50'
      }`}>
      <div className="flex items-center gap-3">
        {/* 状态图标 */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${completed
            ? correct
              ? 'bg-green-100'
              : 'bg-orange-100'
            : 'bg-blue-100'
          }`}>
          {completed ? (
            correct ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <Trophy className="w-5 h-5 text-orange-600" />
            )
          ) : (
            <Clock className="w-5 h-5 text-blue-600" />
          )}
        </div>

        {/* 练习题信息 */}
        <div className="flex-1 min-w-0">
          <div className={`font-medium truncate ${completed
              ? correct
                ? 'text-green-900'
                : 'text-orange-900'
              : 'text-blue-900'
            }`}>
            {title}
          </div>
          <div className={`text-sm ${completed
              ? correct
                ? 'text-green-600'
                : 'text-orange-600'
              : 'text-blue-600'
            }`}>
            {completed
              ? `已完成 • ${correct ? '正确' : '需要改进'}`
              : '等待完成'
            }
          </div>
        </div>

        {/* 操作按钮 */}
        <Button
          onClick={handleButtonClick}
          size="sm"
          className={`shrink-0 ${completed
              ? correct
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-orange-600 hover:bg-orange-700'
              : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
        >
          {completed ? '查看' : '开始'}
        </Button>
      </div>
    </div>
  );
}; 