import request from '@/utils/request';

/**
 * AI服务商配置返回VO
 */
export interface AiProviderConfig {
  providerName: string;  // 服务商名称 (google/doubao)
  baseUrl: string;  // 代理地址
  models: string[]; // 支持的模型列表
}

/**
 * 创建/更新服务商配置请求
 */
export interface CreateAiProviderConfigRequest {
  providerName: string;  // 服务商名称
  baseUrl: string;  // 代理地址
  apiKey: string;  // API密钥
  models: string[]; // 支持的模型列表
}

/**
 * 服务商类型
 */
export interface AiProviderType {
  code: string;  // 服务商代码（google/doubao等）
  name: string;  // 服务商名称
}

/**
 * 查询全部服务商配置
 */
export const listAiProviders = async (): Promise<AiProviderConfig[]> => {
  const response = await request.get<AiProviderConfig[]>('/api/admin/aiProviders');
  return response as unknown as AiProviderConfig[];
};

/**
 * 获取服务商类型列表（用于添加时选择）
 */
export const listAiProviderTypes = async (): Promise<AiProviderType[]> => {
  const response = await request.get<AiProviderType[]>('/api/admin/aiProviders/types');
  return response as unknown as AiProviderType[];
};

/**
 * 查询场景下的可用服务商
 */
export const listAiProvidersByScene = async (sceneType: string): Promise<AiProviderConfig[]> => {
  const response = await request.get<AiProviderConfig[]>(`/api/admin/aiProviders/scene/${sceneType}`);
  return response as unknown as AiProviderConfig[];
};

/**
 * 创建服务商配置
 */
export const createAiProviderConfig = async (payload: CreateAiProviderConfigRequest): Promise<void> => {
  await request.post('/api/admin/aiProviders', payload);
};

/**
 * 更新服务商配置
 */
export const updateAiProviderConfig = async (
  providerName: string,
  payload: CreateAiProviderConfigRequest
): Promise<void> => {
  await request.put(`/api/admin/aiProviders/${providerName}`, payload);
};

/**
 * 删除服务商配置
 */
export const deleteAiProviderConfig = async (providerName: string): Promise<void> => {
  await request.delete(`/api/admin/aiProviders/${providerName}`);
};

