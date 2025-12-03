import {Button} from "@/components/ui/button.tsx";
import {Lock, LogOut} from "lucide-react";
import {useNavigate} from "react-router-dom";
import { logout } from '@/api/auth';
import React, {useState} from "react";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog.tsx";
import {Input} from "@/components/ui/input.tsx";
import {useToast} from "@/components/ui/use-toast.ts";
import api from "@/api/index.ts";

const Functions = () => {

  const navigate = useNavigate();

  const {toast} = useToast();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    // 验证两次新密码是否一致
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        variant: "destructive",
        title: "密码不匹配",
        description: "两次输入的新密码不一致"
      });
      return;
    }

    // 验证新密码长度
    if (passwordForm.newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "密码太短",
        description: "新密码长度至少为6位"
      });
      return;
    }

    // 验证旧密码是否为空
    if (!passwordForm.oldPassword) {
      toast({
        variant: "destructive",
        title: "请输入旧密码",
        description: "请输入当前使用的密码"
      });
      return;
    }

    try {
      setIsChangingPassword(true);
      await api.changePassword(passwordForm.oldPassword, passwordForm.newPassword);

      toast({
        title: "密码修改成功",
        description: "请使用新密码登录"
      });

      // 关闭弹窗并重置表单
      setShowChangePassword(false);
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // 可以选择跳转到登录页
      setTimeout(() => {
        // 退出登录
        api.logout();
      }, 1500);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "修改失败",
        description: error.message || "密码修改失败，请稍后重试"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };


  return (
    <>
      {/* 修改密码弹窗 */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">旧密码</label>
              <Input
                type="password"
                placeholder="请输入当前密码"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm(prev => ({...prev, oldPassword: e.target.value}))}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">新密码</label>
              <Input
                type="password"
                placeholder="请输入新密码（至少6位）"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({...prev, newPassword: e.target.value}))}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">确认新密码</label>
              <Input
                type="password"
                placeholder="请再次输入新密码"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({...prev, confirmPassword: e.target.value}))}
                className="w-full"
              />
              {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="text-sm text-red-600">两次输入的密码不一致</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePassword(false)}>
              取消
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? '修改中...' : '确认修改'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 修改密码卡片 */}
      <div 
        className="p-6 bg-white border border-gray-200 rounded-lg hover:border-gray-900 transition-colors cursor-pointer group"
        onClick={() => setShowChangePassword(true)}
      >
        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-900 transition-colors">
          <Lock className="w-5 h-5 text-gray-900 group-hover:text-white transition-colors" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">修改密码</h3>
        <p className="text-sm text-gray-500">定期修改密码保护账号安全</p>
      </div>

      {/* 退出登录卡片 */}
      <div 
        className="p-6 bg-white border border-gray-200 rounded-lg hover:border-red-500 transition-colors cursor-pointer group"
        onClick={() => {
          logout();
          navigate('/auth/login');
        }}
      >
        <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-500 transition-colors">
          <LogOut className="w-5 h-5 text-red-500 group-hover:text-white transition-colors" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1 group-hover:text-red-500 transition-colors">退出登录</h3>
        <p className="text-sm text-gray-500 group-hover:text-red-400 transition-colors">安全退出当前账号</p>
      </div>
    </>
  )
}

export default Functions;