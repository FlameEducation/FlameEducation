import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, BookOpen, Presentation, Network, Image as ImageIcon, RefreshCw, CheckCircle2, Circle } from "lucide-react";
import { useExerciseContext } from "@/pages/chat/context/ExerciseContext";
import { useChatHistoryContext } from "@/pages/chat/context/ChatHistoryContext";
import { useEventBus } from "@/pages/chat/context/EventBusContext";
import KnowledgeComponent from "@/pages/chat/Layout/RightPannel/KnowledgeCard";
import ExerciseDisplayComponent from "@/pages/chat/Layout/RightPannel/ExerciseDisplay";
import MindMapDisplayComponent from "@/pages/chat/Layout/RightPannel/MindMapDisplay";
import ImageDisplayComponent from "@/pages/chat/Layout/RightPannel/ImageDisplay";
import api from "@/api";
import { useMindMapContext } from "@/pages/chat/context/MindMapContext.tsx";
import { useBlackboardContext } from "@/pages/chat/context/BlackboardContext.tsx";
import { useImageContext } from "@/pages/chat/context/ImageContext.tsx";
import { cn } from "@/lib/utils";

type ContentType = 'exercise' | 'blackboard' | 'mindmap' | 'image';

export const RightPanelComponent = () => {
  const { 
    showExerciseInRightPanel, 
    rightPanelExerciseId, 
    setRightPanelExerciseId,
    exerciseDataMap,
    loadExerciseData,
    loadingExercises
  } = useExerciseContext();
  
  const { 
    activeMindMapUuid, 
    setActiveMindMapUuid,
    activeBlackboardUuid,
    setActiveBlackboardUuid,
    activeImageUuid,
    setActiveImageUuid,
    getAllBlackboards,
    getAllMindMaps,
    getAllImages,
    setIsRightPanelOpen
  } = useChatHistoryContext();

  const { loadMindMap, getMindMapState } = useMindMapContext();
  const { loadBlackboard, getBlackboardState, regenerateBlackboard, blackboardMap } = useBlackboardContext();
  const { loadImage, getImageState, retryImage, imageMap } = useImageContext();

  const eventBus = useEventBus();

  const [activeType, setActiveType] = useState<ContentType>('blackboard');
  const [activeUuid, setActiveUuid] = useState<string | null>(null);

  // Check if current item is generating
  const isCurrentItemGenerating = useMemo(() => {
    if (!activeUuid) return false;
    if (activeType === 'blackboard') {
      const state = blackboardMap.get(activeUuid);
      return state?.isLoading || false;
    }
    if (activeType === 'image') {
      const state = imageMap.get(activeUuid);
      return state?.isLoading || false;
    }
    return false;
  }, [activeType, activeUuid, blackboardMap, imageMap]);

  // Data Aggregation
  const exercises = useMemo(() => {
    return Array.from(exerciseDataMap.values()).map((ex, index) => {
      // @ts-ignore - 兼容不同数据结构
      const id = ex.uuid || ex.exerciseUuid;
      // @ts-ignore - 兼容不同数据结构
      const title = ex.title || ex.questionData?.title || '练习题';
      // @ts-ignore - 直接从对象获取状态，避免Context中ref的延迟问题
      const completed = ex.status?.isCompleted ?? ex.isCompleted ?? ex.submitted ?? false;
      return {
        uuid: id,
        name: `${index + 1}. ${title}`,
        completed
      };
    });
  }, [exerciseDataMap]);

  // 自动加载缺失标题的练习题数据
  useEffect(() => {
    Array.from(exerciseDataMap.values()).forEach(ex => {
      // @ts-ignore
      const id = ex.uuid || ex.exerciseUuid;
      // @ts-ignore
      const hasTitle = ex.title || ex.questionData?.title;
      
      if (id && !hasTitle && !loadingExercises.has(id)) {
         loadExerciseData(id);
      }
    });
  }, [exerciseDataMap, loadExerciseData, loadingExercises]);

  // Load Blackboards
  const blackboardList = getAllBlackboards();
  const blackboardListString = JSON.stringify(blackboardList);
  useEffect(() => {
    const list = JSON.parse(blackboardListString) as {uuid: string}[];
    list.forEach(item => {
      loadBlackboard(item.uuid);
    });
  }, [blackboardListString, loadBlackboard]);

  const blackboards = useMemo(() => {
    return getAllBlackboards().map((item, index) => {
      const state = getBlackboardState(item.uuid);
      return {
        uuid: item.uuid,
        name: `${index + 1}. ${state?.title || item.title}`
      };
    });
  }, [getAllBlackboards(), getBlackboardState]);

  const mindmaps = useMemo(() => {
    return getAllMindMaps().map((uuid, index) => {
      const state = getMindMapState(uuid);
      return {
        uuid,
        name: `${index + 1}. ${state?.title || '思维导图'}`
      };
    });
  }, [getAllMindMaps(), getMindMapState]);

  // Load Images
  const imageList = getAllImages();
  const imageListString = JSON.stringify(imageList);
  useEffect(() => {
    const list = JSON.parse(imageListString) as {uuid: string}[];
    list.forEach(item => {
      loadImage(item.uuid);
    });
  }, [imageListString, loadImage]);

  const images = useMemo(() => {
    return getAllImages().map((img, index) => {
      const state = getImageState(img.uuid);
      return {
        uuid: img.uuid,
        name: `${index + 1}. ${state?.title || img.title}`
      };
    });
  }, [getAllImages(), getImageState]);

  // Sync External State -> Internal State
  useEffect(() => {
    if (showExerciseInRightPanel && rightPanelExerciseId) {
      setActiveType('exercise');
      setActiveUuid(rightPanelExerciseId);
    }
  }, [showExerciseInRightPanel, rightPanelExerciseId]);

  useEffect(() => {
    if (activeMindMapUuid) {
      setActiveType('mindmap');
      setActiveUuid(activeMindMapUuid);
    }
  }, [activeMindMapUuid]);

  useEffect(() => {
    if (activeBlackboardUuid) {
      setActiveType('blackboard');
      setActiveUuid(activeBlackboardUuid);
    }
  }, [activeBlackboardUuid]);

  useEffect(() => {
    if (activeImageUuid) {
      setActiveType('image');
      setActiveUuid(activeImageUuid);
    }
  }, [activeImageUuid]);

  // Listen to Event Bus for explicit show actions
  useEffect(() => {
    const handleShowExercise = (data: { uuid: string }) => {
      setActiveType('exercise');
      setActiveUuid(data.uuid);
    };
    const handleShowBlackboard = (data: { uuid: string }) => {
      setActiveType('blackboard');
      setActiveUuid(data.uuid);
    };
    const handleShowMindMap = (data: { uuid: string }) => {
      setActiveType('mindmap');
      setActiveUuid(data.uuid);
    };
    const handleShowImage = (data: { uuid: string }) => {
      setActiveType('image');
      setActiveUuid(data.uuid);
    };

    eventBus.on('showExercise', handleShowExercise);
    eventBus.on('showBlackboard', handleShowBlackboard);
    eventBus.on('showMindMap', handleShowMindMap);
    eventBus.on('showImage', handleShowImage);

    return () => {
      eventBus.off('showExercise', handleShowExercise);
      eventBus.off('showBlackboard', handleShowBlackboard);
      eventBus.off('showMindMap', handleShowMindMap);
      eventBus.off('showImage', handleShowImage);
    };
  }, [eventBus]);
    
  // Handle Close
  const handleClose = () => {
    setRightPanelExerciseId(null);
    setActiveMindMapUuid(null);
    setActiveBlackboardUuid(null);
    setActiveImageUuid(null);
    setIsRightPanelOpen(false);
  };

  // Handle Type Change
  const handleTypeChange = (type: string) => {
    const newType = type as ContentType;
    setActiveType(newType);
    
    let list: { uuid: string }[] = [];
    switch (newType) {
      case 'exercise': list = exercises; break;
      case 'blackboard': list = blackboards; break;
      case 'mindmap': list = mindmaps; break;
      case 'image': list = images; break;
    }
    
    if (list.length > 0) {
      const newUuid = list[list.length - 1].uuid;
      setActiveUuid(newUuid);
      if (newType === 'exercise') setRightPanelExerciseId(newUuid);
      if (newType === 'mindmap') setActiveMindMapUuid(newUuid);
      if (newType === 'blackboard') setActiveBlackboardUuid(newUuid);
      if (newType === 'image') setActiveImageUuid(newUuid);
    } else {
      setActiveUuid(null);
      if (newType === 'exercise') setRightPanelExerciseId(null);
      if (newType === 'mindmap') setActiveMindMapUuid(null);
      if (newType === 'blackboard') setActiveBlackboardUuid(null);
      if (newType === 'image') setActiveImageUuid(null);
    }
  };

  // Handle Item Change
  const handleItemChange = (uuid: string) => {
    setActiveUuid(uuid);
    if (activeType === 'exercise') {
      setRightPanelExerciseId(uuid);
    } else if (activeType === 'mindmap') {
      setActiveMindMapUuid(uuid);
    } else if (activeType === 'blackboard') {
      setActiveBlackboardUuid(uuid);
    } else if (activeType === 'image') {
      setActiveImageUuid(uuid);
    }
  };

  // Handle Regenerate
  const handleRegenerate = async () => {
    if (!activeUuid || isCurrentItemGenerating) return;
    
    try {
      if (activeType === 'blackboard') {
        await regenerateBlackboard(activeUuid);
      } else if (activeType === 'image') {
        await retryImage(activeUuid);
      }
    } catch (error) {
      console.error('Regenerate failed:', error);
    }
  };

  // Get current list for Select
  const currentList = useMemo(() => {
    switch (activeType) {
      case 'exercise': return exercises;
      case 'blackboard': return blackboards;
      case 'mindmap': return mindmaps;
      case 'image': return images;
      default: return [];
    }
  }, [activeType, exercises, blackboards, mindmaps, images]);

  return (
    <div className="flex flex-col w-full h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center space-x-2">
          <Tabs value={activeType} onValueChange={handleTypeChange} className="w-auto">
            <TabsList className="h-8 p-0 bg-transparent gap-1">
              {exercises.length > 0 && (
                <TabsTrigger 
                  value="exercise" 
                  className="group relative flex items-center overflow-hidden transition-all duration-300 ease-in-out hover:w-auto px-2 h-8 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 rounded-md"
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span className="ml-2 max-w-0 opacity-0 transition-all duration-300 group-hover:max-w-[100px] group-hover:opacity-100 whitespace-nowrap overflow-hidden">
                    练习题
                  </span>
                </TabsTrigger>
              )}
              {blackboards.length > 0 && (
                <TabsTrigger 
                  value="blackboard" 
                  className="group relative flex items-center overflow-hidden transition-all duration-300 ease-in-out hover:w-auto px-2 h-8 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 rounded-md"
                >
                  <Presentation className="w-4 h-4 shrink-0" />
                  <span className="ml-2 max-w-0 opacity-0 transition-all duration-300 group-hover:max-w-[100px] group-hover:opacity-100 whitespace-nowrap overflow-hidden">
                    黑板
                  </span>
                </TabsTrigger>
              )}
              {mindmaps.length > 0 && (
                <TabsTrigger 
                  value="mindmap" 
                  className="group relative flex items-center overflow-hidden transition-all duration-300 ease-in-out hover:w-auto px-2 h-8 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 rounded-md"
                >
                  <Network className="w-4 h-4 shrink-0" />
                  <span className="ml-2 max-w-0 opacity-0 transition-all duration-300 group-hover:max-w-[100px] group-hover:opacity-100 whitespace-nowrap overflow-hidden">
                    思维导图
                  </span>
                </TabsTrigger>
              )}
              {images.length > 0 && (
                <TabsTrigger 
                  value="image" 
                  className="group relative flex items-center overflow-hidden transition-all duration-300 ease-in-out hover:w-auto px-2 h-8 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 rounded-md"
                >
                  <ImageIcon className="w-4 h-4 shrink-0" />
                  <span className="ml-2 max-w-0 opacity-0 transition-all duration-300 group-hover:max-w-[100px] group-hover:opacity-100 whitespace-nowrap overflow-hidden">
                    图片
                  </span>
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
          
          <div className="h-4 w-px bg-gray-300 mx-2" />
          
          <div className="flex items-center gap-2">
            <Select value={activeUuid || ''} onValueChange={handleItemChange}>
              <SelectTrigger className="h-8 min-w-[160px] w-auto max-w-[400px] text-xs">
                <SelectValue placeholder="选择内容" />
              </SelectTrigger>
              <SelectContent>
                {currentList.map(item => (
                  <SelectItem key={item.uuid} value={item.uuid} className="text-xs">
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="truncate">{item.name}</span>
                      {activeType === 'exercise' && (
                        // @ts-ignore
                        item.completed ? (
                          <span className="flex items-center text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 shrink-0">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            已完成
                          </span>
                        ) : (
                          <span className="flex items-center text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 shrink-0">
                            <Circle className="w-3 h-3 mr-1" />
                            未完成
                          </span>
                        )
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(activeType === 'blackboard' || activeType === 'image') && activeUuid && !isCurrentItemGenerating && (
              <button
                onClick={handleRegenerate}
                className={cn(
                  "group flex items-center h-8 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-md border border-gray-200 transition-all duration-300 overflow-hidden",
                  "w-8 hover:w-24 px-0 hover:px-2"
                )}
                title="重新生成"
              >
                <div className="w-8 h-full flex items-center justify-center shrink-0">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <span className="whitespace-nowrap text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  重新生成
                </span>
              </button>
            )}
          </div>
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeType === 'exercise' && <ExerciseDisplayComponent />} 
        {activeType === 'blackboard' && <KnowledgeComponent uuid={activeUuid || undefined} />}
        {activeType === 'mindmap' && <MindMapDisplayComponent uuid={activeUuid || undefined} />}
        {activeType === 'image' && <ImageDisplayComponent uuid={activeUuid || undefined} />}
      </div>
    </div>
  );
};

export default RightPanelComponent;