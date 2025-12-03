import request from '@/utils/request';

/**
 * 场景类型定义
 */
export type SceneType = 'CHAT' | 'BLACKBOARD' | 'IMAGE_PROMPT_OPTIMIZATION';

/**
 * 场景定义信息
 */
export interface SceneInfo {
  sceneType: SceneType;
  sceneName: string;
  sceneDescription: string;
}

/**
 * 场景配置 VO - 对应单个 Prompt 配置
 */
export interface SceneConfig {
  sceneUuid: string;
  sceneType: SceneType;
  sceneName: string;
  sceneDescription: string;
  promptName?: string; // 提示词名称
  promptContent: string;
  aiModelName: string;
  aiServiceProvider: string;
  isJsonFormat?: boolean;
  enableThinking?: boolean;
  isEnabled: boolean;
  isSystemTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 创建场景 Prompt 请求
 */
export interface CreateScenePromptRequest {
  promptName?: string; // 提示词名称
  promptContent: string;
  aiModelName: string;
  aiServiceProvider: string;
  isJsonFormat?: boolean;
  enableThinking?: boolean;
  isEnabled?: boolean;
}

/**
 * 更新场景 Prompt 请求
 */
export interface UpdateScenePromptRequest {
  sceneUuid: string;
  promptName?: string;
  promptContent?: string;
  aiModelName?: string;
  aiServiceProvider?: string;
  isJsonFormat?: boolean;
  enableThinking?: boolean;
  isEnabled?: boolean;
}

/**
 * 获取所有场景定义
 * @returns 场景列表
 */
export const getAllScenes = async (): Promise<SceneInfo[]> => {
  const response = await request.get<SceneInfo[]>('/api/admin/sceneConfig/scenes');
  return Array.isArray(response) ? response : [response as unknown as SceneInfo];
};

/**
 * 获取指定场景下的所有 Prompt
 * @param sceneType 场景类型 (CHAT, IMAGE_GENERATION, STT)
 * @returns Prompt 列表
 */
export const getScenePrompts = async (sceneType: SceneType): Promise<SceneConfig[]> => {
  const response = await request.get<SceneConfig[]>(`/api/admin/sceneConfig/prompts/${sceneType}`);
  return Array.isArray(response) ? response : [response as unknown as SceneConfig];
};

/**
 * 创建新的场景 Prompt
 * @param sceneType 场景类型
 * @param data 创建请求数据
 * @returns 创建后的 Prompt
 */
export const createScenePrompt = async (
  sceneType: SceneType,
  data: CreateScenePromptRequest
): Promise<SceneConfig> => {
  return (await request.post<SceneConfig>(
    `/api/admin/sceneConfig/prompts/${sceneType}`,
    data
  )) as unknown as SceneConfig;
};

/**
 * 更新场景 Prompt（非系统 Prompt 才能更新）
 * @param data 更新请求数据
 * @returns 更新后的 Prompt
 */
export const updateScenePrompt = async (
  data: UpdateScenePromptRequest
): Promise<SceneConfig> => {
  return (await request.put<SceneConfig>('/api/admin/sceneConfig/prompts', data)) as unknown as SceneConfig;
};

/**
 * 删除场景 Prompt（非系统 Prompt 才能删除）
 * @param uuid Prompt UUID
 */
export const deleteScenePrompt = async (uuid: string): Promise<void> => {
  return request.delete(`/api/admin/sceneConfig/prompts/${uuid}`);
};

/**
 * 获取指定场景的系统默认 Prompt 内容
 * @param sceneType 场景类型
 * @returns Prompt 内容
 */
export const getSceneDefaultPrompt = async (sceneType: SceneType): Promise<string> => {
  return (await request.get<string>(`/api/admin/sceneConfig/scenes/${sceneType}/default`)) as unknown as string;
};
