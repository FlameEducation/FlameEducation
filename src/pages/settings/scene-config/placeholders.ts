export type PromptPlaceholderCategory = 'lesson' | 'user' | 'course' | 'tool';

export interface PromptPlaceholder {
  key: string;
  label: string;
  description: string;
  category: PromptPlaceholderCategory;
}

export type PromptPlaceholderCategory = 'lesson' | 'course' | 'user' | 'tool';

export interface PromptPlaceholder {
  key: string;
  label: string;
  description: string;
  category: PromptPlaceholderCategory;
}

export const PLACEHOLDERS: PromptPlaceholder[] = [
  // 课时相关占位符
  { key: '${lesson_name}', label: '课时名称', description: '当前课时的标题', category: 'lesson' },
  { key: '${lesson_description}', label: '课时描述', description: '课时的描述信息', category: 'lesson' },
  { key: '${lesson_main_knowledge_point}', label: '课时主要知识点', description: '当前课时的核心知识点', category: 'lesson' },
  { key: '${lesson_teaching_structure_filed}', label: '教学大纲结构', description: '课时的完整教学结构JSON', category: 'lesson' },

  // 课程相关占位符
  { key: '${course_name}', label: '课程名称', description: '当前课程所属系列课程名', category: 'course' },
  { key: '${chapter_name}', label: '章节名称', description: '当前课程所属系列课程中的章节名', category: 'course' },
  { key: '${target_audience}', label: '目标受众', description: '课程面向的人群', category: 'course' },
  { key: '${course_complexity}', label: '课程复杂度', description: '课程的难度设定', category: 'course' },

  // 用户相关占位符
  { key: '${user_nickname}', label: '用户昵称', description: '学生的昵称', category: 'user' },
  { key: '${user_age}', label: '用户年龄', description: '学生的年龄', category: 'user' },
  { key: '${user_gender}', label: '用户性别', description: '学生的性别', category: 'user' },

  // 工具相关占位符
  { key: '${lesson_tool_filed}', label: '可用工具列表', description: '课程绑定的工具Function Call定义', category: 'tool' },
];
