import { RewardDetails, LessonRewardItem } from "@/types/reward";
import request from '@/utils/request';

/**
 * 根据奖励ID获取奖励详情的API。
 * @param lessonUuid - 课程的唯一标识符。
 * @param rewardUuid - 奖励的唯一标识符。
 * @returns 返回一个包含奖励详情的Promise。
 */
export const getRewardDetails = async (lessonUuid: string, rewardUuid: string): Promise<RewardDetails> => {
  return request.get(`/api/reward/detail/${lessonUuid}/${rewardUuid}`);
};

/**
 * 领取单个奖励的API。
 * @param lessonUuid - 课程的唯一标识符。
 * @param rewardUuid - 要领取的奖励的唯一标识符。
 * @returns 返回一个表示操作成功的Promise。
 */
export const claimReward = async (lessonUuid: string, rewardUuid: string): Promise<{ success: true }> => {
  return request.post(`/api/reward/receive_one/${lessonUuid}/${rewardUuid}`);
};

/**
 * 获取课程奖励列表的API。
 * @param lessonUuid - 课程的唯一标识符。
 * @returns 返回课程的奖励列表。
 */
export const getLessonRewardList = async (lessonUuid: string): Promise<LessonRewardItem[]> => {
  return request.get(`/api/reward/list/${lessonUuid}`);
};

/**
 * 获取课程已领取奖励总数的API。
 * @param lessonUuid - 课程的唯一标识符。
 * @returns 返回已领取的奖励总数。
 */
export const getLessonRewardTotal = async (lessonUuid: string): Promise<number> => {
  return request.get(`/api/reward/total/${lessonUuid}`);
};

/**
 * 一键领取课程所有奖励的API。
 * @param lessonUuid - 课程的唯一标识符。
 * @returns 返回一个表示操作成功的Promise。
 */
export const receiveAllLessonRewards = async (lessonUuid: string): Promise<{ success: true }> => {
  return request.post(`/api/reward/receiveAll/${lessonUuid}`);
};

/**
 * 获取用户对于课程的奖励状态的API。
 * @param lessonUuid - 课程的唯一标识符。
 * @returns 返回奖励状态信息。
 */
export const getRewardStatus = async (lessonUuid: string): Promise<{
  lessonIsReceived: boolean;
  receivedCount: number;
}> => {
  return request.get(`/api/reward/status/${lessonUuid}`);
};

