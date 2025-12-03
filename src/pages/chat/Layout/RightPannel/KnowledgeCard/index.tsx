import {DynamicComponentRenderer} from "@/components/sendbox";
import {useChatHistoryContext} from "@/pages/chat/context/ChatHistoryContext.tsx";
import {useEffect, useState} from "react";
import {useClassStatusContext} from "@/pages/chat/context/ClassStatusContext.tsx";
import {useEventBus} from "@/pages/chat/context/EventBusContext.tsx";

export const KnowledgeComponent = () => {

  const {
    lessonUuid
  } = useClassStatusContext()

  const [currentBlackboardIndex, setCurrentBlackboardIndex] = useState<number>(0);
  const [currentBloackboardUuid, setCurrentBloackboardUuid] = useState<string | null>(null);

  const {
    getAllBlackboards,
  } = useChatHistoryContext();

  const eventBus = useEventBus();

  // 监听showBlackboard事件，跳转到指定黑板
  useEffect(() => {
    const handleEvent = (data: any) => {
      const blackboardUuids = getAllBlackboards();
      for (let i = 0; i < blackboardUuids.length; i++) {
        if (blackboardUuids[i] === data.uuid) {
          setCurrentBlackboardIndex(i);
          return;
        }
      }
      console.log('收到事件:', data);
    };
    
    eventBus.on('showBlackboard', handleEvent);

    return () => {
      eventBus.off('showBlackboard', handleEvent);
    };
  }, [getAllBlackboards()]);

  // 监听黑板列表变化，自动跳转到最新的黑板
  useEffect(() => {
    const blackboards = getAllBlackboards();
    if (blackboards.length > 0) {
      // 设置为最新的黑板（数组最后一个）
      const latestIndex = blackboards.length - 1;
      setCurrentBlackboardIndex(latestIndex);
    }
  }, [getAllBlackboards().length]); // 只在数量变化时触发

  // 更新当前显示的黑板UUID
  useEffect(() => {
    const blackboards = getAllBlackboards();
    if (blackboards.length > 0 && currentBlackboardIndex < blackboards.length) {
      setCurrentBloackboardUuid(blackboards[currentBlackboardIndex]);
    }
  }, [currentBlackboardIndex, getAllBlackboards()]);

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">

      <div className="h-12 w-full flex items-center justify-end px-4 border-b border-gray-200 bg-white">

          <span className="text-sm text-gray-600 min-w-[40px]">
            {getAllBlackboards().length > 0 ? `${currentBlackboardIndex + 1} / ${getAllBlackboards().length}` : ''}
          </span>

        <div className="flex items-center">
          <button
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            disabled={!(getAllBlackboards().length > 0) || currentBlackboardIndex < 1}
            onClick={() => {
              setCurrentBlackboardIndex(currentBlackboardIndex - 1);
            }}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            disabled={!(getAllBlackboards().length > 0) || currentBlackboardIndex >= getAllBlackboards().length - 1}
            onClick={() => {
              setCurrentBlackboardIndex(currentBlackboardIndex + 1);
            }}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      {
        getAllBlackboards().length > 0 && currentBloackboardUuid ? (
          <div className="w-full flex-1 p-6 bg-white">
            {currentBloackboardUuid && lessonUuid && (
              <DynamicComponentRenderer
                key={currentBloackboardUuid}
                sessionId={lessonUuid}
                blackboardUuid={currentBloackboardUuid}
                containerClassName="h-full"
                className="!h-full"
                showRegenerateButton={true}
                isRegenerating={false}
                onRegenerateStateChange={() => {
                }}
              />
            )}
          </div>
        ) : (
          <div className="w-full flex-1 flex items-center justify-center text-gray-400 bg-white">
            还没有互动示例，和老师对话就会出现哦
          </div>
        )
      }

    </div>
  )
}

export default KnowledgeComponent