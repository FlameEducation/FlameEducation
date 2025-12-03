import React from 'react';
import { Edit2, Trash2, Check, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageProviderConfig } from '@/api/image-config';

interface ImageProviderCardProps {
  provider: ImageProviderConfig;
  isActive: boolean;
  onEdit: (provider: ImageProviderConfig) => void;
  onDelete: (providerName: string) => void;
  onSetActive: (providerName: string) => void;
  onTest: (provider: ImageProviderConfig) => void;
}

const ImageProviderCard: React.FC<ImageProviderCardProps> = ({
  provider,
  isActive,
  onEdit,
  onDelete,
  onSetActive,
  onTest
}) => {
  return (
    <div className={cn(
      "group relative flex flex-col justify-between rounded-xl border p-6 transition-all",
      isActive 
        ? "border-blue-500 bg-blue-50/50 shadow-sm" 
        : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            isActive ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600"
          )}>
            <span className="text-lg font-bold capitalize">
              {provider.providerName.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 capitalize">
              {provider.providerName}
            </h3>
            <p className="text-xs text-slate-500">
              {isActive ? '当前生效' : '未启用'}
            </p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onTest(provider)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
            title="测试连接"
          >
            <PlayCircle className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(provider)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
            title="编辑配置"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(provider.providerName)}
            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
            title="删除配置"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">模型</span>
            <span className="font-medium text-slate-900">{provider.model || '-'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">尺寸</span>
            <span className="font-medium text-slate-900">{provider.imageSize || '-'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">提示词优化</span>
            <span className={cn("font-medium", provider.enablePromptOptimization ? "text-green-600" : "text-slate-400")}>
              {provider.enablePromptOptimization ? '已开启' : '未开启'}
            </span>
          </div>
          {provider.baseUrl && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">代理</span>
              <span className="font-medium text-slate-900 truncate max-w-[150px]" title={provider.baseUrl}>
                {provider.baseUrl}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100">
        <button
          onClick={() => !isActive && onSetActive(provider.providerName)}
          disabled={isActive}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-blue-100 text-blue-700 cursor-default"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          {isActive ? (
            <>
              <Check className="h-4 w-4" />
              已启用
            </>
          ) : (
            '设为默认'
          )}
        </button>
      </div>
    </div>
  );
};

export default ImageProviderCard;
