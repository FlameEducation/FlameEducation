import KnowledgeComponent from "@/pages/chat/Layout/RightPannel/KnowledgeCard";
import ExerciseDisplayComponent from "@/pages/chat/Layout/RightPannel/ExerciseDisplay";
import MindMapDisplayComponent from "@/pages/chat/Layout/RightPannel/MindMapDisplay";
import { useExerciseContext } from "@/pages/chat/context/ExerciseContext";
import { useChatHistoryContext } from "@/pages/chat/context/ChatHistoryContext";

export const RightPanelComponent = () => {
  const { showExerciseInRightPanel } = useExerciseContext();
  const { activeMindMapUuid } = useChatHistoryContext();

  return (
    <div className="flex w-full h-full">
      {showExerciseInRightPanel ? (
        <ExerciseDisplayComponent />
      ) : activeMindMapUuid ? (
        <MindMapDisplayComponent />
      ) : (
        <KnowledgeComponent />
      )}
    </div>
  );
};

export default RightPanelComponent