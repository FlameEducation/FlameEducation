import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';
import { getBalanceDetail, getCurrentUser } from '@/api/session';
import { BalanceRecord, UserInfo } from '@/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const BalanceDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [balanceRecords, setBalanceRecords] = useState<BalanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userRes, balanceRes] = await Promise.all([
          getCurrentUser(),
          getBalanceDetail(0, 50)
        ]);
        
        setUserInfo(userRes);
        setBalanceRecords(balanceRes || []);
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 格式化时间
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MM月dd日 HH:mm', { locale: zhCN });
    } catch {
      return dateString;
    }
  };

  // 获取交易类型图标和颜色
  const getTransactionStyle = (changeType: string, changeAmount: number) => {
    const isIncome = changeAmount > 0;
    
    return {
      icon: isIncome ? TrendingUp : TrendingDown,
      color: isIncome ? 'text-green-500' : 'text-red-500',
      bgColor: isIncome ? 'bg-green-50' : 'bg-red-50',
      amount: isIncome ? `+${changeAmount}` : `${changeAmount}`
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className={theme.gradients.header}>
          <div className="px-4 pt-3 pb-6">
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className={theme.typography.title.primary}>余额明细</h1>
            </div>
            <div className="bg-white/10 rounded-lg p-4 animate-pulse">
              <div className="h-6 bg-white/20 rounded w-1/2 mb-2" />
              <div className="h-8 bg-white/20 rounded w-1/3" />
            </div>
          </div>
        </div>
        <div className="flex-1 -mt-4 rounded-t-[2rem] bg-gray-50 p-4">
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
                      <div className="h-3 bg-gray-200 rounded w-16" />
                    </div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 顶部余额信息 */}
      <div className={theme.gradients.header}>
        <div className="px-4 pt-3 pb-6">
          {/* 导航栏 */}
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/10 hover:bg-white/20 text-white"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className={theme.typography.title.primary}>余额明细</h1>
          </div>

          {/* 余额卡片 */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <div className="p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-5 h-5" />
                <span className="text-white/80">当前余额</span>
              </div>
              <div className="text-3xl font-bold">
                {userInfo?.balance || 0} 💎
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 交易记录 */}
      <div className="flex-1 -mt-4 rounded-t-[2rem] bg-gray-50 overflow-hidden">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-800">交易记录</h2>
          </div>

          {balanceRecords.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">暂无交易记录</h3>
              <p className="text-gray-500">
                完成课程学习或其他活动后，相关记录会在这里显示
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {balanceRecords.map((record, index) => {
                const style = getTransactionStyle(record.changeType, record.changeAmount);
                const IconComponent = style.icon;
                
                return (
                  <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${style.bgColor} flex items-center justify-center`}>
                          <IconComponent className={`w-5 h-5 ${style.color}`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800">
                            {record.changeName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(record.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className={`font-bold ${style.color}`}>
                        {style.amount} 💎
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* 底部说明 */}
          <Card className="mt-6 p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                <span className="text-white text-xs">💡</span>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-1">关于宝石</h4>
                <p className="text-sm text-blue-600">
                  通过完成课程学习、参与活动等方式可以获得宝石奖励。宝石可用于解锁更多学习内容和功能。更多功能后续推出。
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BalanceDetailPage; 