import React from 'react';
import { MultipleChoiceExerciseComponent } from './commonExercise/MultipleChoiceExercise.tsx';
import { SingleChoiceExerciseComponent } from './commonExercise/SingleChoiceExercise.tsx';
import { FillBlankExerciseComponent } from './commonExercise/FillBlankExercise.tsx';
import { TrueFalseExerciseComponent } from './commonExercise/TrueFalseExercise.tsx';
import { ProgrammingExercise } from './codeExercise/ProgrammingExercise.tsx';
import { useExerciseContext } from '../context/ExerciseContext.tsx';

// 练习题Props接口
interface ExerciseProps {
  exerciseId: string;
  onComplete?: (result: any) => void;
}

/**
 * 统一练习题组件 - 仅负责根据题型路由到对应组件
 * 不包含任何业务逻辑，各题型组件独立处理提交、结果展示等
 */
export const UnifiedExerciseComponent: React.FC<ExerciseProps> = ({
  exerciseId,
  onComplete
}) => {
  const { exerciseDataMap } = useExerciseContext();
  const exerciseData = exerciseDataMap.get(exerciseId);
  const exerciseType = exerciseData?.type;

  // exerciseData 
  console.log(`UnifiedExerciseComponent - exerciseId: ${exerciseId}, exerciseType: ${exerciseType}, exerciseData:`, exerciseData);

  // 安全检查
  if (!exerciseData) {
    return (
      <div className="p-4 text-center text-gray-500">
        练习题数据加载中...
      </div>
    );
  }

  // 根据题型渲染对应组件
  const renderExerciseComponent = () => {
    console.log(`UnifiedExerciseComponent - Rendering exercise type: ${exerciseType} for exerciseId: ${exerciseId}`);
    switch (exerciseType) {
      case 'singleChoice':
        return (
          <SingleChoiceExerciseComponent
            exerciseId={exerciseId}
            exerciseData={exerciseData as any}
            onComplete={onComplete}
          />
        );
      case 'multipleChoice':
        return (
          <MultipleChoiceExerciseComponent
            exerciseId={exerciseId}
            exerciseData={exerciseData as any}
            onComplete={onComplete}
          />
        );

      case 'fillInBlank':
        return (
          <FillBlankExerciseComponent
            exerciseId={exerciseId}
            exerciseData={exerciseData as any}
            onComplete={onComplete}
          />
        );

      case 'trueFalse':
        return (
          <TrueFalseExerciseComponent
            exerciseId={exerciseId}
            exerciseData={exerciseData as any}
            onComplete={onComplete}
          />
        );

      case 'programming':
        return (
          <ProgrammingExercise
            exerciseData={exerciseData as any}
            onSubmitComplete={onComplete}
          />
        );

      default:
        return (
          <div className="p-4 text-center text-gray-500">
            不支持的练习题类型: {exerciseType}
          </div>
        );
    }
  };

  return (
    <div className={exerciseType === 'programming' ? "h-full flex flex-col" : "h-full flex flex-col"}>
      {renderExerciseComponent()}
    </div>
  );
};
