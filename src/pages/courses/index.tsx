import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';
import { api } from '@/api';
import { Course, UserCourse } from '@/types';

// UI Components
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import { Search, ChevronRight } from 'lucide-react';

// Custom Components
import { CourseCard } from '@/components/course-card';
import { MyCourseCard } from '@/components/courses/MyCourseCard';

// Utils
import { cn } from '@/lib/utils';

// 类型定义已移至 @/types

// Skeleton Components
const Skeletons = {
  MyCourse: () => (
    <div className="flex-shrink-0">
      <Card className="w-[300px]">
        <div className="aspect-[2/1] bg-gray-200" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-2 w-full" />
        </div>
      </Card>
    </div>
  ),

  RecommendCourse: () => (
    <div className="flex-shrink-0">
      <Card className="w-[280px]">
        <div className="aspect-[2/1] bg-gray-200" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </Card>
    </div>
  ),

  NewCourse: () => (
    <Card className="p-4">
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </Card>
  )
};

// Course Sections
const CourseSection = {
  MyCourses: ({ 
    isLoading, 
    courses,
    onViewAll  // 添加点击处理函数
  }: { 
    isLoading: boolean; 
    courses: UserCourse[];
    onViewAll: () => void;
  }) => (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-medium text-gray-800">我的课程</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onViewAll}  // 使用传入的处理函数
        >
          查看全部
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <Skeletons.MyCourse key={i} />)
          ) : (
            courses.map(course => (
              <MyCourseCard key={course.uuid} course={course} />
            ))
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  ),

  RecommendCourses: ({ isLoading, courses, onViewAll }: { 
    isLoading: boolean; 
    courses: Course[];
    onViewAll: () => void;
  }) => (
    <section className="space-y-3">
      <h2 className="text-base font-medium text-gray-800 px-1">精选推荐</h2>
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <Skeletons.RecommendCourse key={i} />)
          ) : (
            courses.map(course => (
              <CourseCard 
                key={course.uuid} 
                course={mapCourseData(course)} 
                variant="featured" 
              />
            ))
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  ),

  NewCourses: ({ isLoading, courses, onViewAll }: { 
    isLoading: boolean; 
    courses: Course[];
    onViewAll: () => void;
  }) => (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-medium text-gray-800">最新上线</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onViewAll}  // 使用传入的处理函数
        >
          查看全部
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      <div className="space-y-4">
        {isLoading ? (
          Array(2).fill(0).map((_, i) => <Skeletons.NewCourse key={i} />)
        ) : (
          courses.map(course => (
            <CourseCard 
              key={course.uuid} 
              course={mapCourseData(course)} 
              variant="new" 
            />
          ))
        )}
      </div>
    </section>
  )
};

// Helper function to map API course data to CourseCard props
const mapCourseData = (course: Course) => ({
  // 基本信息
  id: course.uuid,
  uuid: course.uuid,
  title: course.title,
  description: course.description,
  thumbnail: course.coverImageUrl,
  coverImageUrl: course.coverImageUrl,
  
  // 分类信息
  subject: course.subject,
  subjectUuid: course.subjectUuid,
  categories: course.categories,
  tags: course.tags,
  
  // 课程信息
  level: course.level,
  totalChapters: course.totalChapters,
  totalLessons: course.totalLessons,
  totalDuration: course.totalDuration,
  
  // 状态标记
  isHot: course.isHot,
  isDiscount: course.isDiscount,
  recommendReason: course.recommendReason,
  
  // 价格信息
  price: course.price,
  originalPrice: course.originalPrice,
  
  // 统计信息
  rating: course.rating,
  students: course.students,
  studentsCount: course.students,  // 为了兼容现有代码
  
  // 其他信息
  createdAt: course.createdAt,
  
  // 格式化的展示信息
  duration: `${course.totalDuration}分钟`,
  unitsCount: course.totalChapters
});

const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const [isLoadingMyCourses, setIsLoadingMyCourses] = useState(true);
  const [isLoadingRecommend, setIsLoadingRecommend] = useState(true);
  const [isLoadingNew, setIsLoadingNew] = useState(true);
  
  const [myCourses, setMyCourses] = useState<UserCourse[]>([]);
  const [recommendCourses, setRecommendCourses] = useState<Course[]>([]);
  const [newCourses, setNewCourses] = useState<Course[]>([]);

  // 获取我的课程
  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const response = await api.getCourseDetailList(null);
        setMyCourses(response);
      } catch (error) {
        console.error('Failed to fetch my courses:', error);
      } finally {
        setIsLoadingMyCourses(false);
      }
    };

    fetchMyCourses();
  }, []);

  // 获取推荐课程
  useEffect(() => {
    const fetchRecommendCourses = async () => {
      try {
        const response = await api.getRecommendCourse();
        setRecommendCourses(response as Course[]);
      } catch (error) {
        console.error('Failed to fetch recommend courses:', error);
      } finally {
        setIsLoadingRecommend(false);
      }
    };

    fetchRecommendCourses();
  }, []);

  // 获取最新课程
  useEffect(() => {
    const fetchNewCourses = async () => {
      try {
        const response = await api.getNewCourse()
        setNewCourses(response);
      } catch (error) {
        console.error('Failed to fetch new courses:', error);
      } finally {
        setIsLoadingNew(false);
      }
    };

    fetchNewCourses();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header Section */}
      <div className={theme.gradients.header}>
        <div className="px-4 pt-3 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className={theme.typography.title.primary}>课程中心</h1>
          </div>
          <div className="relative">
            <Input
              placeholder="搜索感兴趣的课程..."
              className="w-full bg-white/10 border-0 placeholder:text-white/60 text-white pr-10"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-6 space-y-8">
          <CourseSection.MyCourses 
            isLoading={isLoadingMyCourses} 
            courses={myCourses}
            onViewAll={() => navigate('/courses/all-courses')}  // 添加点击处理
          />
          <CourseSection.RecommendCourses 
            isLoading={isLoadingRecommend} 
            courses={recommendCourses.map(mapCourseData)}
            onViewAll={() => navigate('/courses/all')}
          />
          <CourseSection.NewCourses 
            isLoading={isLoadingNew} 
            courses={newCourses.map(mapCourseData)}
            onViewAll={() => navigate('/courses/all')}
          />
        </div>
      </div>
    </div>
  );
};

export default CoursesPage; 