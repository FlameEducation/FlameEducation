import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Mic } from 'lucide-react';
import { TtsProviderConfig } from '@/api/tts-config';

interface VoiceProviderCardProps {
  provider: TtsProviderConfig;
  onEdit: (provider: TtsProviderConfig) => void;
  onDelete: (providerName: string, e: React.MouseEvent) => void;
}

const PROVIDER_COLORS: Record<string, { bg: string; border: string; badge: string; iconBg: string; iconColor: string }> = {
  azure: {
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  doubao: {
    bg: 'bg-gradient-to-br from-purple-50 to-pink-100 hover:from-purple-100 hover:to-pink-200',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600'
  }
};

const DEFAULT_COLORS = {
  bg: 'bg-white hover:bg-slate-50',
  border: 'border-slate-200',
  badge: 'bg-slate-100 text-slate-700',
  iconBg: 'bg-slate-100',
  iconColor: 'text-slate-500'
};

const VoiceProviderCard: React.FC<VoiceProviderCardProps> = ({ provider, onEdit, onDelete }) => {
  const getProviderLabel = (name: string) => {
    switch (name) {
      case 'azure':
        return 'Azure TTS';
      case 'doubao':
        return '豆包语音合成';
      default:
        return name;
    }
  };

  const colors = PROVIDER_COLORS[provider.providerName] || DEFAULT_COLORS;

  return (
    <Card className={`relative overflow-hidden border transition-all duration-300 hover:shadow-md ${colors.border} ${colors.bg}`}>
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.iconBg} ${colors.iconColor}`}>
              <Mic className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">{getProviderLabel(provider.providerName)}</h3>
              <div className="mt-1 flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors.badge}`}>
                  已配置
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-white/50" onClick={() => onEdit(provider)} title="编辑">
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-white/50" onClick={(e) => onDelete(provider.providerName, e)} title="删除">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="mt-4 space-y-1.5">
          {provider.providerName === 'azure' && (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Region</span>
                <span className="font-mono text-slate-700">{provider.region || '-'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Subscription Key</span>
                <span className="font-mono text-slate-700">
                  {provider.subscriptionKey ? `${provider.subscriptionKey.substring(0, 8)}...` : '-'}
                </span>
              </div>
            </>
          )}
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
        </div>
      </div>
    </Card>
  );
};

export default VoiceProviderCard;
