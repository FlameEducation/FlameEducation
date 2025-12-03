import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {Card} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Progress} from "@/components/ui/progress";
import {
  BookOpen,
  ChevronRight,
  Plus
} from 'lucide-react';
import {api} from '@/api';
import {Course} from '@/types';
import { StandardCourseCard } from '@/components/courses/StandardCourseCard';

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
        if (Array.isArray(courseRes) && courseRes.length > 0) {
          setContinueLearning(courseRes[0]);
        } else {
          setContinueLearning(null);
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
    const totalLessons = course?.units?.reduce((sum, unit) => sum + unit.totalLessons, 0) || 0;
    const completedLessons = course?.units?.reduce((sum, unit) => sum + unit.completedLessons, 0) || 0;
    return totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  };

  // 计算当前学习状态信息
  const getLearningStatus = (course: Course) => {
    const currentUnitIndex = course?.units?.findIndex(
      unit => unit.completedLessons < unit.totalLessons
    );

    if (currentUnitIndex === -1) {
      return {
        currentChapter: course?.units?.length || 0,
        remainingLessons: 0,
        isCompleted: true
      };
    }

    const currentUnit = course?.units?.[currentUnitIndex];
    const remainingLessons = (currentUnit?.totalLessons || 0) - (currentUnit?.completedLessons || 0);

    return {
      currentChapter: currentUnitIndex + 1,
      remainingLessons,
      isCompleted: false
    };
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
          {!isLoadingContinueLearning && continueLearning && (
            <Button 
              className="bg-white text-gray-900 hover:bg-gray-100 w-full md:w-auto"
              onClick={() => navigate(`/courses/${continueLearning.uuid}`)}
            >
              继续学习
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* 继续学习详细卡片 (如果存在) */}
      {isLoadingContinueLearning ? (
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
      ) : continueLearning && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">当前进度</h3>
          <Card 
            className="p-6 border border-gray-200 hover:border-gray-900 transition-colors cursor-pointer group"
            onClick={() => navigate(`/courses/${continueLearning.uuid}`)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-xl font-medium text-gray-900 mb-1">{continueLearning.title}</h4>
                <p className="text-sm text-gray-500">
                  {(() => {
                    const status = getLearningStatus(continueLearning);
                    if (status.isCompleted) return '课程已完成';
                    return `第 ${status.currentChapter} 章 · 还需完成 ${status.remainingLessons} 节课`;
                  })()}
                </p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                <BookOpen className="w-5 h-5 text-gray-900 group-hover:text-white transition-colors" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">总进度</span>
                <span className="font-medium text-gray-900">{Math.round(calculateProgress(continueLearning))}%</span>
              </div>
              <Progress value={calculateProgress(continueLearning)} className="h-2 bg-gray-100" />
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
              <StandardCourseCard key={course.uuid} course={course} />
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
