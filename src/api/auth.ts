import request from '../utils/request';

export interface LoginParams {
  username: string;
  password: string;
  captcha?: string;
}

export interface RegisterParams {
  username: string;
  password: string;
  nickname?: string;
  email?: string;
  phone?: string;
  captcha?: string;
}

export interface CaptchaResponse {
  captchaKey: string;
  imageBase64: string;
}

export interface LoginDTO {
  loginMethod: 'password';
  username: string;
  password: string;
  captcha?: string;
  captchaKey?: string;
}

export interface CaptchaResult {
  key: string;
  imageBase64: string;
}

/**
 * 获取图形验证码
 * @returns 
 */
export const getCaptcha = async (): Promise<CaptchaResult> => {
  return await request.get('/api/auth/captcha');
};

/**
 * 检查是否需要验证码
 * @param username 
 * @returns 
 */
export const needCaptcha = async (username: string): Promise<boolean> => {
  return await request.get('/api/auth/needCaptcha', {
    params: { username }
  });
};

/**
 * 用户登录
 * @param data 登录信息
 * @returns 登录结果
 */
export const login = async (data: LoginDTO): Promise<string> => {
  return request.post('/api/auth/login', data);
};

/**
 * 用户退出登录
 */
export const logout = async () => {
  try {
    await request.post('/api/auth/logout');
    // 清除 token
    localStorage.removeItem('token');
    // 跳转到登录页
    window.location.href = '/auth/login';
  } catch (error) {
    throw new Error('退出登录失败');
  }
};

/**
 * 修改用户密码
 * @param oldPassword 旧密码
 * @param newPassword 新密码
 * @returns 
 */
export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  return request.post('/api/auth/changePassword', {
    oldPassword,
    newPassword
  });
};

/**
 * 更新用户信息
 * @param data FormData包含nickname, age, avatarFile
 */
export const updateUserInfo = async (data: FormData): Promise<string> => {
  return await request.post('/api/user/update', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};