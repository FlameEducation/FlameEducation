import request from '@/utils/request';

export interface AsrActiveConfig {
  activeProvider: string;
  googleModelName?: string;
}

export interface UpdateAsrActiveConfig {
  activeProvider: string;
  googleModelName?: string;
}

export const getAsrActiveConfig = () => {
  return request.get<AsrActiveConfig>('/api/admin/asr-provider/config/active');
};

export const updateAsrActiveConfig = (data: UpdateAsrActiveConfig) => {
  return request.post('/api/admin/asr-provider/config/active', data);
};
