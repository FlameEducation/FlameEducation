import request from '@/utils/request';

export interface BlackboardContent {
  uuid: string;
  content: string;
  title: string;
  error: boolean;
  over: boolean;
}

// 获取黑板内容
export const getBlackboardContent = async (blackboardUuid: string): Promise<BlackboardContent> => {
  return request.get('/api/blackboard/content/' + blackboardUuid);
};

// 重新生成黑板内容
export const regenerateBlackboard = async (blackboardUuid: string): Promise<boolean> => {
  return request.post('/api/blackboard/reGenerate', { blackboardUuid });
};

// 保存小黑板生成的元数据
export const saveBlackboardMetadata = async (data: any): Promise<boolean> => {
  return request.post('/api/blackboard/metadata/save', data);
};

// 获取小黑板之前保存的元数据
export const getBlackboardMetadata = async (blackboardUuid: string): Promise<any> => {
  return request.get('/api/blackboard/metadata/get', {
    params: { blackboardUuid }
  });
};