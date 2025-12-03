// 班级基础信息接口
export interface Class {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// 提示词接口
export interface Prompt {
  id: number;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// 黑板配置接口
export interface BlackboardConfig {
  id: number;
  name: string;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// AI服务提供商接口
export interface AiServiceProvider {
  id: number;
  name: string;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// 班级表单数据接口
export interface ClassFormData {
  name: string;
  description: string;
}

// 提示词表单数据接口
export interface PromptFormData {
  name: string;
  content: string;
}

// 黑板配置表单数据接口
export interface BlackboardConfigFormData {
  name: string;
  config: Record<string, any>;
}

// API响应接口
export interface ClassListResponse {
  code: number;
  data: Class[];
}

export interface PromptListResponse {
  code: number;
  data: Prompt[];
}

export interface BlackboardConfigListResponse {
  code: number;
  data: BlackboardConfig[];
}

export interface AiServiceProviderListResponse {
  code: number;
  data: AiServiceProvider[];
} 