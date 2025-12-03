import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, AudioLines, PlayCircle } from 'lucide-react';
import { AsrProviderConfig } from '@/api/asr-config';

interface AsrProviderCardProps {
  provider: AsrProviderConfig;
  isActive: boolean;
  onEdit: (provider: AsrProviderConfig) => void;
  onDelete: (providerName: string) => void;
  onSetActive: (providerName: string) => void;
  onTest: (provider: AsrProviderConfig) => void;
}

const PROVIDER_COLORS: Record<string, { bg: string; border: string; badge: string; iconBg: string; iconColor: string }> = {
  doubao: {
    bg: 'bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600'
  },
  google: {
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600'
  }
};

const DEFAULT_COLORS = {
  bg: 'bg-white hover:bg-slate-50',
  border: 'border-slate-200',
  badge: 'bg-slate-100 text-slate-700',
  iconBg: 'bg-slate-100',
  iconColor: 'text-slate-500'
};

const AsrProviderCard: React.FC<AsrProviderCardProps> = ({ provider, isActive, onEdit, onDelete, onSetActive, onTest }) => {
  const getProviderLabel = (name: string) => {
    switch (name) {
      case 'doubao':
        return '豆包语音识别';
      case 'google':
        return 'Google Gemini ASR';
      default:
        return name;
    }
  };

  const colors = PROVIDER_COLORS[provider.providerName] || DEFAULT_COLORS;

  return (
    <Card className={`relative overflow-hidden border transition-all duration-300 hover:shadow-md ${isActive ? 'ring-2 ring-blue-500 ring-offset-2' : ''} ${colors.border} ${colors.bg}`}>
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.iconBg} ${colors.iconColor}`}>
              <AudioLines className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">{getProviderLabel(provider.providerName)}</h3>
              <div className="mt-1 flex items-center gap-2">
                {isActive ? (
                  <span className="inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white shadow-sm">
                    当前生效
                  </span>
                ) : (
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors.badge}`}>
                    已配置
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-white/50" onClick={() => onTest(provider)} title="测试">
              <PlayCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-white/50" onClick={() => onEdit(provider)} title="编辑">
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-white/50" onClick={() => onDelete(provider.providerName)} title="删除">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="mt-4 space-y-1.5">
          {provider.providerName === 'doubao' && (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">App ID</span>
                <span className="font-mono text-slate-700">{provider.appId || '-'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Cluster ID</span>
                <span className="font-mono text-slate-700">{provider.clusterId || '-'}</span>
              </div>
            </>
          )}
          {provider.providerName === 'google' && (
             <div className="flex items-center justify-between text-xs">
               <span className="text-slate-500">API Key</span>
               <span className="font-mono text-slate-700">******</span>
             </div>
          )}
        </div>

        {!isActive && (
          <div className="mt-4 pt-4 border-t border-slate-200/50">
            <Button variant="outline" size="sm" className="w-full bg-white/50 hover:bg-white hover:text-blue-600 hover:border-blue-200" onClick={() => onSetActive(provider.providerName)}>
              设为生效
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AsrProviderCard;
