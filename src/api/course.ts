import request from '@/utils/request';
import { 
  Course, 
  CourseListResponse,
  CourseDetailResponse,
} from '@/types';

// 获取继续学习的课程
export const getContinueLearning = async (): Promise<Course[]> => {
  return request.get<any, Course[]>('/api/course/continueCourse');
};

// 获取课程详情
export const getCourseDetail = async (uuid: string): Promise<Course> => {
  return request.get<CourseDetailResponse, Course>(`/api/course/getCourseDetail?uuid=${uuid}`);
};

// 获取所有课程详情列表
export const getCourseDetailList = async (limit: number | null): Promise<Course[]> => {
  const limitParam = limit !== null ? `?limit=${limit}` : '';
  return request.get<CourseListResponse, Course[]>(`/api/course/getCourseList${limitParam}`);
};
