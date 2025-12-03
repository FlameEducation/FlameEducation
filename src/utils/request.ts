import axios from 'axios';
import { toast as showToast } from '@/components/ui/use-toast';

// 创建一个toast包装函数
const toast = (props: { title: string; description: string; variant: "default" | "destructive" }) => {
  // 确保在客户端环境下执行
  if (typeof window !== 'undefined') {
    showToast(props);
  }
};

// 创建axios实例
const request = axios.create({
  timeout: 30000000,
  // 添加响应类型配置
  responseType: 'json'
});

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `${token}`;
    }

    // 对POST请求进行特殊处理，将普通对象转换为FormData
    if (config.method?.toLowerCase() === 'post' && config.data && !(config.data instanceof FormData)) {
      // const formData = new FormData();
      // Object.entries(config.data).forEach(([key, value]) => {
      //   // 如果值是数组，需要特殊处理
      //   if (Array.isArray(value)) {
      //     value.forEach((item, index) => {
      //       // 确保item是字符串或Blob
      //       formData.append(`${key}[${index}]`, String(item));
      //     });
      //   }
      //   // 如果值是对象，转换为JSON字符串course.units
      //   else if (typeof value === 'object' && value !== null) {
      //     formData.append(key, JSON.stringify(value));
      //   }
      //   // 其他情况转换为字符串
      //   else if (value !== undefined && value !== null) {
      //     formData.append(key, String(value));
      //   }
      // });
      // config.data = formData;
      // config.headers['Content-Type'] = 'multipart/form-data';
    }

    return config;
  },
  error => {
    // 请求错误处理
    toast({
      variant: "destructive",
      title: "请求错误",
      description: error.message || "发送请求时发生错误"
    });
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 如果是流式响应，直接返回response
    if (response.config.responseType === 'stream') {
      return response;
    }
    
    const res = response.data;
    if (res.code !== 200) {
      // 处理未初始化状态
      if (res.code === 428) {
        if (window.location.pathname !== '/init') {
          window.location.href = '/init';
        }
        return Promise.reject(new Error(res.message || '系统未初始化'));
      }

      // 处理业务错误
      if (res.code === 401) {
        // 未登录或token过期，清除token并跳转到登录页
        localStorage.removeItem('token');
        toast({
          variant: "destructive",
          title: "登录已过期",
          description: "请重新登录"
        });
        window.location.href = '/auth/login';
        return Promise.reject(new Error('未登录或登录已过期'));
      }
      // 显示业务错误信息
      toast({
        variant: "destructive",
        title: "请求失败",
        description: res.message || "操作未成功"
      });
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    return res.data;
  },
  error => {
    // 如果是流式请求的错误，直接抛出
    if (error.config?.responseType === 'stream') {
      return Promise.reject(error);
    }
    
    // 处理网络错误
    if (error.response) {
      // 处理 428 状态码 (Precondition Required) - 系统未初始化
      if (error.response.status === 428) {
        if (window.location.pathname !== '/init') {
          window.location.href = '/init';
        }
        return Promise.reject(error);
      }

      if (error.response.status === 401) {
        // 未授权，清除token并跳转到登录页
        localStorage.removeItem('token');
        toast({
          variant: "destructive",
          title: "登录已过期",
          description: "请重新登录"
        });
        window.location.href = '/auth/login';
        return Promise.reject(new Error('未登录或登录已过期'));
      }
      
      // 显示HTTP错误信息
      toast({
        variant: "destructive",
        title: `请求失败 (${error.response.status})`,
        description: error.response.data?.message || "服务器响应错误"
      });
    } else if (error.request) {
      // 请求发出但未收到响应
      toast({
        variant: "destructive",
        title: "网络错误",
        description: "无法连接到服务器，请检查网络连接"
      });
    } else {
      // 请求配置错误
      toast({
        variant: "destructive",
        title: "请求错误",
        description: error.message || "发送请求时发生错误"
      });
    }
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

export default request;
