import request from '../utils/request';
import { AutoCourseStartRequest, AutoCourseSessionVo, CourseSubmitResultVo } from '../types/course';
import { CourseGenerationStatusVo } from '../types/course-generation';

/**
 * 初始化课程生成会话
 */
export function startCourseGeneration(params: AutoCourseStartRequest): Promise<AutoCourseSessionVo> {
  return request.post('/api/admin/createCourse/start', params) as unknown as Promise<AutoCourseSessionVo>;
}

/**
 * 发送编辑指令改进课程
 */
export function editCourse(sessionUuid: string, instruction: string): Promise<AutoCourseSessionVo> {
  return request.post('/api/admin/createCourse/edit', {
    sessionUuid,
    instruction,
  }) as unknown as Promise<AutoCourseSessionVo>;
}

/**
 * 获取当前会话信息
 */
export function getSession(sessionUuid: string): Promise<AutoCourseSessionVo> {
  return request.get(`/api/admin/createCourse/session/${sessionUuid}`) as unknown as Promise<AutoCourseSessionVo>;
}

/**
 * 获取课程生成状态
 */
export function getCourseGenerationStatus(sessionUuid: string): Promise<CourseGenerationStatusVo> {
  return request.get(`/api/admin/createCourse/status/${sessionUuid}`) as unknown as Promise<CourseGenerationStatusVo>;
}

/**
 * 提交课程生成
 */
export function submitCourse(sessionUuid: string, enableParallel?: boolean, parallelThreads?: number): Promise<CourseSubmitResultVo> {
  return request.post(`/api/admin/createCourse/submit`, {
    sessionUuid,
    enableParallel,
    parallelThreads
  }) as unknown as Promise<CourseSubmitResultVo>;
}

/**
 * 获取正在生成的课程列表
 */
export function getGeneratingCourses(): Promise<CourseGenerationStatusVo[]> {
  return request.get('/api/admin/createCourse/generating') as unknown as Promise<CourseGenerationStatusVo[]>;
}

/**
 * 重试失败的课时
 */
export function retryFailedLessons(courseUuid: string): Promise<void> {
  return request.post(`/api/admin/createCourse/retry/${courseUuid}`, {}) as unknown as Promise<void>;
}
