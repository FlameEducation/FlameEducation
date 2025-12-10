import request from '@/utils/request';

/**
 * 场景类型定义
 */
export type SceneType = 'CHAT' | 'BLACKBOARD' | 'IMAGE_PROMPT_OPTIMIZATION';


// 提示词模板接口
export interface PromptTemplate {
    id?: number;
    uuid: string;
    templateName: string;
    templateType: SceneType;
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
}


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
export interface PromptConfig {
  sceneUuid: string;
  sceneType: SceneType;
  sceneName: string;
  sceneDescription: string;
  promptName?: string; // 提示词名称
  promptContent: string;
  aiModelName: string;
  aiServiceProvider: string;
  isJsonFormat?: boolean;
  thinkingStatus?: number;
  messageLength?: number;
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
  thinkingStatus?: number;
  messageLength?: number;
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
  thinkingStatus?: number;
  messageLength?: number;
  isEnabled?: boolean;
}

// 将 Map 转回对象
export function mapToObject(map: Map<string, any>): Record<string, any> {
    return Object.fromEntries(map);
}

// 将对象转换为 Map
export function objectToMap<T extends Record<string, any>>(obj: T | undefined | null): Map<string, any> {
    return new Map(Object.entries(obj ?? {}));
}

/**
 * 分页查询提示词模板列表
 */
export const listPromptTemplates = (params: PromptTemplateQueryParams) => {
    return request.get<PromptTemplate[]>('/api/admin/promptConfig/list', {
        params: mapToObject(objectToMap(params))
    });
};


/**
 * 获取所有场景定义
 * @returns 场景列表
 */
export const getAllScenes = async (): Promise<SceneInfo[]> => {
  const response = await request.get<SceneInfo[]>('/api/admin/promptConfig/scenes');
  return Array.isArray(response) ? response : [response as unknown as SceneInfo];
};

/**
 * 获取指定场景下的所有 Prompt
 * @param sceneType 场景类型 (CHAT, IMAGE_GENERATION, STT)
 * @returns Prompt 列表
 */
export const getScenePrompts = async (sceneType: SceneType): Promise<PromptConfig[]> => {
  const response = await request.get<PromptConfig[]>(`/api/admin/promptConfig/prompts/${sceneType}`);
  return Array.isArray(response) ? response : [response as unknown as PromptConfig];
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
): Promise<PromptConfig> => {
  return (await request.post<PromptConfig>(
    `/api/admin/promptConfig/prompts/${sceneType}`,
    data
  )) as unknown as PromptConfig;
};

/**
 * 更新场景 Prompt（非系统 Prompt 才能更新）
 * @param data 更新请求数据
 * @returns 更新后的 Prompt
 */
export const updateScenePrompt = async (
  data: UpdateScenePromptRequest
): Promise<PromptConfig> => {
  return (await request.put<PromptConfig>('/api/admin/promptConfig/prompts', data)) as unknown as PromptConfig;
};

/**
 * 删除场景 Prompt（非系统 Prompt 才能删除）
 * @param uuid Prompt UUID
 */
export const deleteScenePrompt = async (uuid: string): Promise<void> => {
  return request.delete(`/api/admin/promptConfig/prompts/${uuid}`);
};

/**
 * 获取指定场景的系统默认 Prompt 内容
 * @param sceneType 场景类型
 * @returns Prompt 内容
 */
export const getSceneDefaultPrompt = async (sceneType: SceneType): Promise<string> => {
  return (await request.get<string>(`/api/admin/promptConfig/scenes/${sceneType}/default`)) as unknown as string;
};
