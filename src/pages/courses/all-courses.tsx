import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, BookOpen, Plus } from 'lucide-react';
import { api } from '@/api';
import { Course } from '@/types';
import { StandardCourseCard } from '@/components/courses/StandardCourseCard';

const AllCoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.getCourseDetailList(null);
        setCourses(response);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索感兴趣的课程..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-gray-200 focus:border-gray-900 focus:ring-0 rounded-full transition-all"
            />
          </div>
          <Button variant="outline" size="icon" className="rounded-full border-gray-200 hover:bg-gray-100 hover:text-gray-900 shrink-0">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, index) => (
              <div key={index} className="border border-gray-100 rounded-xl overflow-hidden bg-white">
                <div className="h-40 bg-gray-100 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-100 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
                  <div className="flex gap-2 pt-2">
                    <div className="h-4 bg-gray-100 rounded w-12 animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded w-12 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredCourses.map(course => (
              <StandardCourseCard key={course.uuid} course={course} />
            ))}

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
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">未找到相关课程</h3>
            <p className="text-gray-500 mb-6 max-w-xs mx-auto">
              尝试更换搜索关键词，或者浏览其他分类的课程
            </p>
            <Button 
              onClick={() => setSearchTerm('')}
              variant="outline"
              className="border-gray-200 hover:bg-gray-50 text-gray-900"
            >
              清除搜索条件
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllCoursesPage;
