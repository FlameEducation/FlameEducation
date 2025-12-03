import request from '@/utils/request';
import { UserInfo } from '@/types';


// 获取当前用户信息
export const getCurrentUser = async (): Promise<UserInfo> => {
    return request.get<any, UserInfo>('/api/user/current');
};

// 获取用户收支明细
export const getBalanceDetail = async (page: number = 0, pageSize: number = 100): Promise<any[]> => {
    return request.get<any, any[]>('/api/user/balanceDetail', {
        params: { page, pageSize }
    });
};



