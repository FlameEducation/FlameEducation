import request from '@/utils/request';

export const getMindMapContent = (uuid: string) => {
  return request.get(`/api/mindmap/content/${uuid}`);
};

export const regenerateMindMap = (uuid: string) => {
  return request.post('/api/mindmap/reGenerate', { mindMapUuid: uuid });
};
