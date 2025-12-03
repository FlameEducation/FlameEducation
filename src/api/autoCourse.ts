import request from '../utils/request';
import { AutoCourseStartRequest, AutoCourseSessionVo, CourseSubmitResultVo } from '../types/course';
import { CourseGenerationStatusVo } from '../types/course-generation';

/**
 * 初始化课程生成会话
 */
export function startCourseGeneration(params: AutoCourseStartRequest): Promise<AutoCourseSessionVo> {
  return request.post('/api/admin/auto-course/start', params) as unknown as Promise<AutoCourseSessionVo>;
}

/**
 * 发送编辑指令改进课程
 */
export function editCourse(sessionUuid: string, instruction: string): Promise<AutoCourseSessionVo> {
  return request.post('/api/admin/auto-course/edit', {
    sessionUuid,
    instruction,
  }) as unknown as Promise<AutoCourseSessionVo>;
}

/**
 * 获取当前会话信息
 */
export function getSession(sessionUuid: string): Promise<AutoCourseSessionVo> {
  return request.get(`/api/admin/auto-course/session/${sessionUuid}`) as unknown as Promise<AutoCourseSessionVo>;
}

/**
 * 获取课程生成状态
 */
export function getCourseGenerationStatus(sessionUuid: string): Promise<CourseGenerationStatusVo> {
  return request.get(`/api/admin/auto-course/status/${sessionUuid}`) as unknown as Promise<CourseGenerationStatusVo>;
}

/**
 * 提交课程生成
 */
export function submitCourse(sessionUuid: string): Promise<CourseSubmitResultVo> {
  return request.post(`/api/admin/auto-course/submit/${sessionUuid}`, {}) as unknown as Promise<CourseSubmitResultVo>;
}
