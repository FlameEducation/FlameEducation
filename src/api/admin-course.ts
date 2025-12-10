import request from '@/utils/request';

// 课程数据接口
export interface CourseData {
  uuid?: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  status: number; // 0=草稿, 1=已发布
  aiTeacherUuid?: string; // 绑定的 Prompt Template UUID
  sequentialLearn: boolean; // 是否强制顺序学习
  chatPromptUuid?: string; // 聊天场景Prompt UUID
  blackboardPromptUuid?: string; // 小黑板场景Prompt UUID
  totalChapters?: number;
  totalLessons?: number;
  totalDuration?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 课程Prompt绑定接口
export interface CoursePromptBinding {
  courseUuid: string;
  chatPromptUuid?: string;
  blackboardPromptUuid?: string;
}

// 课程工具状态
export interface CourseToolStatus {
  toolUuid: string;
  toolName: string;
  toolDescription: string;
  isEnabled: boolean;
}

// Prompt 模板接口
export interface PromptTemplate {
  uuid: string;
  sceneUuid?: string;
  templateName?: string; // 后端返回的字段名
  name?: string;
  promptName?: string;
  templateType?: string;
  sceneType?: string;
  aiServiceProvider: string;
  aiModelName: string;
  promptContent?: string;
  isDefault?: boolean;
  isEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// 课程统计接口
export interface CourseStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalLessons: number;
  totalStudents: number;
}

// 获取课程统计
export const getCourseStats = async (): Promise<CourseStats> => {
  return request.get<any, CourseStats>('/api/admin/course/stats');
};

// 获取课程列表
export const getCourseList = async (keyword?: string): Promise<CourseData[]> => {
  return request.get<any, CourseData[]>('/api/admin/course/list', { 
    params: keyword ? { keyword } : undefined 
  });
};

// 获取课程详情
export const getCourseDetail = async (uuid: string): Promise<CourseData> => {
  return request.get<any, CourseData>('/api/admin/course/detail', { params: { uuid } });
};

// 创建课程
export const createCourse = async (data: FormData): Promise<string> => {
  return request.post<any, string>('/api/admin/course/create', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// 更新课程
export const updateCourse = async (data: FormData): Promise<boolean> => {
  return request.post<any, boolean>('/api/admin/course/update', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// 删除课程
export const deleteCourse = async (uuid: string): Promise<boolean> => {
  return request.post<any, boolean>(`/api/admin/course/delete/${uuid}`);
};

// 更新课程状态
export const updateCourseStatus = async (uuid: string, status: number): Promise<boolean> => {
  return request.post<any, boolean>('/api/admin/course/updateStatus', {
    uuid,
    field: 'status',
    value: status
  });
};


// 导出课程
export const exportCourse = async (uuid: string): Promise<Blob> => {
  return request.get(`/api/admin/course/export`, {
    params: { uuid },
    responseType: 'blob'
  });
};

// 导入课程
export const importCourse = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post<any, string>('/api/admin/course/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// 获取课程的Prompt绑定信息
export const getCoursePromptBindings = async (courseUuid: string): Promise<CoursePromptBinding> => {
  return request.get<any, CoursePromptBinding>(`/api/admin/course/${courseUuid}/prompts`);
};

// 更新课程的Prompt绑定信息
export const updateCoursePromptBindings = async (courseUuid: string, binding: CoursePromptBinding): Promise<boolean> => {
  return request.post<any, boolean>(`/api/admin/course/${courseUuid}/prompts`, binding);
};

// 获取课程工具启用状态
export const getCourseTools = async (courseUuid: string): Promise<CourseToolStatus[]> => {
  return request.get<any, CourseToolStatus[]>(`/api/admin/tools/config/${courseUuid}`);
};

// 更新课程工具启用状态
export const updateCourseTools = async (courseUuid: string, toolUuids: string[]): Promise<boolean> => {
  return request.post<any, boolean>(`/api/admin/tools/config/${courseUuid}`, {
    courseUuid,
    toolUuids,
  });
};

// 章节接口
export interface Chapter {
  uuid?: string;
  courseUuid: string;
  title: string;
  description?: string;
  sequence: number;
  status?: number;
  lessonCount?: number;
  lessons?: Lesson[];
}

// 课时接口
export interface Lesson {
  uuid?: string;
  courseUuid: string;
  chapterUuid: string;
  title: string;
  description?: string;
  jsonContent?: string;
  duration?: number;
  sequence: number;
  status?: number;
  lessonType?: string;
}

// 获取课程章节列表
export const getCourseChapters = async (courseUuid: string): Promise<Chapter[]> => {
  const chapters = await request.get<any, any[]>(`/api/admin/course/${courseUuid}/chapters`);
  // Map backend fields to frontend interface
  return chapters.map(c => ({
    ...c,
    sequence: c.sequence ?? c.displayOrder, // Map displayOrder to sequence for Chapter
    lessons: c.lessons?.map((l: any) => ({
      ...l,
      sequence: l.sequence ?? l.displayOrder, // Map displayOrder to sequence, prefer sequence if available
      jsonContent: l.jsonContent || l.content, // Map content
    }))
  }));
};

// 创建章节
export const createChapter = async (data: Partial<Chapter>): Promise<boolean> => {
  return request.post<any, boolean>('/api/admin/course/chapter/create', data);
};

// 更新章节
export const updateChapter = async (data: Partial<Chapter>): Promise<boolean> => {
  return request.post<any, boolean>('/api/admin/course/chapter/update', data);
};

// 删除章节
export const deleteChapter = async (uuid: string): Promise<boolean> => {
  return request.post<any, boolean>(`/api/admin/course/chapter/delete/${uuid}`);
};

// 创建课时
export const createLesson = async (data: Partial<Lesson>): Promise<boolean> => {
  return request.post<any, boolean>('/api/admin/course/lesson/create', data);
};

// 更新课时
export const updateLesson = async (data: Partial<Lesson>): Promise<boolean> => {
  return request.post<any, boolean>('/api/admin/course/lesson/update', data);
};

// 删除课时
export const deleteLesson = async (uuid: string): Promise<boolean> => {
  return request.post<any, boolean>(`/api/admin/course/lesson/delete/${uuid}`);
};
