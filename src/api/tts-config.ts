import request from '@/utils/request';

export interface TtsProviderConfig {
  providerName: string;
  enabled: boolean;
  
  // Azure
  subscriptionKey?: string;
  region?: string;

  // Doubao
  appId?: string;
  accessToken?: string;
  clusterId?: string;
}

export interface CreateTtsProviderConfig {
  providerName: string;
  
  // Azure
  subscriptionKey?: string;
  region?: string;

  // Doubao
  appId?: string;
  accessToken?: string;
  clusterId?: string;
}

export const listTtsProviders = async (): Promise<TtsProviderConfig[]> => {
  const response = await request.get<TtsProviderConfig[]>('/api/admin/tts-provider/config');
  return response as unknown as TtsProviderConfig[];
};

export const saveTtsProviderConfig = async (data: CreateTtsProviderConfig): Promise<void> => {
  await request.post('/api/admin/tts-provider/config', data);
};

export const deleteTtsProviderConfig = async (providerName: string): Promise<void> => {
  await request.delete(`/api/admin/tts-provider/config/${providerName}`);
};
