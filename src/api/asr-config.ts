import request from '@/utils/request';
import { getAsrActiveConfig } from './asr-active-config';

export interface AsrProviderConfig {
  providerName: string;
  enabled: boolean;
  appId?: string;
  accessToken?: string;
  clusterId?: string;
  apiKey?: string;
  modelName?: string;
  baseUrl?: string;
}

export interface CreateAsrProviderConfig {
  providerName: string;
  appId?: string;
  accessToken?: string;
  clusterId?: string;
  apiKey?: string;
  modelName?: string;
  baseUrl?: string;
}

export const listAsrProviders = () => {
  return request.get<AsrProviderConfig[]>('/api/admin/asr-provider/config') as unknown as Promise<AsrProviderConfig[]>;
};

export const saveAsrProviderConfig = (data: CreateAsrProviderConfig) => {
  return request.post('/api/admin/asr-provider/config', data);
};

export const createAsrProvider = saveAsrProviderConfig;
export const updateAsrProvider = saveAsrProviderConfig;

export const deleteAsrProviderConfig = (providerName: string) => {
  return request.delete(`/api/admin/asr-provider/config/${providerName}`);
};

export const deleteAsrProvider = deleteAsrProviderConfig;

export const testAsr = (file: File, provider?: string) => {
  const formData = new FormData();
  formData.append('file', file);
  if (provider) {
    formData.append('provider', provider);
  }
  return request.post<string>('/api/admin/asr-provider/config/test', formData) as unknown as Promise<string>;
};

export const recognizeSpeech = async (file: File): Promise<string> => {
  const activeConfig = await getAsrActiveConfig();
  if (!activeConfig || !activeConfig.activeProvider) {
    throw new Error('No active ASR provider configured');
  }
  return testAsr(file, activeConfig.activeProvider);
};

export const getAsrWebSocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // 如果是开发环境，可能需要指向后端端口（通常是8080）
  // 这里假设前端代理已经配置好了 /ws/asr 的转发，或者直接连后端
  // 如果前端是 vite 启动的，通常会有 proxy 配置
  // 假设后端地址和 API 地址一致
  const host = window.location.host;
  return `${protocol}//${host}/ws/asr`;
};
