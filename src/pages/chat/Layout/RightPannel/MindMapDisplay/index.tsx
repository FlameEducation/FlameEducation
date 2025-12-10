import {useChatHistoryContext} from "@/pages/chat/context/ChatHistoryContext.tsx";
import {useEffect, useState} from "react";
import MindMap from "@/components/mindmap/MindMap";
import api from "@/api";
import {Button} from "@/components/ui/button";
import {RefreshCw} from "lucide-react";
import {useMindMapContext} from "@/pages/chat/context/MindMapContext.tsx";

interface MindMapContent {
  uuid: string;
  title?: string;
  content: string;
  over: boolean;
  error: boolean;
}

interface MindMapDisplayComponentProps {
  uuid?: string;
}

export const MindMapDisplayComponent = ({ uuid }: MindMapDisplayComponentProps = {}) => {

  const { activeMindMapUuid, setActiveMindMapUuid } = useChatHistoryContext();
  const { getMindMapState, loadMindMap } = useMindMapContext();
  
  // 如果传入了uuid，说明是在聊天卡片中显示，否则是在右侧面板显示
  const targetUuid = uuid || activeMindMapUuid;
  const isRightPanelMode = !uuid;

  const mindMapState = targetUuid ? getMindMapState(targetUuid) : undefined;
  const content = mindMapState ? {
    uuid: mindMapState.uuid,
    title: mindMapState.title,
    content: mindMapState.content || '',
    over: mindMapState.over,
    error: mindMapState.error
  } : null;
  
  const isLoading = !mindMapState || mindMapState.isLoading;
  const [isPreview, setIsPreview] = useState(true); // 默认预览模式

  // 切换思维导图时重置为预览模式
  useEffect(() => {
    setIsPreview(true);
  }, [targetUuid]);

  // 获取内容
  useEffect(() => {
    if (targetUuid) {
      loadMindMap(targetUuid);
    }
  }, [targetUuid, loadMindMap]);


  const handleClose = () => {
    setActiveMindMapUuid(null);
  };

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">

      <div className="h-12 w-full flex items-center justify-between px-4 border-b border-gray-200 bg-white">
        <div className="font-medium text-gray-700 flex items-center gap-2">
          <span>思维导图</span>
          {content?.title && (
            <span className="text-sm text-gray-500 font-normal border-l pl-2 border-gray-300">
              {content.title}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsPreview(!isPreview)}
            className={isPreview ? "bg-gray-100" : ""}
          >
            {isPreview ? "预览模式" : "编辑模式"}
          </Button>

          {isRightPanelMode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="hover:bg-gray-100 rounded-full h-8 w-8"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {content ? (
          <div className="w-full h-full">
             <MindMap 
               markdown={content.content || ''} 
               isPreview={isPreview}
               xSpacing={300}
               theme="vibrant"

             />
             {(!content.over && !content.error) && (
               <div className="absolute top-4 right-4 bg-white/80 px-3 py-1 rounded-full text-sm text-blue-600 animate-pulse">
                 生成中...
               </div>
             )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            {isLoading ? '加载中...' : '暂无内容'}
          </div>
        )}
      </div>
    </div>
  );
};

export default MindMapDisplayComponent;
