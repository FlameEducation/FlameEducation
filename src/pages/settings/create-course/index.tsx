import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import SettingsLayout from '../components/SettingsLayout';
import {
  ArrowLeft,
  Loader,
  CheckCircle,
  AlertCircle,
  Zap,
  GraduationCap,
  Eye
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import * as autoCourseApi from '@/api/autoCourse';
import { CourseGenerationStatusVo } from '@/types/course-generation';
import { AutoCourseSessionVo } from '@/types/course';
import { cn } from '@/lib/utils';

type GenerationPhase = 'form' | 'generating-structure' | 'preview' | 'submitting' | 'success' | 'error';

const CreateCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GenerationPhase>('form');

  // 表单字段
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [chapterCount, setChapterCount] = useState(3);

  // 生成状态
  const [sessionData, setSessionData] = useState<AutoCourseSessionVo | null>(null);
  const [status, setStatus] = useState<CourseGenerationStatusVo | null>(null);
  const [error, setError] = useState('');

  // 编辑功能
  const [isEditing, setIsEditing] = useState(false);
  const [editInstruction, setEditInstruction] = useState('');
  const [isEditingCourse, setIsEditingCourse] = useState(false);

  // 轮询
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const maxRetriesRef = useRef(0);

  // 开始课程生成
  const handleStartGeneration = async () => {
    if (!topic.trim()) {
      setError('请输入课程主题');
      return;
    }

    try {
      setError('');
      setPhase('generating-structure');

      // 调用后端开始生成
      const response = await autoCourseApi.startCourseGeneration({
        topic: topic.trim(),
        difficulty,
        language: 'zh',
        suggestedChapterCount: chapterCount,
      });

      // 生成完成，显示预览
      setSessionData(response);
      setPhase('preview');
    } catch (err) {
      console.error('Failed to start course generation:', err);
      setError('课程生成失败，请重试');
      setPhase('error');
    }
  };

  // 提交课程生成
  const handleSubmitCourse = async () => {
    if (!sessionData) return;

    try {
      setError('');
      setPhase('submitting');
      maxRetriesRef.current = 0;

      // 调用提交接口
      await autoCourseApi.submitCourse(sessionData.sessionUuid);

      // 开始轮询状态
      startPolling(sessionData.sessionUuid);
    } catch (err) {
      console.error('Failed to submit course:', err);
      setError('提交课程失败，请重试');
      setPhase('error');
    }
  };

  // 编辑课程结构
  const handleEditCourse = async () => {
    if (!sessionData || !editInstruction.trim()) {
      setError('请输入修改指令');
      return;
    }

    try {
      setError('');
      setIsEditingCourse(true);

      // 调用编辑接口
      const response = await autoCourseApi.editCourse(sessionData.sessionUuid, editInstruction.trim());

      // 更新课程数据
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

  // 开始轮询
  const startPolling = (uuid: string) => {
    const poll = async () => {
      try {
        const statusData = await autoCourseApi.getCourseGenerationStatus(uuid);
        setStatus(statusData);

        // 检查生成状态
        if (statusData.status === 'COMPLETED') {
          clearInterval(pollingIntervalRef.current);
          setPhase('success');
        } else if (statusData.status === 'FAILED') {
          clearInterval(pollingIntervalRef.current);
          setError(statusData.errorMessage || '课程生成失败');
          setPhase('error');
        }
        // 继续轮询 GENERATING 状态
      } catch (err) {
        console.error('Failed to fetch generation status:', err);
        maxRetriesRef.current++;
        if (maxRetriesRef.current > 30) { // 30次失败后停止轮询
          clearInterval(pollingIntervalRef.current);
          setError('获取生成状态失败，请刷新重试');
          setPhase('error');
        }
      }
    };

    // 立即执行一次
    poll();

    // 每 2 秒轮询一次
    pollingIntervalRef.current = setInterval(poll, 2000);
  };

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return (

    <SettingsLayout
      title="创建课程"
      description="创建新的 AI 课程"
    >

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50">
        {/* 主容器 */}
        <div className="container mx-auto px-4 py-6 md:py-8 max-w-2xl">
          {phase === 'form' && (
            <Card className="p-6 md:p-8 space-y-6 max-w-3xl mx-auto">
              {/* 表单标题 */}
              <div className="text-center">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-2xl md:text-3xl">✨</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">AI 智能生成课程</h2>
                <p className="text-sm md:text-base text-slate-600">只需几步，让 AI 为您创建专业的课程结构</p>
              </div>

              {/* 表单字段 */}
              <div className="space-y-6">
                {/* 课程主题 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span>📚</span>
                    课程主题 *
                  </label>
                  <Input
                    placeholder="例如：Python 从入门到精通、前端开发实战、数据结构与算法..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="text-base h-12 border-2 focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <span>💡</span>
                    描述越详细，生成的课程越符合您的需求
                  </p>
                </div>

                {/* 难度等级 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span>🎯</span>
                    难度等级
                  </label>
                  <div className="grid grid-cols-3 gap-2 md:gap-3">
                    {[
                      { value: 'easy', label: '初级', icon: '🌱', desc: '零基础入门' },
                      { value: 'medium', label: '中级', icon: '🌿', desc: '有一定基础' },
                      { value: 'hard', label: '高级', icon: '🌳', desc: '深入进阶' }
                    ].map(({ value, label, icon, desc }) => (
                      <button
                        key={value}
                        onClick={() => setDifficulty(value)}
                        className={cn(
                          'px-4 py-4 rounded-xl font-medium transition-all border-2 flex flex-col items-center gap-2',
                          difficulty === value
                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-blue-600 shadow-lg scale-105'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:shadow-md'
                        )}
                      >
                        <span className="text-2xl">{icon}</span>
                        <span className="font-bold">{label}</span>
                        <span className="text-xs opacity-80">{desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 建议章节数 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span>📖</span>
                    建议章节数
                  </label>
                  <div className="bg-slate-50 rounded-xl p-4 md:p-6 border-2 border-slate-200">
                    <div className="flex items-center gap-3 md:gap-4 mb-4">
                      <input
                        type="range"
                        min="2"
                        max="12"
                        value={chapterCount}
                        onChange={(e) => setChapterCount(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                      />
                      <div className="w-16 md:w-20 h-10 md:h-12 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg md:text-lg shadow-lg flex-shrink-0">
                        {chapterCount}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>精简 (2章)</span>
                      <span className="hidden md:block">适中 (6章)</span>
                      <span>详尽 (12章)</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <span>💡</span>
                    系统会根据主题自动优化章节数量和结构
                  </p>
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3 animate-shake">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-700 font-medium">{error}</span>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex flex-col md:flex-row gap-3 md:gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1 h-12 border-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回首页
                </Button>
                <Button
                  onClick={handleStartGeneration}
                  className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all text-base font-semibold"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  开始生成课程
                </Button>
              </div>

              {/* 功能说明 */}
              <div className="grid grid-cols-3 gap-2 md:gap-4 pt-6 border-t">
                {[
                  { icon: '🤖', title: 'AI 智能设计', desc: '基于主题自动规划' },
                  { icon: '⚡', title: '快速生成', desc: '仅需几秒钟' },
                  { icon: '✏️', title: '灵活编辑', desc: '随时调整结构' }
                ].map((feature, index) => (
                  <div key={index} className="text-center p-4">
                    <div className="text-3xl mb-2">{feature.icon}</div>
                    <div className="font-semibold text-slate-800 text-sm mb-1">{feature.title}</div>
                    <div className="text-xs text-slate-500">{feature.desc}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {phase === 'generating-structure' && (
            <Card className="p-12 space-y-8">
              {/* 生成结构中 */}
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 animate-ping opacity-20"></div>
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center animate-pulse shadow-2xl">
                    <Loader className="w-12 h-12 text-white animate-spin" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-3">AI 正在创造中...</h2>
                <p className="text-lg text-slate-600">正在分析您的需求并智能设计课程结构</p>

                {/* 进度动画 */}
                <div className="mt-8 flex justify-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full bg-blue-600 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </Card>
          )}

          {phase === 'preview' && sessionData && (
            <div className="space-y-6">
              <Card className="p-8 space-y-6">
                {/* 课程预览标题 */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">📚 课程结构预览</h2>
                    <p className="text-slate-600">AI 已为您生成课程结构，可以继续编辑或直接提交生成完整课程</p>
                  </div>
                </div>

                {/* 课程基本信息 */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🎓</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-800 mb-2">{sessionData.courseDraft.title}</h3>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{sessionData.courseDraft.description}</p>

                      {/* 课程统计 */}
                      <div className="flex flex-wrap gap-4 mt-4">
                        <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                          <span className="text-blue-600 font-semibold">{sessionData.courseDraft.chapters.length}</span>
                          <span className="text-sm text-slate-600">章节</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                          <span className="text-blue-600 font-semibold">
                            {sessionData.courseDraft.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0)}
                          </span>
                          <span className="text-sm text-slate-600">课时</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                          <span className="text-blue-600 font-semibold">
                            ~{Math.round(sessionData.courseDraft.chapters.reduce((acc, ch) =>
                              acc + ch.lessons.reduce((sum, l) => sum + l.durationSeconds, 0), 0) / 60)}
                          </span>
                          <span className="text-sm text-slate-600">分钟</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 错误提示 */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                )}

                {/* 编辑区域 */}
                {isEditing && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">✏️</span>
                      <h4 className="font-semibold text-slate-800">编辑课程结构</h4>
                    </div>
                    <p className="text-sm text-slate-600">
                      请用自然语言描述您想要的修改，例如：
                    </p>
                    <ul className="text-sm text-slate-600 list-disc list-inside space-y-1 ml-2">
                      <li>"增加一章关于高级特性的内容"</li>
                      <li>"把第一章拆分为两章，内容更详细些"</li>
                      <li>"增加更多实战练习课时"</li>
                    </ul>
                    <textarea
                      value={editInstruction}
                      onChange={(e) => setEditInstruction(e.target.value)}
                      placeholder="输入您的修改建议..."
                      className="w-full px-4 py-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                      rows={4}
                    />
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditInstruction('');
                          setError('');
                        }}
                        className="flex-1"
                      >
                        取消
                      </Button>
                      <Button
                        onClick={handleEditCourse}
                        disabled={isEditingCourse || !editInstruction.trim()}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        {isEditingCourse ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            AI 优化中...
                          </>
                        ) : (
                          '应用修改'
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                {!isEditing && (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPhase('form');
                        setSessionData(null);
                      }}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      重新生成
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      ✏️ 编辑结构
                    </Button>
                    <Button
                      onClick={handleSubmitCourse}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      确认并生成
                    </Button>
                  </div>
                )}
              </Card>

              {/* 章节列表 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <span>📖</span>
                    课程目录
                  </h3>
                  <span className="text-sm text-slate-500">
                    {sessionData.courseDraft.chapters.length} 章 · {sessionData.courseDraft.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0)} 节课
                  </span>
                </div>

                {sessionData.courseDraft.chapters.map((chapter) => (
                  <Card key={chapter.sequence} className="overflow-hidden hover:shadow-md transition-shadow">
                    {/* 章节头部 */}
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b border-slate-200">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                          {chapter.sequence}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800 text-lg mb-1">{chapter.title}</h4>
                          <p className="text-sm text-slate-600 leading-relaxed">{chapter.description}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                            <span>📝 {chapter.lessons.length} 节课</span>
                            <span>⏱️ ~{Math.round(chapter.lessons.reduce((sum, l) => sum + l.durationSeconds, 0) / 60)} 分钟</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 课时列表 */}
                    <div className="px-6 py-4 space-y-3">
                      {chapter.lessons.map((lesson) => (
                        <div
                          key={lesson.sequence}
                          className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                        >
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-sm font-semibold text-slate-400 min-w-[2rem]">
                              {chapter.sequence}.{lesson.sequence}
                            </span>
                            <div className="w-2 h-2 rounded-full bg-blue-400 group-hover:bg-blue-600 transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
                              {lesson.title}
                            </h5>
                            {lesson.description && (
                              <p className="text-sm text-slate-600 mt-1 line-clamp-2">{lesson.description}</p>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded flex-shrink-0">
                            {Math.round(lesson.durationSeconds / 60)}分钟
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>

              {/* 底部提示 */}
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div className="flex-1 text-sm text-slate-700">
                    <p className="font-medium mb-1">温馨提示</p>
                    <p>确认后将为每节课生成详细的教学大纲和内容结构，预计需要 1-3 分钟。</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {phase === 'submitting' && status && (
            <Card className="p-12 space-y-8 bg-gradient-to-br from-blue-50 to-indigo-50">{/* 生成中标题 */}
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 animate-ping opacity-20"></div>
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center animate-pulse shadow-2xl">
                    <Zap className="w-12 h-12 text-white animate-pulse" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                  AI 正在创作完整课程...
                </h2>
                <p className="text-lg text-slate-600">正在为您智能设计课程结构和内容</p>
              </div>

              {/* 进度显示 */}
              <div className="space-y-6">
                {/* 整体进度条 */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-base font-semibold text-slate-800">总体进度</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {Math.round(status.progress)}%
                    </span>
                  </div>
                  <Progress value={status.progress} className="h-4 bg-slate-100" />
                </div>

                {/* 步骤进度 */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-base font-semibold text-slate-800">步骤进度</span>
                    <span className="text-sm text-slate-600 font-medium">
                      {status.completedSteps} / {status.totalSteps} 已完成
                    </span>
                  </div>
                  <Progress
                    value={(status.completedSteps / status.totalSteps) * 100}
                    className="h-3 bg-slate-100"
                  />
                </div>
              </div>

              {/* 当前步骤信息 */}
              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl p-6 border-2 border-blue-200 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Loader className="w-5 h-5 text-white animate-spin" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 mb-2 text-lg">
                      {getStepLabel(status.currentStep)}
                    </p>
                    <p className="text-slate-700">{status.stepDescription}</p>
                  </div>
                </div>
              </div>

              {/* 课程信息摘要 */}
              <div className="bg-white rounded-xl p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-800">课程信息</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 min-w-[80px]">课程主题</span>
                    <span className="font-medium text-slate-800">{topic}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 min-w-[80px]">难度等级</span>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                      {difficulty === 'easy' ? '初级' : difficulty === 'medium' ? '中级' : '高级'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 min-w-[80px]">建议章节</span>
                    <span className="font-medium text-slate-800">{chapterCount} 章</span>
                  </div>
                </div>
              </div>

              {/* 提示 */}
              <div className="bg-amber-50 rounded-xl p-5 border-2 border-amber-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <p className="text-amber-800 flex-1">
                    正在为每节课生成详细大纲，可能需要 1-3 分钟，请耐心等待。生成过程中请不要关闭页面。
                  </p>
                </div>
              </div>
            </Card>
          )}

          {phase === 'success' && status && (
            <Card className="p-12 space-y-8 bg-gradient-to-br from-green-50 to-emerald-50">
              {/* 成功标题 */}
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mx-auto shadow-2xl">
                    <CheckCircle className="w-14 h-14 text-white" />
                  </div>
                  <div className="absolute inset-0 -z-10 w-24 h-24 rounded-full bg-green-400 animate-ping opacity-20 mx-auto"></div>
                </div>

                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                  🎉 课程生成完成！
                </h2>
                <p className="text-lg text-slate-600 mb-8">
                  您的 AI 课程已成功创建，快去查看吧！
                </p>

                {status.generatedCourseTitle && (
                  <div className="bg-white rounded-xl p-6 shadow-lg mb-8 border border-green-100">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <GraduationCap className="w-6 h-6 text-green-600" />
                      <h3 className="text-xl font-bold text-slate-800">
                        {status.generatedCourseTitle}
                      </h3>
                    </div>
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1">
                      已发布
                    </Badge>
                  </div>
                )}
              </div>

              {/* 生成结果 */}
              <div className="bg-white rounded-xl p-6 border border-green-100 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-800">课程标题</p>
                    <p className="text-slate-600">{status.generatedCourseTitle}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-800">UUID</p>
                    <p className="text-sm text-slate-600 font-mono break-all">{status.generatedCourseUuid}</p>
                  </div>
                </div>
              </div>

              {/* 后续操作 */}
              <div className="space-y-3">
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => navigate('/settings/courses')}
                    size="lg"
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 px-8"
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    返回课程管理
                  </Button>
                  <Button
                    onClick={() => {
                      setPhase('form');
                      setTopic('');
                      setDifficulty('medium');
                      setChapterCount(3);
                      setStatus(null);
                    }}
                    variant="outline"
                    size="lg"
                    className="border-2 border-slate-300 hover:border-green-500 hover:bg-green-50 px-8 transition-all duration-300"
                  >
                    继续创建课程
                  </Button>
                </div>
                <div className="text-center">
                  <Button
                    onClick={() => navigate('/settings/courses')}
                    variant="ghost"
                    className="text-slate-600 hover:text-slate-800"
                  >
                    返回课程管理
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {phase === 'error' && (
            <Card className="p-8 space-y-6">
              {/* 错误标题 */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">课程生成失败</h2>
                <p className="text-slate-600">很遗憾，课程生成过程中出现了问题</p>
              </div>

              {/* 错误信息 */}
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setPhase('form');
                    setError('');
                    setStatus(null);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  重新尝试
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="flex-1"
                >
                  返回首页
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

    </SettingsLayout>
  );
};

// 辅助函数：获取步骤描述
function getStepLabel(step: string): string {
  const labels: Record<string, string> = {
    'STRUCTURE_COMPLETED': '课程结构已生成',
    'PERSISTING': '开始持久化课程数据',
    'GENERATING_OUTLINES': '生成课程大纲',
    'PERSISTED': '课程数据已保存',
  };
  return labels[step] || '处理中...';
}

export default CreateCoursePage;
