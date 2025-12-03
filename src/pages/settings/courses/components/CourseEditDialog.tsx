import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Save } from 'lucide-react';

interface Course {
  uuid?: string;
  title: string;
  description: string;
  aiTeacherUuid?: string;
}

interface CourseEditDialogProps {
  open: boolean;
  course: Course | null;
  onClose: () => void;
  onSave: (data: Course) => Promise<void>;
}

/**
 * 课程编辑对话框组件
 * 用于编辑课程的基本信息（标题、描述）
 */
export const CourseEditDialog: React.FC<CourseEditDialogProps> = ({
  open,
  course,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Course>({
    title: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (course) {
      setFormData({
        ...course,
        aiTeacherUuid: course.aiTeacherUuid || 'none',
      });
    } else {
      setFormData({
        title: '',
        description: '',
      });
    }
  }, [course]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('保存课程失败:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{course ? '编辑课程' : '创建课程'}</DialogTitle>
          <DialogDescription>
            {course ? '修改课程基本信息' : '填写课程基本信息'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 课程标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">课程标题 *</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="输入课程标题"
            />
          </div>

          {/* 课程描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">课程描述 *</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="输入课程描述"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            <X className="w-4 h-4 mr-2" />
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
