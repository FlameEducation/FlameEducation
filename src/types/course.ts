// 基础课程信息接口


export interface Course {
  id: number | string;
  uuid: string;
  title: string;
  description: string;
  duration?: string;
  coverImageUrl: string;
  totalChapters: number;
  totalLessons: number;
  totalDurationInMinutes: number;
  createdAt?: string;
  whatYouWillLearn?: string[];
  chapters: Chapter[];
  sequentialLearn: boolean;
}

export interface Chapter {
  uuid: string;
  courseUuid?: string;
  title: string;
  description: string;
  sequence: number;
  isCompleted: boolean;
  isLearning: boolean;
  lessons: Lesson[];
  totalDuration: number;
  totalLessons: number;
  achievementName?: string;
}

export interface Lesson {
  uuid: string;
  title: string;
  sequence: number;
  isCompleted: boolean;
  isLearning: boolean;
  isLocked: boolean;
  isFree: boolean;
  duration: number;
}



// API 响应相关接口
export interface CourseListResponse {
  code: number;
  data: Course[];
}

export interface CourseDetailResponse {
  code: number;
  data: Course;
}

export interface UserCourseResponse {
  code: number;
  data: UserCourse[];
}

export interface SubjectCategoriesResponse {
  code: number;
  data: SubjectCategories;
}

// ==================== 自动生成课程相关类型 ====================

/**
 * 自动生成课程启动请求
 */
export interface AutoCourseStartRequest {
  topic: string;
  difficulty?: string; // easy/medium/hard
  language?: string;   // zh/en
  suggestedChapterCount?: number;
}

/**
 * 课时大纲
 */
export interface LessonOutline {
  sections: OutlineSection[];
  summary: string;
  nextLessonPreview?: string;
}

export interface OutlineSection {
  title: string;
  content: string;
  keyPoints: string[];
}

/**
 * 课时草稿
 */
export interface LessonDraft {
  sequence: number;
  title: string;
  description: string;
  durationSeconds: number;
}

/**
 * 章节草稿
 */
export interface ChapterDraft {
  sequence: number;
  title: string;
  description: string;
  lessons: LessonDraft[];
}

/**
 * 课程草稿
 */
export interface CourseDraft {
  title: string;
  description: string;
  chapters: ChapterDraft[];
}

/**
 * 自动生成课程会话
 */
export interface AutoCourseSessionVo {
  sessionUuid: string;
  createdAt: number;
  topic: string;
  difficulty: string;
  courseDraft: CourseDraft;
}

/**
 * 课程提交结果
 */
export interface CourseSubmitResultVo {
  courseUuid: string;
  courseTitle: string;
  totalChapters: number;
  totalLessons: number;
  totalDurationSeconds: number;
}
