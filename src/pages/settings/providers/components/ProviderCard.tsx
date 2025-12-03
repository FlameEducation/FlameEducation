import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AiProviderConfig } from '@/api/ai-provider';
import { Edit, Trash2, Zap, Box } from 'lucide-react';

interface ProviderListItemProps {
  provider: AiProviderConfig;
  onEdit: (provider: AiProviderConfig) => void;
  onDelete: (providerName: string) => void;
}

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  google: 'Google Gemini',
  doubao: '豆包'
};

const PROVIDER_COLORS: Record<string, { bg: string; border: string; badge: string }> = {
  google: {
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700'
  },
  doubao: {
    bg: 'bg-gradient-to-br from-purple-50 to-pink-100',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700'
  }
};

const ProviderListItem: React.FC<ProviderListItemProps> = ({
  provider,
  onEdit,
  onDelete,
}) => {
  const displayName = PROVIDER_DISPLAY_NAMES[provider.providerName] || provider.providerName;
  const colors = PROVIDER_COLORS[provider.providerName] || {
    bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
    border: 'border-slate-200',
    badge: 'bg-slate-100 text-slate-700'
  };

  return (
    <Card className={`relative overflow-hidden border ${colors.border} transition-all duration-300 hover:shadow-md hover:-translate-y-1 group`}>
      {/* 背景渐变 */}
      <div className={`absolute inset-0 ${colors.bg}`} />

      {/* 内容 */}
      <div className="relative p-4 space-y-3">
        {/* 头部 - 服务商信息 */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 truncate">
              {displayName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 rounded-md ${colors.badge} px-2 py-0.5 text-xs font-semibold`}>
                <Zap className="h-3 w-3" />
                已启用
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-white/50" onClick={() => onEdit(provider)} title="编辑">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-white/50" onClick={() => onDelete(provider.providerName)} title="删除">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 功能徽章 */}
        <div className="flex flex-wrap gap-1.5">
            <Badge 
              variant="secondary" 
              className="bg-white/70 text-slate-700 border border-white/90 font-medium text-xs px-2 py-0.5"
            >
              文本生成
            </Badge>
        </div>

        {/* 模型列表 - 仅在存在时显示 */}
        {provider.models && provider.models.length > 0 && (
          <div className="rounded-md bg-white/40 p-2 border border-white/60">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Box className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs font-medium text-slate-600">可用模型</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {provider.models.map(model => (
                <span 
                  key={model}
                  className="inline-flex items-center rounded-sm bg-white/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200/50"
                >
                  {model}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProviderListItem;

