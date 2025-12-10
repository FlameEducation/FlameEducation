import {DynamicComponentRenderer} from "@/components/sendbox";
import {useClassStatusContext} from "@/pages/chat/context/ClassStatusContext.tsx";
import React from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useBlackboardZoom } from "@/contexts/GlobalSettingsContext";

interface KnowledgeComponentProps {
  uuid?: string;
}

export const KnowledgeComponent = ({ uuid }: KnowledgeComponentProps) => {

  const {
    lessonUuid
  } = useClassStatusContext()

  const [zoomLevel, setZoomLevel] = useBlackboardZoom();

  const handleZoomIn = () => setZoomLevel(Math.min(zoomLevel + 0.1, 2));
  const handleZoomOut = () => setZoomLevel(Math.max(zoomLevel - 0.1, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  if (!uuid) {
      return (
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-white">
            请选择一个黑板内容
          </div>
      )
  }

  return (
    <div className="h-full w-full flex flex-col bg-gray-50 relative group">
          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 z-10 hidden md:flex items-center gap-1 bg-white/90 backdrop-blur shadow-sm rounded-full p-1 border border-gray-200 transition-opacity opacity-0 group-hover:opacity-100">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-gray-100" onClick={handleZoomOut} title="缩小">
              <ZoomOut className="h-3.5 w-3.5 text-gray-600" />
            </Button>
            <span className="text-[10px] font-medium text-gray-500 w-8 text-center select-none">{Math.round(zoomLevel * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-gray-100" onClick={handleZoomIn} title="放大">
              <ZoomIn className="h-3.5 w-3.5 text-gray-600" />
            </Button>
            <div className="w-px h-3 bg-gray-200 mx-0.5" />
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-gray-100" onClick={handleResetZoom} title="重置">
              <RotateCcw className="h-3 w-3 text-gray-400" />
            </Button>
          </div>

          <div className="w-full flex-1 p-6 bg-white overflow-hidden">
            <div 
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top left',
                width: `${100 / zoomLevel}%`,
                height: `${100 / zoomLevel}%`,
                transition: 'transform 0.2s ease-out, width 0.2s ease-out, height 0.2s ease-out'
              }} 
              className="h-full [&::-webkit-scrollbar]:hidden"
            >
              {uuid && lessonUuid && (
                <DynamicComponentRenderer
                  key={uuid}
                  sessionId={lessonUuid}
                  blackboardUuid={uuid}
                  containerClassName="h-full"
                  className="!h-full [&::-webkit-scrollbar]:hidden"
                  showRegenerateButton={true}
                  isRegenerating={false}
                  onRegenerateStateChange={() => {
                  }}
                />
              )}
            </div>
          </div>
    </div>
  )
}

export default KnowledgeComponent