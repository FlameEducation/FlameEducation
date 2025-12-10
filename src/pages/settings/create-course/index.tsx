import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import SettingsLayout from '../components/SettingsLayout';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Settings,
  Play,
  Edit3,
  Clock,
  BarChart3,
  Layers,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ArrowLeftCircle,
  ArrowRightCircle
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import * as autoCourseApi from '@/api/autoCourse';
import { listAiProviders, AiProviderConfig } from '@/api/ai-provider';
import { CourseGenerationStatusVo } from '@/types/course-generation';
import { AutoCourseSessionVo, LessonDraft } from '@/types/course';
import { cn } from '@/lib/utils';
import { CourseGenerationTasks } from './CourseGenerationTasks';

type GenerationPhase = 'form' | 'generating-structure' | 'preview' | 'submitting' | 'success' | 'error';

const LessonItem = ({ lesson }: { lesson: LessonDraft }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-50 rounded-lg border border-slate-100 overflow-hidden transition-all hover:border-violet-200">
      <div 
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-violet-50/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-6 h-6 rounded-full bg-white border-2 border-violet-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
          {lesson.sequence}
        </div>
        <span className="flex-1 text-sm font-medium text-slate-700">{lesson.title}</span>
        <span className="text-xs text-slate-500 flex items-center gap-1 mr-2">
          <Clock className="w-3 h-3" />
          {Math.round(lesson.durationSeconds / 60)}分钟
        </span>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-3 text-sm border-t border-slate-100 bg-white/50">
            <div className="pt-3 text-slate-600 text-xs leading-relaxed">
                {lesson.description}
            </div>
            
            <div className="grid gap-3 pt-2">
                {/* 本节知识点 */}
                {lesson.currentLessonKnowledgePoints && lesson.currentLessonKnowledgePoints.length > 0 && (
                    <div className="bg-violet-50 rounded-md p-3 border border-violet-100">
                        <div className="flex items-center gap-2 text-violet-700 font-medium mb-2 text-xs">
                            <Lightbulb className="w-3.5 h-3.5" />
                            本节核心知识点
                        </div>
                        <ul className="space-y-1">
                            {lesson.currentLessonKnowledgePoints.map((point, idx) => (
                                <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    {/* 前序知识点 */}
                    {lesson.previousKnowledgePoints && lesson.previousKnowledgePoints.length > 0 && (
                        <div className="bg-slate-50 rounded-md p-3 border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-600 font-medium mb-2 text-xs">
                                <ArrowLeftCircle className="w-3.5 h-3.5" />
                                已学知识点关联
                            </div>
                            <ul className="space-y-1">
                                {lesson.previousKnowledgePoints.map((point, idx) => (
                                    <li key={idx} className="text-xs text-slate-500 flex items-start gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* 后续知识点 */}
                    {lesson.futureKnowledgePoints && lesson.futureKnowledgePoints.length > 0 && (
                        <div className="bg-slate-50 rounded-md p-3 border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-600 font-medium mb-2 text-xs">
                                <ArrowRightCircle className="w-3.5 h-3.5" />
                                后续知识点铺垫
                            </div>
                            <ul className="space-y-1">
                                {lesson.futureKnowledgePoints.map((point, idx) => (
                                    <li key={idx} className="text-xs text-slate-500 flex items-start gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const CreateCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GenerationPhase>('form');

  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('youth');
  const [complexity, setComplexity] = useState('moderate');
  const [chapterCount, setChapterCount] = useState(6);

  const [providerConfigs, setProviderConfigs] = useState<AiProviderConfig[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');

  const [sessionData, setSessionData] = useState<AutoCourseSessionVo | null>(null);
  const [status, setStatus] = useState<CourseGenerationStatusVo | null>(null);
  const [error, setError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editInstruction, setEditInstruction] = useState('');
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [showTasks, setShowTasks] = useState(false);

  // Advanced settings for generation
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [enableParallel, setEnableParallel] = useState(false);
  const [parallelThreads, setParallelThreads] = useState(4);

  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const maxRetriesRef = useRef(0);

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const data = await listAiProviders();
        setProviderConfigs(data);
        if (data.length > 0) {
          setSelectedProvider(data[0].providerName);
          if (data[0].models.length > 0) {
            setSelectedModel(data[0].models[0]);
          }
        }
      } catch (error) {
        console.error('加载服务商失败:', error);
      }
    };
    loadProviders();
  }, []);

  useEffect(() => {
    if (selectedProvider) {
      const provider = providerConfigs.find(p => p.providerName === selectedProvider);
      if (provider && provider.models.length > 0) {
        setSelectedModel(provider.models[0]);
      } else {
        setSelectedModel('');
      }
    }
  }, [selectedProvider, providerConfigs]);

  const handleStartGeneration = async () => {
    if (!topic.trim()) {
      setError('请输入课程主题');
      return;
    }
    if (!selectedProvider || !selectedModel) {
      setError('请选择AI服务商和模型');
      return;
    }

    try {
      setError('');
      setPhase('generating-structure');

      const response = await autoCourseApi.startCourseGeneration({
        topic: topic.trim(),
        targetAudience,
        complexity,
        language: 'zh',
        suggestedChapterCount: chapterCount,
        aiServiceProvider: selectedProvider,
        aiModelName: selectedModel,
      });

      setSessionData(response);
      setPhase('preview');
    } catch (err) {
      console.error('Failed to start course generation:', err);
      setError('课程生成失败，请重试');
      setPhase('error');
    }
  };

  const handleSubmitCourse = async () => {
    if (!sessionData) return;

    try {
      setError('');
      setPhase('submitting');
      maxRetriesRef.current = 0;

      await autoCourseApi.submitCourse(sessionData.sessionUuid, enableParallel, parallelThreads);
      startPolling(sessionData.sessionUuid);
    } catch (err) {
      console.error('Failed to submit course:', err);
      setError('提交课程失败，请重试');
      setPhase('error');
    }
  };

  const handleEditCourse = async () => {
    if (!sessionData || !editInstruction.trim()) {
      setError('请输入修改指令');
      return;
    }

    try {
      setError('');
      setIsEditingCourse(true);

      const response = await autoCourseApi.editCourse(sessionData.sessionUuid, editInstruction.trim());

      setSessionData(response);
      setEditInstruction('');
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to edit course:', err);
      setError('编辑课程失败，请重试');
    } finally {
      setIsEditingCourse(false);
    }
  };

  const startPolling = (uuid: string) => {
    const poll = async () => {
      try {
        const statusData = await autoCourseApi.getCourseGenerationStatus(uuid);
        setStatus(statusData);

        if (statusData.status === 'COMPLETED') {
          clearInterval(pollingIntervalRef.current);
          setPhase('success');
        } else if (statusData.status === 'FAILED') {
          clearInterval(pollingIntervalRef.current);
          setError(statusData.errorMessage || '课程生成失败');
          setPhase('error');
        }
      } catch (err) {
        console.error('Failed to fetch generation status:', err);
        maxRetriesRef.current++;
        if (maxRetriesRef.current > 30) {
          clearInterval(pollingIntervalRef.current);
          setError('获取生成状态失败，请刷新重试');
          setPhase('error');
        }
      }
    };

    poll();
    pollingIntervalRef.current = setInterval(poll, 2000);
  };

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return (
    <SettingsLayout title="创建课程" description="AI 智能生成课程">
      <div className="h-full">
        {/* Form Phase - Wizard Style */}
        {phase === 'form' && (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-3 py-8 relative">
              <div className="absolute right-0 top-0">
                <Button variant="outline" onClick={() => setShowTasks(true)}>
                  <Layers className="w-4 h-4 mr-2" />
                  查看生成任务
                </Button>
              </div>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 mb-4 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">AI 课程生成器</h1>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                只需简单几步，AI 将为您量身定制完整的课程体系
              </p>
            </div>

            {/* Main Form - Vertical Layout */}
            <div className="space-y-8">
              
              {/* Step 1: Topic */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-violet-100 text-violet-700 text-sm font-bold">1</span>
                  定义课程主题
                </h2>
                <Card className="border-2 border-slate-200 hover:border-violet-300 transition-colors">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">课程主题</h3>
                        <p className="text-sm text-slate-500">描述您要创建的课程内容</p>
                      </div>
                    </div>
                    <Textarea
                      placeholder="例如：全面的 Python 编程课程，涵盖从基础语法到高级特性，包括数据结构、算法、Web 开发和机器学习入门..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="min-h-[120px] text-base resize-none border-2 focus:border-violet-500"
                    />
                  </div>
                </Card>
              </div>

              {/* Step 2: Audience & Complexity */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-violet-100 text-violet-700 text-sm font-bold">2</span>
                  设定受众与难度
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Target Audience */}
                  <Card className="border-2 border-slate-200">
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <BarChart3 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">面向群体</h3>
                          <p className="text-sm text-slate-500">选择目标受众年龄段</p>
                        </div>
                      </div>
                      <Select value={targetAudience} onValueChange={setTargetAudience}>
                        <SelectTrigger className="w-full h-11 border-2">
                          <SelectValue placeholder="选择目标受众" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            { value: 'preschool', label: '学前儿童', age: '3-6岁' },
                            { value: 'children', label: '少年', age: '7-12岁' },
                            { value: 'teenager', label: '青少年', age: '13-17岁' },
                            { value: 'youth', label: '青年', age: '18-30岁' },
                            { value: 'adult', label: '成年', age: '31-50岁' },
                            { value: 'middleAged', label: '中年', age: '51-65岁' },
                            { value: 'elderly', label: '老年', age: '65岁以上' }
                          ].map(({ value, label, age }) => (
                            <SelectItem key={value} value={value}>
                              <span className="font-medium">{label}</span>
                              <span className="ml-2 text-slate-500 text-xs">({age})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </Card>

                  {/* Complexity */}
                  <Card className="border-2 border-slate-200">
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                          <Layers className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">复杂程度</h3>
                          <p className="text-sm text-slate-500">选择课程深度</p>
                        </div>
                      </div>
                      <Select value={complexity} onValueChange={setComplexity}>
                        <SelectTrigger className="w-full h-11 border-2">
                          <SelectValue placeholder="选择课程深度" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            { value: 'shallow', label: '浅显', desc: '基础概念，轻松入门' },
                            { value: 'moderate', label: '适中', desc: '循序渐进，系统学习' },
                            { value: 'comprehensive', label: '全面', desc: '完整体系，深入理解' },
                            { value: 'deep', label: '深度', desc: '专业深入，理论实践' }
                          ].map(({ value, label, desc }) => (
                            <SelectItem key={value} value={value}>
                              <span className="font-medium">{label}</span>
                              <span className="ml-2 text-slate-500 text-xs">- {desc}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Step 3: Chapter Count */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-violet-100 text-violet-700 text-sm font-bold">3</span>
                  调整课程规模
                </h2>
                <Card className="border-2 border-slate-200">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-slate-900">课程规模</h3>
                          <p className="text-sm text-slate-500">调整章节数量</p>
                        </div>
                        <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-bold">
                          {chapterCount} 章
                        </span>
                      </div>
                    </div>
                    <div className="pt-2">
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={chapterCount}
                        onChange={(e) => setChapterCount(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-violet-600"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-3">
                        <span>精简 (1~2章)</span>
                        <span>标准 (4~6章)</span>
                        <span>详尽 (9~12章)</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Step 4: AI Configuration */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-violet-100 text-violet-700 text-sm font-bold">4</span>
                  选择 AI 引擎
                </h2>
                <Card className="border-2 border-slate-200">
                  <div className="p-6 space-y-5">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Settings className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">AI 引擎配置</h3>
                        <p className="text-sm text-slate-500">选择生成模型</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">服务商</label>
                        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                          <SelectTrigger className="h-11 border-2">
                            <SelectValue placeholder="选择服务商" />
                          </SelectTrigger>
                          <SelectContent>
                            {providerConfigs.map(p => (
                              <SelectItem key={p.providerName} value={p.providerName}>
                                {p.providerName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">模型</label>
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                          <SelectTrigger className="h-11 border-2">
                            <SelectValue placeholder="选择模型" />
                          </SelectTrigger>
                          <SelectContent>
                            {providerConfigs.find(p => p.providerName === selectedProvider)?.models.map(m => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            )) || <SelectItem value="none" disabled>请先选择服务商</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-red-700">{error}</span>
                      </div>
                    )}

                    <Button
                      onClick={handleStartGeneration}
                      disabled={!topic.trim() || !selectedProvider || !selectedModel}
                      className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      开始生成课程
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Generating Phase */}
        {phase === 'generating-structure' && (
          <div className="h-full flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-8">
              <div className="relative w-40 h-40 mx-auto">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-400 to-purple-400 animate-ping opacity-20" />
                <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-2xl">
                  <Loader2 className="w-20 h-20 text-white animate-spin" />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-slate-900">AI 正在思考...</h2>
                <p className="text-xl text-slate-600">正在根据您的需求并构建课程结构，请稍候</p>
              </div>
            </div>
          </div>
        )}

        {/* Preview Phase */}
        {phase === 'preview' && sessionData && (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="bg-violet-100 text-violet-700 border-violet-200">
                        预览
                      </Badge>
                      <Badge variant="outline">{sessionData.courseDraft.chapters.length} 章</Badge>
                      <Badge variant="outline">
                        {sessionData.courseDraft.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0)} 节
                      </Badge>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{sessionData.courseDraft.title}</h2>
                    <p className="text-slate-700 leading-relaxed">{sessionData.courseDraft.description}</p>
                  </div>
                </div>

                {!isEditing && (
                  <div className="flex flex-col gap-4">
                    {/* Advanced Settings Toggle */}
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)} className="text-slate-500">
                            {showAdvanced ? <ChevronUp className="w-4 h-4 mr-1"/> : <ChevronDown className="w-4 h-4 mr-1"/>}
                            高级设置
                        </Button>
                    </div>
                    
                    {showAdvanced && (
                        <div className="bg-white/50 p-4 rounded-lg border border-slate-200 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-medium text-slate-700">并行生成</label>
                                    <p className="text-xs text-slate-500">同时生成多个课时，加快生成速度</p>
                                </div>
                                <Switch checked={enableParallel} onCheckedChange={setEnableParallel} />
                            </div>
                            {enableParallel && (
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <label className="text-sm font-medium text-slate-700">并行线程数: {parallelThreads}</label>
                                    </div>
                                    <Slider 
                                        value={[parallelThreads]} 
                                        onValueChange={(v) => setParallelThreads(v[0])} 
                                        min={2} 
                                        max={10} 
                                        step={1} 
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                        className="border-2"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        调整结构
                      </Button>
                      <Button
                        onClick={handleSubmitCourse}
                        className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        确认生成
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Edit Panel */}
            {isEditing && (
              <Card className="border-2 border-amber-300 bg-amber-50">
                <div className="p-6 space-y-4">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Edit3 className="w-5 h-5" />
                    调整课程结构
                  </h3>
                  <Textarea
                    value={editInstruction}
                    onChange={(e) => setEditInstruction(e.target.value)}
                    placeholder="描述您想要的修改，例如：增加一章关于实战项目的内容..."
                    className="min-h-[100px] border-2 border-amber-300"
                  />
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditInstruction('');
                      }}
                      className="border-2"
                    >
                      取消
                    </Button>
                    <Button
                      onClick={handleEditCourse}
                      disabled={isEditingCourse || !editInstruction.trim()}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {isEditingCourse ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          处理中...
                        </>
                      ) : (
                        '应用修改'
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Chapter List */}
            <div className="grid gap-4">
              {sessionData.courseDraft.chapters.map((chapter, idx) => (
                <Card key={chapter.sequence} className="border-2 border-slate-200 hover:border-violet-300 transition-colors overflow-hidden">
                  <div className="flex">
                    {/* Chapter Index */}
                    <div className="w-20 bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">{chapter.sequence}</span>
                    </div>
                    {/* Chapter Content */}
                    <div className="flex-1 p-6">
                      <h4 className="text-lg font-bold text-slate-900 mb-2">{chapter.title}</h4>
                      <p className="text-sm text-slate-600 mb-4">{chapter.description}</p>
                      <div className="space-y-2">
                        {chapter.lessons.map((lesson) => (
                          <LessonItem key={lesson.sequence} lesson={lesson} />
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Submitting Phase */}
        {phase === 'submitting' && status && (
          <div className="h-full flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-3xl text-center space-y-10">
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-400 to-purple-400 animate-ping opacity-20" />
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-2xl">
                  <Loader2 className="w-16 h-16 text-white animate-spin" />
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-slate-900">正在生成完整课程</h2>
                <p className="text-2xl text-slate-600">{status.stepDescription}</p>
              </div>

              <div className="space-y-8 max-w-xl mx-auto">
                <div className="space-y-2">
                  <div className="flex justify-between text-base font-medium">
                    <span className="text-slate-700">总体进度</span>
                    <span className="text-violet-600">{Math.round(status.progress)}%</span>
                  </div>
                  <Progress value={status.progress} className="h-4" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-600">步骤进度</span>
                    <span className="text-slate-500">{status.completedSteps} / {status.totalSteps}</span>
                  </div>
                  <Progress value={(status.completedSteps / status.totalSteps) * 100} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Phase */}
        {phase === 'success' && status && (
          <div className="h-full flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-10">
              <div className="relative w-40 h-40 mx-auto">
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20" />
                <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-2xl">
                  <CheckCircle2 className="w-20 h-20 text-white" />
                </div>
              </div>
              
              <div className="space-y-6">
                <h2 className="text-5xl font-bold text-slate-900">课程创建成功！</h2>
                <p className="text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                  {status.generatedCourseTitle}
                </p>
                <div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-lg px-4 py-1">
                    已发布
                  </Badge>
                </div>
              </div>

              <div className="flex gap-6 justify-center pt-8">
                <Button
                  onClick={() => navigate('/settings/courses')}
                  size="lg"
                  className="h-14 px-8 text-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transition-all"
                >
                  查看课程
                </Button>
                <Button
                  onClick={() => {
                    setPhase('form');
                    setTopic('');
                    setTargetAudience('youth');
                    setComplexity('moderate');
                    setChapterCount(6);
                    setStatus(null);
                  }}
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-lg border-2 hover:bg-slate-50"
                >
                  继续创建
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error Phase */}
        {phase === 'error' && (
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-red-200 bg-red-50">
              <div className="p-12 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">生成失败</h2>
                  <p className="text-slate-600">{error}</p>
                </div>
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => {
                      setPhase('form');
                      setError('');
                      setStatus(null);
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    重新开始
                  </Button>
                  <Button
                    onClick={() => navigate('/settings/courses')}
                    variant="outline"
                    className="border-2"
                  >
                    返回列表
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
      <CourseGenerationTasks open={showTasks} onOpenChange={setShowTasks} />
    </SettingsLayout>
  );
};

export default CreateCoursePage;
