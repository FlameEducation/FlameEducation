import React, { useEffect, useState, useRef } from 'react';
import { 
  getAdminTeachers, 
  createTeacher, 
  updateTeacher, 
  deleteTeacher, 
  TeacherInfo, 
  getTeacherInfo 
} from '@/api/teacher';
import { updateVoiceConfig, VoiceConfig } from '@/api/voice-config';
import { previewVoice } from '@/api/voice-preview';
import { listTtsProviders, TtsProviderConfig } from '@/api/tts-config';
import { Button } from '@/components/ui/button';
import { AudioPlayer } from '@/components/ui/audio-player';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Save, Volume2, Play, Plus, Pencil, Trash2, Upload, User, Search } from 'lucide-react';
import { toast } from 'sonner';

const ModelConfigTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherInfo | null>(null);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const res = await getAdminTeachers({ page, pageSize: 100 }); // Load all for now or implement pagination
      setTeachers(res.list);
      setTotal(res.total);
    } catch (error) {
      console.error('加载教师列表失败:', error);
      toast.error('加载教师列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, [page]);

  const handleCreate = () => {
    setEditingTeacher(null);
    setIsDialogOpen(true);
  };

  const handleEdit = async (teacher: TeacherInfo) => {
    try {
      // Fetch full details including voice config
      const fullInfo = await getTeacherInfo(teacher.uuid);
      setEditingTeacher(fullInfo);
      setIsDialogOpen(true);
    } catch (error) {
      toast.error('获取详情失败');
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm('确定要删除这个模型吗？此操作不可恢复。')) return;
    try {
      await deleteTeacher(uuid);
      toast.success('删除成功');
      loadTeachers();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setIsDialogOpen(false);
      setEditingTeacher(null);
    }
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    loadTeachers();
  };

  const filteredTeachers = teachers.filter(t => 
    t.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">模型管理</h2>
          <p className="text-sm text-muted-foreground">管理AI助教模型、头像及语音配置</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="搜索模型..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            新建模型
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[200px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTeachers.map((teacher) => (
            <TeacherCard 
              key={teacher.uuid} 
              teacher={teacher} 
              onEdit={() => handleEdit(teacher)}
              onDelete={() => handleDelete(teacher.uuid)}
            />
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTeacher ? '编辑模型' : '新建模型'}</DialogTitle>
            <DialogDescription>
              {editingTeacher ? '修改模型的基本信息和语音配置' : '创建一个新的AI助教模型'}
            </DialogDescription>
          </DialogHeader>
          
          <TeacherEditor 
            teacher={editingTeacher} 
            onSuccess={handleSuccess} 
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- Sub Components ---

const TeacherCard: React.FC<{
  teacher: TeacherInfo;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ teacher, onEdit, onDelete }) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow group">
      <CardHeader className="flex flex-row items-start gap-4 p-4 pb-2">
        <Avatar className="h-12 w-12 border">
          <AvatarImage src={teacher.avatarUrl} alt={teacher.teacherName} className="object-cover" />
          <AvatarFallback>{teacher.teacherName.substring(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base truncate font-semibold">{teacher.teacherName}</CardTitle>
            <Badge variant={teacher.status === 1 ? 'default' : 'secondary'} className="text-[10px] h-5">
              {teacher.status === 1 ? '启用' : '禁用'}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1 truncate">
            {teacher.personality || '未设置性格'}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 pb-3 space-y-2">
        <div className="text-xs bg-slate-50 p-2 rounded border">
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">语音服务:</span>
            <span className="font-medium">{teacher.voiceProvider || '未配置'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">模型:</span>
            <span className="font-medium truncate max-w-[120px]" title={teacher.voiceModel}>{teacher.voiceModel || '-'}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 h-8">
          {teacher.description || '暂无描述'}
        </p>
      </CardContent>
      <CardFooter className="p-3 bg-slate-50/50 flex justify-end gap-2 border-t">
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onEdit}>
          <Pencil className="h-3 w-3 mr-1" /> 编辑
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={onDelete}>
          <Trash2 className="h-3 w-3 mr-1" /> 删除
        </Button>
      </CardFooter>
    </Card>
  );
};

const TeacherEditor: React.FC<{
  teacher: TeacherInfo | null;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ teacher, onSuccess, onCancel }) => {
  const [activeTab, setActiveTab] = useState('basic');
  
  // If creating, only show basic tab initially
  // If editing, show both
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="basic">基本信息</TabsTrigger>
        <TabsTrigger value="voice" disabled={!teacher}>语音配置</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic" className="mt-4">
        <BasicInfoForm teacher={teacher} onSuccess={onSuccess} onCancel={onCancel} />
      </TabsContent>
      
      <TabsContent value="voice" className="mt-4">
        {teacher && <VoiceConfigForm teacher={teacher} onSuccess={onSuccess} />}
      </TabsContent>
    </Tabs>
  );
};

const BasicInfoForm: React.FC<{
  teacher: TeacherInfo | null;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ teacher, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    teacherName: teacher?.teacherName || '',
    description: teacher?.description || '',
    personality: teacher?.personality || '',
    status: teacher?.status ?? 1,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(teacher?.avatarUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teacherName) {
      toast.error('请输入模型名称');
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      data.append('teacherName', formData.teacherName);
      data.append('description', formData.description);
      data.append('personality', formData.personality);
      data.append('status', formData.status.toString());
      if (avatarFile) {
        data.append('avatar', avatarFile);
      }


      if (teacher) {
        await updateTeacher(teacher.uuid, data);
        toast.success('更新成功');
      } else {
        await createTeacher(data);
        toast.success('创建成功');
      }
      onSuccess();
    } catch (error) {
      console.error('提交失败:', error);
      toast.error('提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col items-center gap-4 mb-6">
        <Avatar className="h-24 w-24 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => fileInputRef.current?.click()}>
          <AvatarImage src={avatarPreview} className="object-cover" />
          <AvatarFallback><Upload className="h-8 w-8 text-muted-foreground" /></AvatarFallback>
        </Avatar>
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          更换头像
        </Button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />
      </div>

      <div className="grid gap-2">
        <Label>模型名称</Label>
        <Input 
          value={formData.teacherName} 
          onChange={e => setFormData({...formData, teacherName: e.target.value})} 
          placeholder="给模型起个名字"
        />
      </div>

      <div className="grid gap-2">
        <Label>描述</Label>
        <Textarea 
          value={formData.description} 
          onChange={e => setFormData({...formData, description: e.target.value})} 
          placeholder="简短的描述..."
        />
      </div>

      <div className="grid gap-2">
        <Label>人设 (Prompt)</Label>
        <Textarea 
          value={formData.personality} 
          onChange={e => setFormData({...formData, personality: e.target.value})} 
          placeholder="定义模型的性格、语气和行为模式..."
          className="min-h-[100px]"
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
        <div className="space-y-0.5">
          <Label>启用状态</Label>
          <div className="text-sm text-muted-foreground">
            是否在聊天界面显示此模型
          </div>
        </div>
        <Switch 
          checked={formData.status === 1} 
          onCheckedChange={checked => setFormData({...formData, status: checked ? 1 : 0})} 
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>取消</Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          保存
        </Button>
      </div>
    </form>
  );
};

const VoiceConfigForm: React.FC<{ teacher: TeacherInfo; onSuccess: () => void }> = ({ teacher, onSuccess }) => {
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewText, setPreviewText] = useState('你好，我是你的AI助教，很高兴为你服务。');
  const [providers, setProviders] = useState<TtsProviderConfig[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [config, setConfig] = useState<VoiceConfig>({
    uuid: teacher.uuid,
    voiceProvider: teacher.voiceProvider || 'doubao',
    voiceModel: teacher.voiceModel,
    emotionConfig: teacher.emotionConfig,
    speedRatio: teacher.speedRatio || 1.0,
  });

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const list = await listTtsProviders();
        setProviders(list.filter(p => p.enabled));
      } catch (error) {
        console.error('加载TTS服务商失败', error);
      }
    };
    loadProviders();
  }, []);

  // If teacher has no voice config uuid, we might need to handle that.
  // But for now assuming we edit the existing one or the one linked.

  const handleSave = async () => {
    if (!config.uuid) {
      toast.error('无法保存：缺少语音配置ID');
      return;
    }
    try {
      setSaving(true);
      await updateVoiceConfig(config.uuid, config);
      toast.success('语音配置已保存');
      onSuccess();
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!previewText.trim()) {
      toast.error('请输入试听文本');
      return;
    }
    try {
      setPreviewing(true);
      setAudioUrl(null); // Reset previous audio
      const base64 = await previewVoice({
        text: previewText,
        voiceProvider: config.voiceProvider || 'doubao',
        voiceModel: config.voiceModel || '',
        voiceEmotion: config.emotionConfig || '',
        speedRatio: config.speedRatio || 1.0
      });
      
      const url = `data:audio/mp3;base64,${base64}`;
      setAudioUrl(url);
    } catch (error) {
      console.error('试听失败:', error);
      toast.error('试听失败');
    } finally {
      setPreviewing(false);
    }
  };

  const renderDoubaoConfig = () => (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label>语音角色 (Voice Type)</Label>
        <Input 
          value={config.voiceModel || ''} 
          onChange={(e) => setConfig(prev => ({ ...prev, voiceModel: e.target.value }))}
          placeholder="例如: BV700_streaming"
        />
        <p className="text-xs text-slate-500">请输入豆包 TTS 的语音类型代码</p>
      </div>
      <div className="grid gap-2">
        <Label>情感 (Emotion)</Label>
        <Input 
          value={config.emotionConfig || ''} 
          onChange={(e) => setConfig(prev => ({ ...prev, emotionConfig: e.target.value }))}
          placeholder="例如: happy"
        />
      </div>
    </div>
  );

  const renderAzureConfig = () => (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label>语音名称 (Voice Name)</Label>
        <Input 
          value={config.voiceModel || ''} 
          onChange={(e) => setConfig(prev => ({ ...prev, voiceModel: e.target.value }))}
          placeholder="例如: zh-CN-XiaoxiaoNeural"
        />
        <p className="text-xs text-slate-500">请输入 Azure TTS 的完整语音名称</p>
      </div>
      <div className="grid gap-2">
        <Label>风格 (Style)</Label>
        <Input 
          value={config.emotionConfig || ''} 
          onChange={(e) => setConfig(prev => ({ ...prev, emotionConfig: e.target.value }))}
          placeholder="例如: general"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 py-2">
      <div className="grid gap-2">
        <Label>服务商</Label>
        <Select value={config.voiceProvider} onValueChange={(val) => setConfig(prev => ({ ...prev, voiceProvider: val }))}>
          <SelectTrigger>
            <SelectValue placeholder="选择服务商" />
          </SelectTrigger>
          <SelectContent>
            {providers.map(p => (
              <SelectItem key={p.providerName} value={p.providerName}>
                {p.providerName === 'doubao' ? '豆包 (Doubao)' : 
                 p.providerName === 'azure' ? '微软 (Azure)' : 
                 p.providerName}
              </SelectItem>
            ))}
            {providers.length === 0 && (
               <SelectItem value="disabled" disabled>暂无可用服务商，请先去配置</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {config.voiceProvider === 'doubao' ? renderDoubaoConfig() : renderAzureConfig()}

      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <Label>语速 (Speed Ratio): {config.speedRatio}</Label>
        </div>
        <Slider 
          value={[config.speedRatio || 1.0]} 
          min={0.5} 
          max={2.0} 
          step={0.1}
          onValueChange={(val) => setConfig(prev => ({ ...prev, speedRatio: val[0] }))}
        />
      </div>

      <div className="grid gap-3 pt-4 border-t">
        <Label>语音试听</Label>
        <div className="space-y-3">
          <Textarea 
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            placeholder="输入要试听的文本..."
            className="min-h-[80px] resize-none"
          />
          <div className="flex justify-between items-center">
            <div className="flex-1 mr-4">
                {audioUrl && <AudioPlayer src={audioUrl} autoPlay />}
            </div>
            <Button variant="secondary" size="sm" onClick={handlePreview} disabled={previewing}>
              {previewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              生成试听
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          保存语音配置
        </Button>
      </div>
    </div>
  );
};

export default ModelConfigTab;


