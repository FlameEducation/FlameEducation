export interface RewardDetails {
  rewardName: string;
  rewardNumber: number;
  received: boolean;
}

export interface LessonRewardItem {
  rewardName: string;
  rewardNumber: number;
  received: boolean;
  createdAt: string;
}

export interface RewardStatus {
  lessonIsReceived: boolean;  // 课程奖励是否已全部领取
  receivedCount: number;      // 已领取的奖励数量
}