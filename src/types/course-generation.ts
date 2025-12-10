/**
 * 课程生成过程状态 VO
 * 用于前端轮询获取后端课程生成的实时状态
 */
export interface CourseGenerationStatusVo {
  /**
   * 会话 UUID
   */
  sessionUuid: string;

  /**
   * 状态：
   * INITIALIZING - 初始化中
   * GENERATING_STRUCTURE - 生成结构中
   * REFINING - 优化中
   * GENERATING_OUTLINES - 生成大纲中
   * PERSISTING - 持久化中
   * GENERATING - 生成中 (通用状态)
   * COMPLETED - 已完成
   * FAILED - 失败
   * PARTIAL_SUCCESS - 部分成功
   */
  status: 'INITIALIZING' | 'GENERATING_STRUCTURE' | 'REFINING' | 'GENERATING_OUTLINES' | 'PERSISTING' | 'GENERATING' | 'COMPLETED' | 'FAILED' | 'PARTIAL_SUCCESS';

  /**
   * 当前步骤：INITIALIZING、GENERATING_STRUCTURE、REFINING、GENERATING_OUTLINES、PERSISTING
   */
  currentStep: string;

  /**
   * 进度百分比 (0-100)
   */
  progress: number;

  /**
   * 步骤描述
   */
  stepDescription: string;

  /**
   * 错误信息（仅当状态为 FAILED 时有效）
   */
  errorMessage?: string;

  /**
   * 生成的课程 UUID（仅当状态为 COMPLETED 时有效）
   */
  generatedCourseUuid?: string;

  /**
   * 生成的课程标题
   */
  generatedCourseTitle?: string;

  /**
   * 总步骤数
   */
  totalSteps: number;

  /**
   * 已完成的步骤数
   */
  completedSteps: number;

  /**
   * 时间戳
   */
  timestamp: number;
}
