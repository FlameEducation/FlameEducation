import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import SettingsLayout from '../components/SettingsLayout';
import { CourseList } from './components/CourseList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Save,
  X,
  BookOpen,
  Clock,
  Users,
  TrendingUp,
  Image as ImageIcon,
} from 'lucide-react';
import * as adminCourseApi from '@/api/admin-course';
import type { CourseData, CourseStats, PromptTemplate, CoursePromptBinding, CourseToolStatus } from '@/api/admin-course';
import CurriculumEditor from './components/CurriculumEditor';
import {listPromptTemplates} from "@/api/promptConfig";

const AdminCoursesPage: React.FC = () => {
  const { toast } = useToast();
  
  // 状态
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseData | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [generatingCoverCourseUuid, setGeneratingCoverCourseUuid] = useState<string | null>(null);
  
  // Prompt 选择器状态
  const [coursePromptBindings, setCoursePromptBindings] = useState<Record<string, CoursePromptBinding>>({});
  const [courseToolBindings, setCourseToolBindings] = useState<Record<string, CourseToolStatus[]>>({});
  
  // 表单状态
  const [formData, setFormData] = useState<Partial<CourseData>>({
    title: '',
    description: '',
    status: 1,
    aiTeacherUuid: '',
    sequentialLearn: true,
  });

  // 排序状态
  const [sortBy, setSortBy] = useState<'createTime' | 'progress' | 'title'>('createTime');

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 加载统计数据
      const statsData = await adminCourseApi.getCourseStats();
      setStats(statsData);
      
      // 加载 Prompt 模板列表
      const templates = await listPromptTemplates({});
      setPromptTemplates(templates);
      
      // 加载课程列表
      const courseList = await adminCourseApi.getCourseList();
      setCourses(courseList);

      // 加载每个课程的 Prompt 绑定信息
      const bindingsMap: Record<string, CoursePromptBinding> = {};
      const toolBindingsMap: Record<string, CourseToolStatus[]> = {};
      for (const course of courseList) {
        if (course.uuid) {
          try {
            const binding = await adminCourseApi.getCoursePromptBindings(course.uuid);
            bindingsMap[course.uuid] = binding;
          } catch (error) {
            console.error(`Failed to load prompt bindings for course ${course.uuid}:`, error);
          }

          try {
            const tools = await adminCourseApi.getCourseTools(course.uuid);
            toolBindingsMap[course.uuid] = tools || [];
          } catch (error) {
            console.error(`Failed to load tool bindings for course ${course.uuid}:`, error);
          }
        }
      }
      setCoursePromptBindings(bindingsMap);
      setCourseToolBindings(toolBindingsMap);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 打开编辑对话框
  const handleEdit = async (courseUuid: string) => {
    try {
      const course = await adminCourseApi.getCourseDetail(courseUuid);
      setEditingCourse(course);
      setFormData({
        ...course,
        aiTeacherUuid: course.aiTeacherUuid || 'none', // 确保不是空字符串
      });
      setPreviewImage(course.coverImageUrl || null);
      setCoverImageFile(null);
      setActiveTab("basic");
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error('Failed to load course:', error);
    }
  };

  // 打开新建对话框
  const handleCreate = () => {
    setEditingCourse(null);
    setFormData({
      title: '',
      description: '',
      status: 0,
      aiTeacherUuid: 'none',
      sequentialLearn: true,
    });
    setPreviewImage(null);
    setCoverImageFile(null);
    setActiveTab("basic");
    setIsEditDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 保存课程
  const handleSave = async () => {
    try {
      const formDataObj = new FormData();
      
      // 添加必填字段 - 仅保留标题和描述
      if (formData.title) formDataObj.append('title', formData.title);
      if (formData.description) formDataObj.append('description', formData.description);
      
      if (coverImageFile) {
        formDataObj.append('coverImage', coverImageFile);
      }

      if (editingCourse) {
        // 更新 - 仅更新基本信息（标题、描述）
        if (!editingCourse.uuid) {
          toast({ variant: "destructive", title: "错误", description: "课程UUID丢失，无法更新" });
          return;
        }
        formDataObj.append('uuid', editingCourse.uuid);
        await adminCourseApi.updateCourse(formDataObj);
        toast({ title: "成功", description: "课程基本信息已更新" });
      } else {
        // 创建
        const newUuid = await adminCourseApi.createCourse(formDataObj);
        // 如果是创建，创建成功后切换到编辑模式，以便添加章节
        const newCourse = await adminCourseApi.getCourseDetail(newUuid);
        setEditingCourse(newCourse);
        toast({ title: "成功", description: "课程已创建，现在可以添加章节了" });
        
        // 自动切换到大纲页
        setActiveTab("curriculum");
      }
      
      // 刷新列表
      loadData();
    } catch (error) {
      console.error('Failed to save course:', error);
      toast({ variant: "destructive", title: "错误", description: "保存失败" });
    }
  };

  // 删除课程
  const handleDelete = async (courseUuid: string) => {
    if (!confirm('确定要删除这个课程吗？')) return;
    
    try {
      await adminCourseApi.deleteCourse(courseUuid);
      loadData(); // 重新加载数据
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  // 更新课程的Prompt绑定
  const handleUpdatePromptBinding = async (
    courseUuid: string,
    sceneType: 'chat' | 'blackboard',
    promptUuid?: string
  ) => {
    try {
      // 获取当前绑定信息
      const currentBinding = coursePromptBindings[courseUuid] || {};
      
      // 更新对应场景的Prompt UUID
      const updatedBinding = {
        courseUuid,
        chatPromptUuid: sceneType === 'chat' ? promptUuid : currentBinding.chatPromptUuid,
        blackboardPromptUuid: sceneType === 'blackboard' ? promptUuid : currentBinding.blackboardPromptUuid,
      };

      // 调用API保存
      await adminCourseApi.updateCoursePromptBindings(courseUuid, updatedBinding);
      
      // 更新本地状态
      setCoursePromptBindings(prev => ({
        ...prev,
        [courseUuid]: updatedBinding
      }));

      // 更新课程列表中的课程数据
      setCourses(prev => prev.map(course => {
        if (course.uuid === courseUuid) {
          return {
            ...course,
            chatPromptUuid: updatedBinding.chatPromptUuid,
            blackboardPromptUuid: updatedBinding.blackboardPromptUuid,
          };
        }
        return course;
      }));

      console.log('Prompt 绑定更新成功');
    } catch (error) {
      console.error('Failed to update prompt binding:', error);
    }
  };

  const handleToggleTool = async (courseUuid: string, toolUuid: string, nextEnabled: boolean) => {
    const currentTools = courseToolBindings[courseUuid] || [];
    if (currentTools.length === 0) {
      return;
    }

    const updatedTools = currentTools.map(tool =>
      tool.toolUuid === toolUuid ? { ...tool, isEnabled: nextEnabled } : tool
    );
    setCourseToolBindings(prev => ({
      ...prev,
      [courseUuid]: updatedTools,
    }));

    const enabledToolUuids = updatedTools
      .filter(tool => tool.isEnabled)
      .map(tool => tool.toolUuid);

    try {
      await adminCourseApi.updateCourseTools(courseUuid, enabledToolUuids);
      toast({
        title: '成功',
        description: `工具已${nextEnabled ? '启用' : '停用'}`,
      });
    } catch (error: any) {
      console.error('Failed to update tool bindings:', error);
      setCourseToolBindings(prev => ({
        ...prev,
        [courseUuid]: currentTools,
      }));
      toast({
        variant: 'destructive',
        title: '错误',
        description: error?.message || '更新工具状态失败',
      });
    }
  };

  // 切换课程状态
  const handleToggleStatus = async (courseUuid: string, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      
      // 获取课程信息以检查Prompt绑定情况
      const course = courses.find(c => c.uuid === courseUuid);
      if (!course) {
        toast({
          variant: "destructive",
          title: "错误",
          description: "课程信息未找到"
        });
        return;
      }
      
      // 如果要变为公开状态（status=1），需要检查两个Prompt是否都已绑定
      if (newStatus === 1) {
        const chatPromptUuid = coursePromptBindings[courseUuid]?.chatPromptUuid;
        const blackboardPromptUuid = coursePromptBindings[courseUuid]?.blackboardPromptUuid;
        
        if (!chatPromptUuid || !blackboardPromptUuid) {
          toast({
            variant: "destructive",
            title: "无法发布课程",
            description: "将课程变为公开状态需要绑定所有两个Prompt（聊天、小黑板）"
          });
          return;
        }
      }
      
      await adminCourseApi.updateCourseStatus(courseUuid, newStatus);
      
      // 直接更新本地状态，无需重新加载整个列表
      setCourses(prev => prev.map(course => 
        course.uuid === courseUuid 
          ? { ...course, status: newStatus }
          : course
      ));
      
      toast({
        title: "成功",
        description: `课程状态已更新为${newStatus === 1 ? '公开' : '非公开'}`
      });
      
      console.log(`课程状态更新成功: ${courseUuid} -> ${newStatus === 1 ? '公开' : '非公开'}`);
    } catch (error: any) {
      console.error('Failed to toggle status:', error);
      toast({
        variant: "destructive",
        title: "错误",
        description: error?.message || "更新课程状态失败"
      });
    }
  };

  // 获取排序后的课程列表
  const getSortedCourses = () => {
    const sortedList = [...courses];
    
    switch (sortBy) {
      case 'createTime':
        // 按创建时间倒序（最新的在前）
        return sortedList.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
      case 'progress':
        // 按课程课时倒序（课时最多的在前）
        return sortedList.sort((a, b) => {
          const lessonsA = a.totalLessons || 0;
          const lessonsB = b.totalLessons || 0;
          return lessonsB - lessonsA;
        });
      case 'title':
        // 按课程名称字母顺序排序
        return sortedList.sort((a, b) => {
          return (a.title || '').localeCompare(b.title || '', 'zh-CN');
        });
      default:
        return sortedList;
    }
  };

  const handleGenerateCover = async (courseUuid: string) => {
    if (generatingCoverCourseUuid) return;
    
    try {
      setGeneratingCoverCourseUuid(courseUuid);
      toast({
        title: "正在生成封面",
        description: "AI正在为您绘制课程封面，请稍候...",
      });
      
      const updatedCourse = await adminCourseApi.generateCourseCover(courseUuid);
      
      // 更新列表中的课程封面
      setCourses(prev => prev.map(c => 
        c.uuid === courseUuid 
          ? { ...c, coverImageUrl: updatedCourse.coverImageUrl } 
          : c
      ));
      
      toast({
        title: "封面生成成功",
        description: "课程封面已自动更新",
      });
      
      // 重新加载数据以确保一致性
      await loadData();
    } catch (error: any) {
      console.error('Failed to generate cover:', error);
      toast({
        variant: "destructive",
        title: "生成失败",
        description: error.message || "无法生成课程封面",
      });
    } finally {
      setGeneratingCoverCourseUuid(null);
    }
  };

  const handleExport = (uuid: string, title: string) => {
    try {
      const token = localStorage.getItem('token');
      let exportUrl = `/api/admin/course/export?uuid=${uuid}`;
      if (token) {
        exportUrl += `&token=${encodeURIComponent(token)}`;
      }
      window.open(exportUrl, '_blank');

      toast({
        title: "导出请求已发送",
        description: "如果下载没有开始，请检查浏览器拦截设置"
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        variant: "destructive",
        title: "导出失败",
        description: "无法导出课程"
      });
    }
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.data';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        setLoading(true);
        await adminCourseApi.importCourse(file);
        toast({
          title: "导入成功",
          description: "课程已成功导入"
        });
        loadData();
      } catch (error: any) {
        console.error('Import failed:', error);
        toast({
          variant: "destructive",
          title: "导入失败",
          description: error?.message || "无法导入课程"
        });
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  return (

    <SettingsLayout
      title="课程管理"
      description="管理课程，支持添加、编辑和删除课程。"
    >     
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card className="p-4 md:p-6 bg-gradient-to-br from-blue-50 to-white border-blue-100">
              <div className="flex items-start md:items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-slate-600 mb-1">总课程数</p>
                  <p className="text-2xl md:text-3xl font-bold text-blue-600">{stats.totalCourses}</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 bg-gradient-to-br from-green-50 to-white border-green-100">
              <div className="flex items-start md:items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-slate-600 mb-1">已发布</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-600">{stats.publishedCourses}</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 bg-gradient-to-br from-amber-50 to-white border-amber-100">
              <div className="flex items-start md:items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-slate-600 mb-1">草稿</p>
                  <p className="text-2xl md:text-3xl font-bold text-amber-600">{stats.draftCourses}</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 bg-gradient-to-br from-purple-50 to-white border-purple-100">
              <div className="flex items-start md:items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-slate-600 mb-1">总课时</p>
                  <p className="text-2xl md:text-3xl font-bold text-purple-600">{stats.totalLessons}</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 课程列表 */}
        <CourseList
          courses={courses}
          loading={loading}
          sortBy={sortBy}
          onSortChange={setSortBy}
          promptTemplates={promptTemplates}
          coursePromptBindings={coursePromptBindings}
          courseToolBindings={courseToolBindings}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          onUpdatePromptBinding={handleUpdatePromptBinding}
          onToggleTool={handleToggleTool}
          onCreate={handleCreate}
          onImport={handleImportClick}
          generatingCoverCourseUuid={generatingCoverCourseUuid}
          onGenerateCover={handleGenerateCover}
          onExport={handleExport}
        />
      </div>

      {/* 编辑/创建对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>{editingCourse ? '编辑课程' : '创建课程'}</DialogTitle>
            <DialogDescription>
              {editingCourse ? '管理课程信息和章节内容' : '填写课程基本信息'}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 pt-2 border-b bg-slate-50/50">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="basic">基本信息</TabsTrigger>
                <TabsTrigger value="curriculum" disabled={!editingCourse}>课程大纲</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="basic" className="flex-1 overflow-y-auto p-6 space-y-6 m-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 左侧：封面图 */}
                <div className="space-y-2">
                  <Label>课程封面</Label>
                  <div className="aspect-video w-full bg-slate-100 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden relative group hover:border-blue-400 transition-colors cursor-pointer"
                       onClick={() => document.getElementById('cover-upload')?.click()}>
                     {previewImage ? (
                       <img src={previewImage} className="w-full h-full object-cover" />
                     ) : (
                       <div className="flex flex-col items-center gap-2 text-slate-400">
                         <ImageIcon className="w-8 h-8" />
                         <span className="text-xs">点击上传封面</span>
                       </div>
                     )}
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-sm font-medium">更换图片</span>
                     </div>
                  </div>
                  <Input 
                      id="cover-upload"
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                  />
                  <p className="text-xs text-slate-500">建议尺寸: 16:9 (如 1280x720)</p>
                </div>

                {/* 右侧：表单 */}
                <div className="md:col-span-2 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">课程标题 *</Label>
                    <Input
                      id="title"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="输入课程标题"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">课程描述 *</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="输入课程描述"
                      rows={6}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="curriculum" className="flex-1 overflow-y-auto p-6 m-0 bg-slate-50/30">
               {editingCourse && <CurriculumEditor courseUuid={editingCourse.uuid!} />}
            </TabsContent>
          </Tabs>

          <div className="px-6 py-4 border-t bg-white flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              <X className="w-4 h-4 mr-2" />
              关闭
            </Button>
            {activeTab === 'basic' && (
              <Button
                onClick={handleSave}
                className="bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingCourse ? '保存基本信息' : '创建课程'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </SettingsLayout>
  );
};

export default AdminCoursesPage;
