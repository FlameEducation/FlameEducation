// 用户相关类型
export interface UserInfo {
    uuid: string;
    nickname: string;
    avatarUrl: string;
    balance: number;
    age?: number;
}

// 收支明细类型
export interface BalanceRecord {
    changeType: string;    // 变动类型
    changeName: string;    // 变动名称
    changeAmount: number;  // 变动金额
    createdAt: string;     // 创建时间
}

// API响应基础类型
export interface ApiResponse<T = any> {
    code: number;
    message?: string;
    data: T;
}

// 导出课程相关类型
export * from './course';

// 导出班级管理相关类型
export * from './class';

// 导出聊天消息相关类型（保持现有）
export * from './ChatMessage';

// 导出Python代码运行结果类型（保持现有）
export * from './PythonCodeRunResult';
