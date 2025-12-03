import React, { useEffect } from 'react';
import { ExerciseProvider, useExerciseContext } from '@/pages/chat/context/ExerciseContext';
import { UnifiedExerciseComponent } from '@/pages/chat/components/UnifiedExerciseComponent';
import { NoAnswerChoiceCard } from '@/pages/chat/Layout/Chat/History/ai/NoAnswerChoiceCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExerciseResultData } from '@/api/exercise';

// 测试数据
const testExercises: Record<string, ExerciseResultData> = {
  'single-choice-1': {
    uuid: 'single-choice-1',
    type: 'singleChoice',
    title: '酸碱性选择题',
    question: '柠檬汁中含有柠檬酸，因此是酸性的。肥皂水是碱性的，纯净水和食盐水是中性的。',
    options: {
      'A': 'O2',
      'B': 'CO2',
      'C': 'H2O',
      'D': 'N2'
    },
    answer: ['B'],
    userAnswer: [],
    submitted: false,
    correct: false,
    explanation: 'CO2（二氧化碳）是植物进行光合作用的原料之一。植物通过叶片上的气孔吸收空气中的二氧化碳，在叶绿体中利用光能将其转化为有机物。'
  },
  'single-choice-completed': {
    uuid: 'single-choice-completed',
    type: 'singleChoice',
    title: '光合作用原料（已完成-正确）',
    question: '植物进行光合作用需要的主要原料是？',
    options: {
      'A': 'O2',
      'B': 'CO2',
      'C': 'H2O',
      'D': 'N2'
    },
    answer: ['B'],
    userAnswer: ['B'],
    submitted: true,
    correct: true,
    explanation: 'CO2（二氧化碳）是植物进行光合作用的原料之一。'
  },
  'single-choice-wrong': {
    uuid: 'single-choice-wrong',
    type: 'singleChoice',
    title: '光合作用原料（已完成-错误）',
    question: '植物进行光合作用需要的主要原料是？',
    options: {
      'A': 'O2',
      'B': 'CO2',
      'C': 'H2O',
      'D': 'N2'
    },
    answer: ['B'],
    userAnswer: ['A'],
    submitted: true,
    correct: false,
    explanation: 'CO2（二氧化碳）是植物进行光合作用的原料之一，而O2是产物。'
  },
  'multiple-choice-1': {
    uuid: 'multiple-choice-1',
    type: 'multipleChoice',
    title: '哺乳动物特征',
    question: '以下哪些是哺乳动物的特征？（多选）',
    options: {
      'A': '胎生',
      'B': '哺乳',
      'C': '恒温',
      'D': '冷血'
    },
    answer: ['A', 'B', 'C'],
    userAnswer: [],
    submitted: false,
    correct: false,
    explanation: '哺乳动物的主要特征包括：胎生、哺乳、恒温。冷血是爬行动物和两栖动物的特征。'
  },
  'multiple-choice-completed': {
    uuid: 'multiple-choice-completed',
    type: 'multipleChoice',
    title: '哺乳动物特征（已完成-正确）',
    question: '以下哪些是哺乳动物的特征？（多选）',
    options: {
      'A': '胎生',
      'B': '哺乳',
      'C': '恒温',
      'D': '冷血'
    },
    answer: ['A', 'B', 'C'],
    userAnswer: ['A', 'B', 'C'],
    submitted: true,
    correct: true,
    explanation: '哺乳动物的主要特征包括：胎生、哺乳、恒温。'
  },
  'multiple-choice-wrong': {
    uuid: 'multiple-choice-wrong',
    type: 'multipleChoice',
    title: '哺乳动物特征（已完成-部分错误）',
    question: '以下哪些是哺乳动物的特征？（多选）',
    options: {
      'A': '胎生',
      'B': '哺乳',
      'C': '恒温',
      'D': '冷血'
    },
    answer: ['A', 'B', 'C'],
    userAnswer: ['A', 'B', 'D'],
    submitted: true,
    correct: false,
    explanation: '哺乳动物的主要特征包括：胎生、哺乳、恒温。冷血是爬行动物和两栖动物的特征。'
  },
  'fill-blank-1': {
    uuid: 'fill-blank-1',
    type: 'fillInBlank',
    title: '年龄计算',
    question: '小明的年龄为${0}岁，他的妹妹比他小${1}岁。',
    answer: ['10', '2'],
    userAnswer: [],
    submitted: false,
    correct: false,
    explanation: '这是一道简单的年龄计算题，小明10岁，妹妹比他小2岁。'
  },
  'fill-blank-completed': {
    uuid: 'fill-blank-completed',
    type: 'fillInBlank',
    title: '年龄计算（已完成-正确）',
    question: '小明的年龄为${0}岁，他的妹妹比他小${1}岁。',
    answer: ['10', '2'],
    userAnswer: ['10', '2'],
    submitted: true,
    correct: true,
    explanation: '回答正确！小明10岁，妹妹8岁。'
  },
  'fill-blank-wrong': {
    uuid: 'fill-blank-wrong',
    type: 'fillInBlank',
    title: '年龄计算（已完成-错误）',
    question: '小明的年龄为${0}岁，他的妹妹比他小${1}岁。',
    answer: ['10', '2'],
    userAnswer: ['12', '3'],
    submitted: true,
    correct: false,
    explanation: '答案错误。正确答案是：小明10岁，妹妹比他小2岁。'
  },
  'true-false-1': {
    uuid: 'true-false-1',
    type: 'trueFalse',
    title: '地球形状判断',
    question: '地球是圆形的。',
    answer: ['A'],
    userAnswer: [],
    submitted: false,
    correct: false,
    explanation: '地球确实是圆形的（准确说是椭球形），这是由万有引力造成的。'
  },
  'true-false-completed': {
    uuid: 'true-false-completed',
    type: 'trueFalse',
    title: '地球形状判断（已完成-正确）',
    question: '地球是圆形的。',
    answer: ['A'],
    userAnswer: ['A'],
    submitted: true,
    correct: true,
    explanation: '回答正确！地球确实是圆形的。'
  },
  'true-false-wrong': {
    uuid: 'true-false-wrong',
    type: 'trueFalse',
    title: '地球形状判断（已完成-错误）',
    question: '地球是圆形的。',
    answer: ['A'],
    userAnswer: ['B'],
    submitted: true,
    correct: false,
    explanation: '回答错误。地球确实是圆形的（准确说是椭球形）。'
  }
};

// 无答案选择题测试数据
const noAnswerChoiceTests = {
  'no-answer-single': {
    type: 'noAnswerSingleChoice' as const,
    title: '请完成这个无答案单选题',
    question: '电车难题情况下，你会怎么选择？',
    options: {
      'A': '打开开关',
      'B': '不做任何事',
      'C': '跳下桥阻止电车',
      'D': '其他'
    },
    explanation: '这是一个无答案单选题的解释'
  },
  'no-answer-multiple': {
    type: 'noAnswerMultipleChoice' as const,
    title: '请完成这个无答案多选题',
    question: '在以下选项中，你会选择哪些作为你的兴趣爱好？',
    options: {
      'A': '阅读',
      'B': '旅行',
      'C': '运动',
      'D': '音乐'
    },
    explanation: '这是一个无答案多选题的解释'
  }
};

// 测试内容组件
const ExerciseTestContent: React.FC = () => {
  const { addExerciseData, setCurrentExerciseId, setRightPanelExerciseId, rightPanelExerciseId } = useExerciseContext();
  const [activeTab, setActiveTab] = React.useState<'standard' | 'noAnswer'>('standard');
  const [selectedNoAnswerTest, setSelectedNoAnswerTest] = React.useState<string | null>(null);

  // 初始化测试数据
  useEffect(() => {
    Object.entries(testExercises).forEach(([id, data]) => {
      addExerciseData(id, data);
    });
  }, [addExerciseData]);

  // 加载练习题
  const loadExercise = (exerciseId: string) => {
    setActiveTab('standard');
    setSelectedNoAnswerTest(null);
    setCurrentExerciseId(exerciseId);
    setRightPanelExerciseId(exerciseId);
  };

  // 加载无答案选择题
  const loadNoAnswerChoice = (testKey: string) => {
    setActiveTab('noAnswer');
    setSelectedNoAnswerTest(testKey);
    setCurrentExerciseId(null);
    setRightPanelExerciseId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">练习题统一测试</h1>
          <p className="text-gray-600">
            通过 ExerciseContext 测试所有类型的练习题组件，包括标准练习题和无答案选择题
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：练习题选择器 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>选择练习题</CardTitle>
                <CardDescription>点击加载不同类型和状态的练习题</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="standard" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="standard">标准练习题</TabsTrigger>
                    <TabsTrigger value="noAnswer">无答案选择题</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="standard" className="space-y-4">
                    <Tabs defaultValue="single" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="single">单选</TabsTrigger>
                        <TabsTrigger value="multiple">多选</TabsTrigger>
                      </TabsList>
                  
                  <TabsContent value="single" className="space-y-2 mt-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => loadExercise('single-choice-1')}
                    >
                      未完成
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-green-600"
                      onClick={() => loadExercise('single-choice-completed')}
                    >
                      已完成-正确
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600"
                      onClick={() => loadExercise('single-choice-wrong')}
                    >
                      已完成-错误
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="multiple" className="space-y-2 mt-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => loadExercise('multiple-choice-1')}
                    >
                      未完成
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-green-600"
                      onClick={() => loadExercise('multiple-choice-completed')}
                    >
                      已完成-正确
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600"
                      onClick={() => loadExercise('multiple-choice-wrong')}
                    >
                      已完成-部分错误
                    </Button>
                  </TabsContent>
                </Tabs>

                <Tabs defaultValue="fill" className="w-full mt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="fill">填空</TabsTrigger>
                    <TabsTrigger value="judge">判断</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="fill" className="space-y-2 mt-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => loadExercise('fill-blank-1')}
                    >
                      未完成
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-green-600"
                      onClick={() => loadExercise('fill-blank-completed')}
                    >
                      已完成-正确
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600"
                      onClick={() => loadExercise('fill-blank-wrong')}
                    >
                      已完成-错误
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="judge" className="space-y-2 mt-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => loadExercise('true-false-1')}
                    >
                      未完成
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-green-600"
                      onClick={() => loadExercise('true-false-completed')}
                    >
                      已完成-正确
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600"
                      onClick={() => loadExercise('true-false-wrong')}
                    >
                      已完成-错误
                    </Button>
                  </TabsContent>
                </Tabs>
                  </TabsContent>
                  
                  <TabsContent value="noAnswer" className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => loadNoAnswerChoice('no-answer-single')}
                    >
                      无答案单选题
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => loadNoAnswerChoice('no-answer-multiple')}
                    >
                      无答案多选题
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：练习题展示区域 */}
          <div className="lg:col-span-2">
            <Card className="h-[700px]">
              <CardContent className="p-0 h-full">
                {activeTab === 'standard' && rightPanelExerciseId ? (
                  <UnifiedExerciseComponent exerciseId={rightPanelExerciseId} />
                ) : activeTab === 'noAnswer' && selectedNoAnswerTest ? (
                  <div className="p-6">
                    <NoAnswerChoiceCard
                      data={noAnswerChoiceTests[selectedNoAnswerTest as keyof typeof noAnswerChoiceTests]}
                      onSubmit={(selectedOptions) => {
                        console.log('用户选择:', selectedOptions);
                        alert(`你选择了: ${selectedOptions.join(', ')}`);
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>请从左侧选择一个练习题进行测试</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// 主组件
const UnifiedExerciseTest: React.FC = () => {
  return (
    <ExerciseProvider>
      <ExerciseTestContent />
    </ExerciseProvider>
  );
};

export default UnifiedExerciseTest;
