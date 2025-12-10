import React, { useEffect, useState, useRef } from 'react';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import { cn } from '@/lib/utils.ts';
import * as shadcnComponents from "@/lib/ui-components";
import * as LucideIcons from "lucide-react";
import api from '@/api/index.ts';

interface ReactCodeProps {
  code: string;
  hideEditor?: boolean;
  minHeight?: string;
  className?: string;
  containerClassName?: string;
  courseUuid?: string;
  lessonUuid?: string;
  chapterUuid?: string;
  blackboardUuid?: string;
}

export const ReactCode: React.FC<ReactCodeProps> = ({
  code,
  hideEditor = false,
  minHeight = "200px",
  className,
  containerClassName,
  courseUuid,
  lessonUuid,
  chapterUuid,
  blackboardUuid
}) => {

  const playWordAudio = (word: string) => {
    const audioSrc = `https://learn.mashangrun.com/api/voice/word?words=${word}`;
    const audio = new Audio(audioSrc);
    audio.play();
  };

  // 保存黑板元数据的函数
  const saveMetadata = async (metadata) => {
    if (!courseUuid || !lessonUuid || !chapterUuid) {
      console.warn("缺少必要的参数，无法保存黑板元数据");
      return;
    }
    try {
      await api.saveBlackboardMetadata({ courseUuid, lessonUuid, chapterUuid, value: metadata, blackboardUuid });
    } catch (error) {
      console.error("保存黑板元数据失败:", error);
    }
  }

  // 错误状态管理
  const [hasError, setHasError] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const errorReportedRef = useRef(false);

  // 监听错误变化
  useEffect(() => {
    // 当错误发生时，通知父页面（只通知一次）
    if (hasError && !errorReportedRef.current && window.parent) {
      errorReportedRef.current = true;
      window.parent.postMessage({
        type: 'CODE_ERROR',
        courseUuid,
        lessonUuid,
        chapterUuid,
        blackboardUuid,
      }, '*');

      // 5s后允许再次报告错误
      setTimeout(() => {
        errorReportedRef.current = false;
      }, 5000);

    }
  }, [hasError, courseUuid, lessonUuid, chapterUuid, blackboardUuid]);

  // 检测 LiveError 是否存在
  useEffect(() => {

    if (intervalRef.current !== null) {
      return;
    }
    intervalRef.current = setInterval(() => {
      const errorElement = document.querySelector('.react-live-error');
      if (errorElement && !errorReportedRef.current) {
        setHasError(true);
      }
    }, 1000);

    // 清理定时器
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

  }, []);

  // 准备所有需要注入的依赖
  const scope = {
    playWordAudio,
    saveMetadata,
    cn,
    React,
    useState: React.useState,
    useRef: React.useRef,
    useEffect: React.useEffect,
    ...shadcnComponents,
    ...LucideIcons,
  };


  return (
    <div className={cn("w-full", containerClassName)}>
      <LiveProvider
        code={code}
        scope={scope}
        noInline={false}
      >
        {!hideEditor && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">代码编辑</div>
            <div className={cn(
              "rounded-lg overflow-hidden",
              "border border-gray-200",
              "bg-white shadow-sm"
            )}>
              <LiveEditor
                className="p-4 font-mono text-sm"
                style={{
                  backgroundColor: 'white',
                  color: '#374151'
                }}
              />
            </div>
          </div>
        )}

        {/* 预览部分 */}
        <div className="space-y-2 react-live">
          {!hideEditor && (
            <div className="text-sm font-medium text-gray-700">预览效果</div>
          )}
          <div className={cn(
            "rounded-lg overflow-hidden",
            hideEditor ? "" : "border border-gray-200 bg-white shadow-sm",
            className
          )}
            style={{ minHeight }}>
            <LivePreview />
          </div>


          <LiveError
            className={cn(
              "text-sm text-red-600 bg-red-50",
              "p-3 rounded-lg border border-red-200",
              "font-medium react-live-error opacity-0"
            )}
            onError={() => setHasError(true)}
          />

        </div>
      </LiveProvider>
    </div>
  );
};

export default ReactCode; 