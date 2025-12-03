import request from '@/utils/request';

// 课程信息类型
export interface LessonInfo {
  lessonTitle: string;
  lessonDescription: string;
  learningStructure: LessonChapter[];
  completed: boolean;
  lessonProgress: LessonProgress;
}

// 课程进度信息类型
export interface LessonProgress {
  totalParts: number;
  completedParts: number;
  currentChapter: number;
  currentPart: number;
}

// 课程章节类型
export interface LessonChapter {
  chapterName: string;
  id: number;
  child: LessonPart[];
}


// 课程章节部分类型
export interface LessonPart {
  id: number;
  name: string;
  minutes: number;
}

/**
 * 获取课程信息和学习进度
 * @param lessonUuid 课程UUID
 * @returns 课程信息和学习进度
 */
export const getLessonInfo = async (lessonUuid: string): Promise<LessonInfo> => {
  return request.get<any, LessonInfo>('/api/lesson/info', {
    params: { lessonUuid }
  });
}; 