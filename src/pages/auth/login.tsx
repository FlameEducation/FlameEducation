import React, {useState, useEffect} from 'react';
import {User, Lock, RefreshCw, Sparkles} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useToast} from '@/components/ui/use-toast';
import {login, needCaptcha, getCaptcha, CaptchaResult} from '@/api/auth';
import {navigateTo, RoutePath} from '@/utils/navigate';

const Login: React.FC = () => {
  const {toast} = useToast();
  const [loading, setLoading] = useState(false);
  const [needCaptchaFlag, setNeedCaptchaFlag] = useState(false);
  const [captchaImage, setCaptchaImage] = useState<CaptchaResult | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    captcha: ''
  });

  // 检查是否需要验证码
  useEffect(() => {
    const checkNeedCaptcha = async () => {
      if (formData.username) {
        try {
          const need = await needCaptcha(formData.username);
          console.log('验证码需求检查结果:', need);
          setNeedCaptchaFlag(need);
          if (need && !captchaImage) {
            // 如果需要验证码且还没有加载，立即加载
            refreshCaptcha();
          }
        } catch (error) {
          console.error('检查验证码需求失败:', error);
        }
      } else {
        // 用户名为空时，重置验证码状态
        console.log('用户名为空，重置验证码状态');
        setNeedCaptchaFlag(false);
        setCaptchaImage(null);
      }
    };
    // 防抖
    const timer = setTimeout(() => {
      checkNeedCaptcha();
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.username]);

  const refreshCaptcha = async () => {
    try {
      const result = await getCaptcha();
      console.log('验证码加载成功:', result);
      setCaptchaImage(result);
      setFormData(prev => ({...prev, captcha: ''}));
    } catch (error) {
      console.error('获取验证码失败:', error);
      toast({
        variant: "destructive",
        title: "错误",
        description: "验证码加载失败，请刷新重试"
      });
    }
  };

  // 提交登录
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      
      if (!formData.username || !formData.password) {
        toast({
          variant: "destructive",
          title: "错误",
          description: "请输入用户名和密码"
        });
        return;
      }

      const loginData: any = {
        loginMethod: 'password',
        username: formData.username,
        password: formData.password
      };

      if (needCaptchaFlag) {
        if (!formData.captcha) {
          toast({
            variant: "destructive",
            title: "错误",
            description: "请输入验证码"
          });
          return;
        }
        loginData.captcha = formData.captcha;
        loginData.captchaKey = captchaImage?.key;
      }
      
      await login(loginData);
      
      toast({
        title: "登录成功",
        description: "正在为您跳转..."
      });
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "登录失败",
        description: error.message || "登录失败，请稍后重试"
      });
      // 登录失败刷新验证码
      if (needCaptchaFlag) {
        refreshCaptcha();
      }
      // 重新检查是否需要验证码（可能刚变成需要）
      if (formData.username) {
        const need = await needCaptcha(formData.username);
        console.log('重新检查验证码需求结果:', need);
        setNeedCaptchaFlag(need);
        if (need && !captchaImage) {
          refreshCaptcha();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 动态背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 浮动圆形装饰 */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-gradient-to-br from-blue-300/20 to-cyan-300/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
        
        {/* 网格背景 */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
      </div>

      {/* 登录卡片 */}
      <div className="relative z-10 w-full max-w-md p-8 mx-4">
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-2xl shadow-blue-500/10 p-10 transform transition-all duration-500 hover:shadow-blue-500/20">
          {/* Logo/品牌区域 */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 hover:rotate-3 duration-300">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              欢迎回来
            </h1>
            <p className="text-gray-500 text-sm">登录您的账户以继续学习之旅</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              {/* 用户名 */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300"/>
                </div>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData(prev => ({...prev, username: e.target.value}))}
                  className="block w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl
                            text-gray-900 placeholder-gray-400
                            focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white
                            transition-all duration-300"
                  placeholder="请输入用户名"
                />
              </div>

              {/* 密码 */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300"/>
                </div>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData(prev => ({...prev, password: e.target.value}))}
                  className="block w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl
                            text-gray-900 placeholder-gray-400
                            focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white
                            transition-all duration-300"
                  placeholder="请输入密码"
                />
              </div>

              {/* 验证码 */}
              {needCaptchaFlag && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="flex gap-3 items-start">
                    <input
                      type="text"
                      value={formData.captcha}
                      onChange={e => setFormData(prev => ({...prev, captcha: e.target.value}))}
                      className="w-40 px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl
                                text-gray-900 placeholder-gray-400
                                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white
                                transition-all duration-300"
                      placeholder="请输入验证码"
                      maxLength={6}
                    />

                    <div 
                      className="relative flex-1 h-[54px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden cursor-pointer border-2 border-gray-200 hover:border-blue-400 transition-all duration-300 group shadow-sm hover:shadow-md"
                      onClick={refreshCaptcha}
                      title="点击刷新验证码"
                    >
                      {captchaImage ? (
                        <>
                          <img 
                            src={captchaImage.imageBase64} 
                            alt="验证码" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                            <RefreshCw className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                          <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 ml-1">
                    <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                    检测到多次登录失败，需要验证码验证
                  </p>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:via-purple-600 hover:to-purple-700
                        text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-600/40
                        transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                        disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100
                        relative overflow-hidden group"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>登录中...</span>
                  </>
                ) : (
                  <span>登录</span>
                )}
              </span>
            </Button>
          </form>

        </div>
      </div>

      {/* 装饰性浮动元素 */}
      <div className="fixed top-10 right-10 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-bounce pointer-events-none" style={{animationDuration: '3s'}} />
      <div className="fixed bottom-10 left-10 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-bounce pointer-events-none" style={{animationDuration: '4s', animationDelay: '1s'}} />
    </div>
  );
};

export default Login;
