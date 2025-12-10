// 聊天信息类型
export interface ChatMessage {
  id: string;
  uuid: string;
  role: 'user' | 'assistant';
  content: string;
  contentType?: string; // 消息内容类型
  audioUrl: string;

  // 附件相关
  blackboardUuid: string;
  blackboardTitle?: string; // 新增
  mindMapUuid?: string;
  mindMapTitle?: string; // 新增
  imageUuid: string;
  imageTitle?: string; // 新增
  exerciseUuid: string;
  
  // 无答案选择题数据（直接在消息中展示）
  noAnswerChoiceData?: {
    type: 'noAnswerSingleChoice' | 'noAnswerMultipleChoice';
    title: string;
    question: string;
    options: { [key: string]: string };
    explanation?: string;
  };
  
  // 奖励相关 - 只保留ID，其他信息由组件自行获取
  rewardUuid?: string; 
  
  createdAt: string;  

  // 加载相关
  done: boolean;
  isLoading: boolean;
  audioType: 'url' | 'stream';
  audioBlocks: Map<number, string>;
  audioBlocksLength: number;
  textBlocks: Map<number, string>;
  textBlocksLength: number;
  imageUrl: string;
  exerciseData: any;
  
  // 🔑 新增：音频总块数
  totalAudioBlocks?: number;

  // 消息状态
  status?: 'sending' | 'success' | 'error';
}
