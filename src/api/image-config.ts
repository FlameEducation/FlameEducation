import request from '@/utils/request';


export interface ImageProviderConfig {
  providerName: string;
  enabled: boolean;
  apiKey?: string;
  model?: string;
  imageSize?: string;
  baseUrl?: string;
  enablePromptOptimization?: boolean;
  promptOptimizationTemplateUuid?: string;
}

export interface CreateImageProviderConfig {
  providerName: string;
  apiKey?: string;
  model?: string;
  imageSize?: string;
  baseUrl?: string;
  enablePromptOptimization?: boolean;
  promptOptimizationTemplateUuid?: string;
}

export interface ImageActiveConfig {
  activeProvider: string;
  // Add other fields if necessary
}

export interface UpdateImageActiveConfig {
  activeProvider: string;
}

export const listImageProviders = () => {
  return request.get<ImageProviderConfig[]>('/api/admin/image-provider/config');
};

export const createImageProvider = (data: CreateImageProviderConfig) => {
  return request.post('/api/admin/image-provider/config', data);
};

export const updateImageProvider = (data: CreateImageProviderConfig) => {
  return request.post('/api/admin/image-provider/config', data);
};

export const deleteImageProvider = (providerName: string) => {
  return request.delete(`/api/admin/image-provider/config/${providerName}`);
};

export const getImageActiveConfig = () => {
  return request.get<ImageActiveConfig>('/api/admin/image-provider/config/active');
};

export const updateImageActiveConfig = (data: UpdateImageActiveConfig) => {
  return request.post('/api/admin/image-provider/config/active', data);
};

export interface ImageTestResult {
  url: string;
}

export const testImageGeneration = (data: CreateImageProviderConfig, prompt: string) => {
  return request.post<any, ImageTestResult>(`/api/admin/image-provider/config/test?prompt=${encodeURIComponent(prompt)}`, data);
};
