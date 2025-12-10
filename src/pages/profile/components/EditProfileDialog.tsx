import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { api } from '@/api';
import { UserInfo } from '@/types';
import { User, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: UserInfo | null;
  onSuccess: () => void;
}

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
  open,
  onOpenChange,
  currentUser,
  onSuccess
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '',
    age: '',
    gender: '',
    avatarFile: null as File | null,
    avatarPreview: ''
  });

  // 当弹窗打开且有用户信息时，初始化表单
  useEffect(() => {
    if (open && currentUser) {
      setFormData({
        nickname: currentUser.nickname || '',
        age: currentUser.age ? currentUser.age.toString() : '',
        gender: currentUser.gender || '',
        avatarFile: null,
        avatarPreview: currentUser.avatarUrl || ''
      });
    }
  }, [open, currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        avatarFile: file,
        avatarPreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      const formDataToSend = new FormData();
      formDataToSend.append('nickname', formData.nickname);
      if (formData.age) {
        formDataToSend.append('age', formData.age);
      }
      if (formData.gender) {
        formDataToSend.append('gender', formData.gender);
      }
      if (formData.avatarFile) {
        formDataToSend.append('avatarFile', formData.avatarFile);
      }

      await api.updateUserInfo(formDataToSend);
      toast.success('保存成功');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>编辑个人资料</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* 头像上传 */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 relative group">
              {formData.avatarPreview ? (
                <img src={formData.avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
              <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Upload className="w-6 h-6 text-white" />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500">点击头像更换图片</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">昵称</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={e => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                placeholder="请输入昵称"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">年龄</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                placeholder="请输入年龄"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">性别</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择性别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">我是男生</SelectItem>
                  <SelectItem value="female">我是女生</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? '保存中...' : '保存修改'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
