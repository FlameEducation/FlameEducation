import request from '../utils/request';

// 提示词模板类型
export type TemplateType = 'CHAT' | 'BLACKBOARD' | 'IMAGE_PROMPT_OPTIMIZATION';

// 提示词模板接口
export interface PromptTemplate {
  id?: number;
  uuid: string;
  templateName: string;
  templateType: TemplateType;
  description?: string;
  promptContent: string;
  aiModelName: string;
  aiServiceProvider: string;
  responseType?: string;
  responseFieldMapping?: string;
  historyMessageLimit?: number;
  contextFields?: string;
  blackboardContentType?: string;
  sttLanguage?: string;
  sttConfidenceThreshold?: number;
  imageStyle?: string;
  imageSize?: string;
  imageQuality?: string;
  voiceProvider?: string;
  voiceModel?: string;
  voiceEmotion?: string;
  voiceSpeed?: number;
  isEnabled?: boolean;
  isSystemTemplate?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 查询参数
export interface PromptTemplateQueryParams {
  keyword?: string;
  templateType?: TemplateType;
  aiServiceProvider?: string;
  isEnabled?: boolean;
  isSystemTemplate?: boolean;
  page?: number;
  pageSize?: number;
}

// 分页结果
export interface PageResult<T> {
  list: T[];
  total: number;
  currentPage: number;
  pageSize: number;
}

/**
 * 分页查询提示词模板列表
 */
export const listPromptTemplates = (params: PromptTemplateQueryParams) => {
  return request.post<PageResult<PromptTemplate>>('/api/admin/promptTemplate/list', params);
};

/**
 * 根据类型获取启用的提示词模板列表
 */
export const listPromptTemplatesByType = (templateType: TemplateType) => {
  return request.get<PromptTemplate[]>(`/api/admin/promptTemplate/listByType`, {
    params: { templateType }
  });
};

/**
 * 获取提示词模板详情
 */
export const getPromptTemplateDetail = (uuid: string) => {
  return request.get<PromptTemplate>(`/api/admin/promptTemplate/detail/${uuid}`);
};

/**
 * 创建提示词模板
 */
export const createPromptTemplate = (data: Partial<PromptTemplate>) => {
  return request.post<string>('/api/admin/promptTemplate/create', data);
};

/**
 * 更新提示词模板
 */
export const updatePromptTemplate = (data: PromptTemplate) => {
  return request.post<string>('/api/admin/promptTemplate/update', data);
};

/**
 * 删除提示词模板
 */
export const deletePromptTemplate = (uuid: string) => {
  return request.delete<string>(`/api/admin/promptTemplate/delete/${uuid}`);
};

/**
 * 启用/禁用提示词模板
 */
export const togglePromptTemplate = (uuid: string, isEnabled: boolean) => {
  return request.put<string>('/api/admin/promptTemplate/toggle', null, {
    params: { uuid, isEnabled }
  });
};

// 模板类型选项
export const TEMPLATE_TYPE_OPTIONS = [
  { value: 'CHAT', label: '聊天' },
  { value: 'BLACKBOARD', label: '小黑板' },
  { value: 'STT', label: '语音识别' },
  { value: 'IMAGE_GENERATION', label: '图片生成' },
  { value: 'VOICE', label: '语音合成' }
] as const;

// 服务提供商选项
export const SERVICE_PROVIDER_OPTIONS = [
  { value: 'google', label: 'Google' },
  { value: 'doubao', label: '豆包' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' }
] as const;
