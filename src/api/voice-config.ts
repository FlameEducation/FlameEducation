import request from '@/utils/request';

export interface VoiceConfig {
  uuid: string;
  voiceName?: string;
  voiceProvider: string;
  voiceModel?: string;
  emotionConfig?: string;
  speedRatio?: number;
}

export const updateVoiceConfig = (uuid: string, data: Partial<VoiceConfig>) => {
  return request.put(`/api/admin/teachers/${uuid}/voice`, data);
};
