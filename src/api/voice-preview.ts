import request from '@/utils/request';

export interface VoicePreviewRequest {
  text: string;
  voiceProvider: string;
  voiceModel: string;
  voiceEmotion: string;
  speedRatio: number;
}

export const previewVoice = async (data: VoicePreviewRequest): Promise<string> => {
  const response = await request.post<string>('/api/admin/teachers/voice/preview', data);
  return response as unknown as string;
};
