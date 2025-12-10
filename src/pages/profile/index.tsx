import React, {useState, useEffect} from 'react';
import {Button} from "@/components/ui/button";
import {api} from '@/api';
import {UserInfo} from '@/types';
import {
  Wallet, User, History
} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import Logout from './components/Logout'
import EditProfileDialog from './components/EditProfileDialog';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const loadUserInfo = () => {
    setIsLoading(true);
    api.getCurrentUser().then((res) => {
      setUserInfo(res);
    }).finally(() => {
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadUserInfo();
  }, []);

  const menuItems = [
    {
      icon: History,
      label: "积分记录",
      description: "查看积分获取与消耗明细",
      path: "/balance"
    }
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-6 space-y-6">
        <div className="p-8 bg-white border border-gray-200 rounded-lg animate-pulse h-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* 用户信息卡片 */}
      <div className="p-8 bg-white border border-gray-200 rounded-lg flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
          {userInfo?.avatarUrl ? (
            <img src={userInfo.avatarUrl} alt={userInfo.nickname} className="w-full h-full object-cover" />
          ) : (
            <User className="w-12 h-12 text-gray-400" />
          )}
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h2 className="text-2xl font-bold text-gray-900">{userInfo?.nickname || '未登录'}</h2>
              {userInfo?.gender === 'male' && <User className="w-5 h-5 text-blue-500" />}
              {userInfo?.gender === 'female' && <User className="w-5 h-5 text-pink-500" />}
            </div>
            <p className="text-gray-500 text-sm mt-1">开启你的AI学习之旅</p>
          </div>
          
          <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
             <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <Wallet className="w-4 h-4 text-gray-900" />
                <span className="text-sm font-medium text-gray-900">{userInfo?.balance || 0} 积分</span>
             </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => setIsEditDialogOpen(true)} className="shrink-0">
          编辑资料
        </Button>
      </div>

      {/* 菜单网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item, index) => (
          <div 
            key={index}
            className="p-6 bg-white border border-gray-200 rounded-lg hover:border-gray-900 transition-colors cursor-pointer group"
            onClick={() => navigate(item.path)}
          >
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-900 transition-colors">
              <item.icon className="w-5 h-5 text-gray-900 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">{item.label}</h3>
            <p className="text-sm text-gray-500">{item.description}</p>
          </div>
        ))}
        
        {/* 退出登录和修改密码组件 */}
        <Logout />
      </div>

      <EditProfileDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
        currentUser={userInfo}
        onSuccess={() => {
          loadUserInfo();
        }}
      />
    </div>
  );
};

export default ProfilePage; 