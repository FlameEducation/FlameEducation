import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {Card} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Progress} from "@/components/ui/progress";
import {
  BookOpen,
  ChevronRight,
  Plus,
  PlayCircle
} from 'lucide-react';
import {api} from '@/api';
import {Course} from '@/types';
import { StandardCourseCard } from '@/components/courses/StandardCourseCard';
import { Badge } from "@/components/ui/badge";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [isLoadingMyCourses, setIsLoadingMyCourses] = useState(true);
  const [continueLearning, setContinueLearning] = useState<Course | null>(null);
  const [isLoadingContinueLearning, setIsLoadingContinueLearning] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(true);

  // 获取用户信息
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setIsLoadingUserInfo(true);
        const userInfo = await api.getCurrentUser();
        setUserInfo(userInfo);
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      } finally {
        setIsLoadingUserInfo(false);
      }
    };
    fetchUserInfo();
  }, []);

  // 获取我的课程
  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const response = await api.getCourseDetailList(3);
        setMyCourses(response);
      } catch (error) {
        console.error('Failed to fetch my courses:', error);
      } finally {
        setIsLoadingMyCourses(false);
      }
    };

    fetchMyCourses();
  }, []);

  // 获取继续学习数据
  useEffect(() => {
    const fetchContinueLearning = async () => {
      try {
        const courseRes = await api.getContinueLearning();
        if(courseRes){
          setContinueLearning(courseRes);
        }
      } catch (error) {
        console.error('Failed to fetch continue learning:', error);
      } finally {
        setIsLoadingContinueLearning(false);
      }
    };

    fetchContinueLearning();
  }, []);

  // 计算课程进度的函数
  const calculateProgress = (course: Course) => {
    if (!course.chapters) return 0;
    let totalLessons = 0;
    let completedLessons = 0;

    course.chapters.forEach(chapter => {
      if (chapter.lessons) {
        totalLessons += chapter.lessons.length;
        completedLessons += chapter.lessons.filter(l => l.isCompleted).length;
      }
    });

    return totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  };

  // 计算当前学习状态信息
  const getLearningStatus = (course: Course) => {
    if (!course.chapters || course.chapters.length === 0) {
      return {
        currentChapter: 0,
        remainingLessons: 0,
        isCompleted: false,
        currentLesson: null,
        currentChapterObj: null
      };
    }

    const currentChapterIndex = course.chapters.findIndex(
      chapter => chapter.lessons?.some(lesson => !lesson.isCompleted)
    );

    if (currentChapterIndex === -1) {
      return {
        currentChapter: course.chapters.length,
        remainingLessons: 0,
        isCompleted: true,
        currentLesson: null,
        currentChapterObj: null
      };
    }

    const currentChapter = course.chapters[currentChapterIndex];
    const currentLesson = currentChapter.lessons?.find(lesson => !lesson.isCompleted);
    const remainingLessons = currentChapter.lessons?.filter(lesson => !lesson.isCompleted).length || 0;

    return {
      currentChapter: currentChapterIndex + 1,
      remainingLessons,
      isCompleted: false,
      currentLesson,
      currentChapterObj: currentChapter
    };
  };

  const handleContinueLearning = (course: Course) => {
    const status = getLearningStatus(course);
    if (status.currentLesson && status.currentChapterObj) {
      window.location.href = `/course/learn?courseUuid=${course.uuid}&chapterUuid=${status.currentChapterObj.uuid}&lessonUuid=${status.currentLesson.uuid}`;
    } else {
      navigate(`/courses/${course.uuid}`);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* 欢迎卡片 */}
      <div className="p-8 bg-gray-900 text-white rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">
              {isLoadingUserInfo ? '欢迎回来' : `欢迎回来，${userInfo?.nickname || '学习者'}`}
            </h2>
            <p className="text-gray-300">今天也要开心学习哦～</p>
          </div>
        </div>
      </div>

      {/* 继续学习详细卡片 (如果存在) */}
      {isLoadingContinueLearning ? (
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
      ) : continueLearning && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">当前进度</h3>
          <Card 
            className="relative overflow-hidden border-none shadow-xl bg-slate-900 text-white cursor-pointer group min-h-[200px]"
            onClick={() => handleContinueLearning(continueLearning)}
          >
            {/* 背景图 - 使用课程封面 */}
            {continueLearning.coverImageUrl && (
                <div className="absolute inset-0 z-0">
                    <img 
                        src={continueLearning.coverImageUrl} 
                        alt="" 
                        className="w-full h-full object-cover opacity-40 blur-sm scale-105 group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
                </div>
            )}
            
            {/* 装饰背景 (无封面时显示) */}
            {!continueLearning.coverImageUrl && (
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-slate-800">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <BookOpen className="w-64 h-64 transform translate-x-12 -translate-y-12" />
                    </div>
                </div>
            )}
            
            <div className="relative z-10 p-6 flex flex-col h-full justify-between">
                {/* 顶部区域：标题和图标 */}
                <div className="flex items-start justify-between mb-6">
                    <div className="pr-12">
                        <h4 className="text-xl font-bold text-white mb-2 line-clamp-2 leading-relaxed">
                            {continueLearning.title}
                        </h4>
                        <p className="text-sm text-slate-300">
                            {(() => {
                                const status = getLearningStatus(continueLearning);
                                if (status.isCompleted) return '课程已完成';
                                return `第 ${status.currentChapter} 章 · 还需完成 ${status.remainingLessons} 节课`;
                            })()}
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                </div>

                {/* 底部区域：进度条和按钮 */}
                <div className="space-y-4 mt-auto">
                    <div className="flex justify-between items-end">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/10 shadow-sm">
                            <span className="text-xs text-slate-200 font-medium">总进度</span>
                            <span className="text-sm font-bold text-white">{Math.round(calculateProgress(continueLearning))}%</span>
                        </div>
                        
                        <Button 
                            size="sm" 
                            className="rounded-full px-5 bg-white text-slate-900 hover:bg-blue-50 font-medium h-9 text-xs shadow-lg shadow-black/10 transition-all hover:scale-105 active:scale-95"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleContinueLearning(continueLearning);
                            }}
                        >
                            继续学习
                        </Button>
                    </div>
                    <Progress value={calculateProgress(continueLearning)} className="h-1.5 bg-slate-700/50" />
                </div>
            </div>
          </Card>
        </div>
      )}

      {/* 我的课程 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">我的课程</h3>
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900" onClick={() => navigate('/courses/all-courses')}>
            查看全部 <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoadingMyCourses ? (
            Array(4).fill(0).map((_, index) => (
              <div key={index} className="h-[320px] bg-gray-100 rounded-lg animate-pulse" />
            ))
          ) : myCourses.length > 0 ? (
            myCourses.slice(0, 3).map(course => (
              <StandardCourseCard 
                key={course.uuid} 
                course={course} 
                isHighlighted={continueLearning?.uuid === course.uuid}
              />
            ))
          ) : (
            <div className="col-span-full p-8 text-center border border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500 mb-4">暂无课程</p>
            </div>
          )}
          
          {/* 创建课程卡片 */}
          <div 
            className="border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 hover:border-gray-900 hover:bg-white transition-all cursor-pointer flex flex-col items-center justify-center p-6 min-h-[200px]"
            onClick={() => navigate('/settings/courses/create')}
          >
            <div className="w-12 h-12 bg-white rounded-full border border-gray-200 flex items-center justify-center mb-3 shadow-sm">
              <Plus className="w-6 h-6 text-gray-900" />
            </div>
            <p className="font-medium text-gray-900">创建新课程</p>
            <p className="text-sm text-gray-500 mt-1">开始你的教学之旅</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
