import request from '@/utils/request';

// 图片生成状态响应接口，根据后端实际返回格式调整
export interface ImageGenerateStatusResponse {
  uuid: string;
  url: string;  // 图片生成后的URL
  generateOver: boolean;  // 是否生成完成
  generateError: boolean; // 是否生成出错
}

/**
 * 获取图片生成状态
 * @param uuid 图片生成请求的UUID
 * @returns 图片生成状态响应
 */
export const getImageGenerateStatus = async (uuid: string): Promise<ImageGenerateStatusResponse> => {
  return request.get<any, ImageGenerateStatusResponse>(`/api/image/getImageGenerateStatus/${uuid}`);
};

/**
 * 重新生成图片
 * @param uuid 图片生成请求的UUID
 * @returns 结果
 */
export const regenerateImage = async (uuid: string): Promise<string> => {
  return request.post<any, string>(`/api/image/regenerate/${uuid}`);
};
