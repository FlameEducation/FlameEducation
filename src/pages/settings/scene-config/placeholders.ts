export type PromptPlaceholderCategory = 'lesson' | 'user' | 'course' | 'tool';

export interface PromptPlaceholder {
  key: string;
  label: string;
  description: string;
  category: PromptPlaceholderCategory;
}

export const PLACEHOLDERS: PromptPlaceholder[] = [
  { key: '${lesson_name}', label: '课时名称', description: '当前课时的标题', category: 'lesson' },
  { key: '${lesson_description}', label: '课时描述', description: '课时的描述信息', category: 'lesson' },
  { key: '${lesson_teaching_structure_filed}', label: '教学大纲', description: '课时的完整教学结构JSON', category: 'lesson' },
  { key: '${lesson_context_filed}', label: '课时上下文', description: '课时相关的上下文信息', category: 'lesson' },
  { key: '${user_context_filed}', label: '用户上下文', description: '学生的学习历史和偏好', category: 'user' },
  { key: '${lesson_tool_filed}', label: '可用工具列表', description: '课程绑定的工具Function Call定义', category: 'tool' },
];
