import React, { createContext, useContext, useReducer, useCallback, useState, useEffect, useRef } from 'react';
import api from "@/api";
import { useSearchParams } from "react-router-dom";
import { useEventBus } from "@/pages/chat/context/EventBusContext.tsx";
import { TeacherInfo, getEnabledTeachers } from "@/api/teacher";

// 创建聊天历史记录上下文
export const ClassStatusContext = createContext<{
  lessonInfo: any,
  isLoading: boolean,
  currentChapter: number,
  currentPart: number,
  chapterUuid: string | null,
  lessonUuid: string | null,
  courseUuid: string | null,
  classCompleted: boolean,
  handleProgress: (chapterId: number, partId: number, finished?: boolean) => void,
  availableTeachers: TeacherInfo[],
  isTeachersLoaded: boolean,
}>({
  lessonInfo: null,
  isLoading: false,
  currentChapter: 0,
  currentPart: 0,
  chapterUuid: null,
  lessonUuid: null,
  courseUuid: null,
  classCompleted: false,
  handleProgress: () => { },
  availableTeachers: [],
  isTeachersLoaded: false,
});

// 使用聊天历史记录的自定义Hook
export const useClassStatusContext = () => useContext(ClassStatusContext)

export const ClassStatusContextProvider = ({ children }: { children: React.ReactNode }) => {

  const [searchParams] = useSearchParams();

  const paramCourseUuid = searchParams.get('courseUuid');
  const paramLessonUuid = searchParams.get('lessonUuid');
  const paramChapterUuid = searchParams.get('chapterUuid');


  const [lessonInfo, setLessonInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentChapter, setCurrentChapter] = useState<number>(0);
  const [currentPart, setCurrentPart] = useState<number>(0);

  const currentChapterIdRef = useRef<number>(0);
  const currentPartIdRef = useRef<number>(0);

  const [chapterUuid, setChapterUuid] = useState<string>(paramChapterUuid || "");
  const [lessonUuid, setLessonUuid] = useState<string>(paramLessonUuid || "");
  const [courseUuid, setCourseUuid] = useState<string>(paramCourseUuid || "");
  const [classCompleted, setClassCompleted] = useState<boolean>(false);
  const [availableTeachers, setAvailableTeachers] = useState<TeacherInfo[]>([]);
  const [isTeachersLoaded, setIsTeachersLoaded] = useState<boolean>(false);
  const eventBus = useEventBus();


  const updateLessonInfo = () => {
    setIsLoading(true);
    api.getLessonInfo(lessonUuid).then(res => {
      setLessonInfo(res);
      setClassCompleted(res.completed);
    })
      .finally(() => {
        setIsLoading(false);
      })
  }

  // 清理资源
  useEffect(() => {
    updateLessonInfo();
    
    // 加载可用教师列表
    getEnabledTeachers().then(teachers => {
      setAvailableTeachers(teachers);
    }).catch(err => {
      console.error("Failed to load teachers in ClassStatusContext", err);
    }).finally(() => {
      setIsTeachersLoaded(true);
    });

    eventBus.on('progress', (data: any) => {
      console.log("进度:", data);
      handleProgress(data.cid, data.pid, data.finished);
    });
  }, []);

  const handleProgress = (chapterId: number, partId: number, finished: boolean = false) => {
    if (chapterId !== currentChapterIdRef.current || partId !== currentPartIdRef.current || finished) {
      currentChapterIdRef.current = chapterId;
      currentPartIdRef.current = partId;
      updateLessonInfo();
    }

    setCurrentChapter(chapterId);
    setCurrentPart(partId);
    setClassCompleted(finished == true);
  }


  // 准备上下文值
  const contextValue = {
    lessonInfo,
    isLoading,
    currentChapter,
    currentPart,
    chapterUuid,
    lessonUuid,
    courseUuid,
    handleProgress,
    classCompleted,
    availableTeachers,
    isTeachersLoaded,
  };

  return (
    <ClassStatusContext.Provider value={contextValue}>
      {children}
    </ClassStatusContext.Provider>
  );
};

export default ClassStatusContext;
