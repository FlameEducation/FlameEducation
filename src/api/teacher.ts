import request from '@/utils/request';

// 教师信息接口
export interface TeacherInfo {
  uuid: string;
  teacherName: string;
  avatarUrl: string;
  description: string;
  personality: string;
  voiceProvider?: string;
  voiceModel?: string;
  emotionConfig?: string;
  speedRatio?: number;
  status: number; // 1: Enabled, 0: Disabled
}

export interface TeacherPageQuery {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: number;
}

export interface PageResult<T> {
  total: number;
  list: T[];
  currentPage: number;
  pageSize: number;
}

// 获取可用教师列表 (用户端)
export const getEnabledTeachers = (): Promise<TeacherInfo[]> => {
  return request.get('/api/teachers/current');
};

// 获取教师详细信息
export const getTeacherInfo = (teacherUuid: string): Promise<TeacherInfo> => {
  return request.get(`/api/teachers/${teacherUuid}`);
};

// --- Admin APIs ---

// 分页获取教师列表
export const getAdminTeachers = (params: TeacherPageQuery): Promise<PageResult<TeacherInfo>> => {
  return request.get('/api/admin/teachers', { params });
};

// 创建教师
export const createTeacher = (data: FormData): Promise<TeacherInfo> => {
  return request.post('/api/admin/teachers', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// 更新教师
export const updateTeacher = (uuid: string, data: FormData): Promise<TeacherInfo> => {
  return request.put(`/api/admin/teachers/${uuid}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// 更新教师状态
export const updateTeacherStatus = (uuid: string, status: number): Promise<TeacherInfo> => {
  return request.put(`/api/admin/teachers/${uuid}/status`, { status });
};

// 删除教师
export const deleteTeacher = (uuid: string): Promise<boolean> => {
  return request.delete(`/api/admin/teachers/${uuid}`);
};
