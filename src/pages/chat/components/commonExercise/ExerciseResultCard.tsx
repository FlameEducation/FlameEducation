import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

interface ExerciseResultCardProps {
  isCorrect: boolean;
  explanation: string;
  score?: number;
}

export const ExerciseResultCard: React.FC<ExerciseResultCardProps> = ({
  isCorrect,
  explanation,
  score
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`border-2 rounded-lg p-3 sm:p-4 mb-3 ${
        isCorrect 
          ? 'bg-green-50 border-green-300' 
          : 'bg-red-50 border-red-300'
      }`}
    >
      {/* 结果标题 */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
          isCorrect ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {isCorrect ? (
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          ) : (
            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          )}
        </div>
        <div className="flex-1">
          <h3 className={`text-sm sm:text-base font-bold ${
            isCorrect ? 'text-green-900' : 'text-red-900'
          }`}>
            {isCorrect ? '✓ 回答正确！' : '✗ 回答错误'}
          </h3>
          {score !== undefined && (
            <p className={`text-xs ${
              isCorrect ? 'text-green-700' : 'text-red-700'
            }`}>
              得分：{score}分
            </p>
          )}
        </div>
      </div>

      {/* 解析内容 */}
      {explanation && (
        <div className={`border-t pt-2 ${
          isCorrect ? 'border-green-200' : 'border-red-200'
        }`}>
          <h4 className={`text-xs font-semibold mb-1.5 ${
            isCorrect ? 'text-green-900' : 'text-red-900'
          }`}>
            题目解析
          </h4>
          <p className={`text-xs leading-relaxed whitespace-pre-wrap ${
            isCorrect ? 'text-green-800' : 'text-red-800'
          }`}>
            {explanation}
          </p>
        </div>
      )}
    </motion.div>
  );
};
