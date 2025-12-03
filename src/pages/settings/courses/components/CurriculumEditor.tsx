import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, GripVertical, FileText, Video } from 'lucide-react';
import * as adminCourseApi from '@/api/admin-course';
import type { Chapter, Lesson } from '@/api/admin-course';

interface CurriculumEditorProps {
  courseUuid: string;
}

const CurriculumEditor: React.FC<CurriculumEditorProps> = ({ courseUuid }) => {
  const { toast } = useToast();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Partial<Chapter> | null>(null);
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);
  const [selectedChapterUuid, setSelectedChapterUuid] = useState<string | null>(null);

  useEffect(() => {
    loadChapters();
  }, [courseUuid]);

  const loadChapters = async () => {
    setLoading(true);
    try {
      const data = await adminCourseApi.getCourseChapters(courseUuid);
      // Sort chapters by displayOrder, fallback to creation time or title
      const sortedChapters = data.sort((a, b) => {
        const orderA = a.sequence ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.sequence ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return orderA - orderB;
        return 0; // Keep original order or sort by other fields if needed
      });
      
      // Sort lessons within chapters
      sortedChapters.forEach(chapter => {
        if (chapter.lessons) {
          chapter.lessons.sort((a, b) => {
             const orderA = a.sequence ?? Number.MAX_SAFE_INTEGER;
             const orderB = b.sequence ?? Number.MAX_SAFE_INTEGER;
             return orderA - orderB;
          });
        }
      });
      setChapters(sortedChapters);
    } catch (error) {
      console.error('Failed to load chapters:', error);
      toast({
        variant: "destructive",
        title: "错误",
        description: "加载章节失败"
      });
    } finally {
      setLoading(false);
    }
  };

  // Chapter Handlers
  const handleAddChapter = () => {
    setEditingChapter({
      courseUuid,
      title: '',
      description: '',
      sequence: chapters.length + 1,
    });
    setIsChapterDialogOpen(true);
  };

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter({ ...chapter });
    setIsChapterDialogOpen(true);
  };

  const handleDeleteChapter = async (uuid: string) => {
    if (!confirm('确定要删除这个章节吗？这将同时删除章节下的所有课时。')) return;
    try {
      await adminCourseApi.deleteChapter(uuid);
      toast({ title: "成功", description: "章节已删除" });
      loadChapters();
    } catch (error) {
      toast({ variant: "destructive", title: "错误", description: "删除章节失败" });
    }
  };

  const handleSaveChapter = async () => {
    if (!editingChapter?.title) {
      toast({ variant: "destructive", title: "错误", description: "请输入章节标题" });
      return;
    }

    try {
      if (editingChapter.uuid) {
        await adminCourseApi.updateChapter(editingChapter);
      } else {
        await adminCourseApi.createChapter(editingChapter);
      }
      setIsChapterDialogOpen(false);
      loadChapters();
      toast({ title: "成功", description: "章节已保存" });
    } catch (error) {
      toast({ variant: "destructive", title: "错误", description: "保存章节失败" });
    }
  };

  // Lesson Handlers
  const handleAddLesson = (chapterUuid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const chapter = chapters.find(c => c.uuid === chapterUuid);
    const lessonCount = chapter?.lessons?.length || 0;
    
    setEditingLesson({
      courseUuid,
      chapterUuid,
      title: '',
      description: '',
      jsonContent: '',
      sequence: lessonCount + 1,
      lessonType: 'VIDEO', // Default type
    });
    setIsLessonDialogOpen(true);
  };

  const handleEditLesson = (lesson: Lesson, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLesson({ ...lesson });
    setIsLessonDialogOpen(true);
  };

  const handleDeleteLesson = async (uuid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个课时吗？')) return;
    try {
      await adminCourseApi.deleteLesson(uuid);
      toast({ title: "成功", description: "课时已删除" });
      loadChapters();
    } catch (error) {
      toast({ variant: "destructive", title: "错误", description: "删除课时失败" });
    }
  };

  const handleSaveLesson = async () => {
    if (!editingLesson?.title) {
      toast({ variant: "destructive", title: "错误", description: "请输入课时标题" });
      return;
    }

    try {
      if (editingLesson.uuid) {
        await adminCourseApi.updateLesson(editingLesson);
      } else {
        await adminCourseApi.createLesson(editingLesson);
      }
      setIsLessonDialogOpen(false);
      loadChapters();
      toast({ title: "成功", description: "课时已保存" });
    } catch (error) {
      toast({ variant: "destructive", title: "错误", description: "保存课时失败" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">课程大纲</h3>
        <Button onClick={handleAddChapter} size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> 添加章节
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">加载中...</div>
      ) : chapters.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg text-slate-500">
          暂无章节，请添加第一个章节
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {chapters.map((chapter, index) => (
            <AccordionItem key={chapter.uuid} value={chapter.uuid!} className="border rounded-lg px-4 bg-white">
              <div className="flex items-center py-2">
                <AccordionTrigger className="flex-1 hover:no-underline py-2">
                  <div className="flex items-center gap-2 text-left">
                    <span className="font-medium text-slate-800">
                      第 {index + 1} 章：{chapter.title}
                    </span>
                    <span className="text-xs text-slate-500 font-normal">
                      ({chapter.lessons?.length || 0} 课时)
                    </span>
                  </div>
                </AccordionTrigger>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleAddLesson(chapter.uuid!, e); }}
                    title="添加课时"
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleEditChapter(chapter); }}
                    title="编辑章节"
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="w-4 h-4 text-slate-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleDeleteChapter(chapter.uuid!); }}
                    title="删除章节"
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <AccordionContent className="pb-4 pt-0">
                <div className="pl-4 space-y-2 mt-2 border-l-2 border-slate-100 ml-2">
                  {chapter.lessons && chapter.lessons.length > 0 ? (
                    chapter.lessons.map((lesson, lessonIndex) => (
                      <div key={lesson.uuid} className="flex items-center justify-between p-2 rounded hover:bg-slate-50 group border border-transparent hover:border-slate-200 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500">
                            {lessonIndex + 1}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">{lesson.title}</span>
                            {lesson.description && (
                              <span className="text-xs text-slate-500 line-clamp-1">{lesson.description}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleEditLesson(lesson, e)}
                            className="h-7 w-7 p-0"
                          >
                            <Pencil className="w-3.5 h-3.5 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteLesson(lesson.uuid!, e)}
                            className="h-7 w-7 p-0"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-400 italic py-2">暂无课时</div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Chapter Dialog */}
      <Dialog open={isChapterDialogOpen} onOpenChange={setIsChapterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingChapter?.uuid ? '编辑章节' : '添加章节'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>章节标题</Label>
              <Input
                value={editingChapter?.title || ''}
                onChange={(e) => setEditingChapter(prev => ({ ...prev!, title: e.target.value }))}
                placeholder="输入章节标题"
              />
            </div>
            <div className="space-y-2">
              <Label>章节描述</Label>
              <Textarea
                value={editingChapter?.description || ''}
                onChange={(e) => setEditingChapter(prev => ({ ...prev!, description: e.target.value }))}
                placeholder="输入章节描述（可选）"
              />
            </div>
            <div className="space-y-2">
              <Label>显示顺序</Label>
              <Input
                type="number"
                value={editingChapter?.sequence || 1}
                onChange={(e) => setEditingChapter(prev => ({ ...prev!, sequence: parseInt(e.target.value) }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChapterDialogOpen(false)}>取消</Button>
            <Button onClick={handleSaveChapter}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLesson?.uuid ? '编辑课时' : '添加课时'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>课时标题 *</Label>
              <Input
                value={editingLesson?.title || ''}
                onChange={(e) => setEditingLesson(prev => ({ ...prev!, title: e.target.value }))}
                placeholder="输入课时标题"
              />
            </div>
            <div className="space-y-2">
              <Label>课时描述</Label>
              <Textarea
                value={editingLesson?.description || ''}
                onChange={(e) => setEditingLesson(prev => ({ ...prev!, description: e.target.value }))}
                placeholder="输入课时描述（可选）"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>教学内容</Label>
              <Textarea
                value={editingLesson?.jsonContent || ''}
                onChange={(e) => setEditingLesson(prev => ({ ...prev!, jsonContent: e.target.value }))}
                placeholder="输入教学内容（支持 Markdown）"
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>显示顺序</Label>
              <Input
                type="number"
                value={editingLesson?.sequence || 1}
                onChange={(e) => setEditingLesson(prev => ({ ...prev!, sequence: parseInt(e.target.value) }))}
              />
              <p className="text-xs text-slate-500">数字越小越靠前，默认自动生成</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLessonDialogOpen(false)}>取消</Button>
            <Button onClick={handleSaveLesson}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CurriculumEditor;
