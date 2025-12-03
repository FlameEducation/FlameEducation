import React, {useState, useEffect, useRef} from 'react';
import ReactCode from '@/components/sendbox/ReactCode.tsx';

const CodePreviewPage: React.FC = () => {
  const [code, setCode] = useState<string | null>(null);
  const courseUuid = useRef<string | null>(null);
  const chapterUuid = useRef<string | null>(null);
  const lessonUuid = useRef<string | null>(null);
  const blackboardUuid = useRef<string | null>(null);


  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CODE_CONTENT' && event.data?.content) {
        setCode(event.data.content);
        courseUuid.current = event.data.courseUuid || null;
        chapterUuid.current = event.data.chapterUuid || null;
        lessonUuid.current = event.data.lessonUuid || null;
        blackboardUuid.current = event.data.blackboardUuid || null;
      }
    };
    window.addEventListener('message', handleMessage);
    console.log('Sending IFRAME_READY message');
    window.parent.postMessage({type: 'IFRAME_READY'}, '*');
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {

  }, [code]);

  if (!code) {
    return (
      <div className="h-screen-dynamic flex items-center justify-center">
        <div className="text-gray-500">等待代码内容...</div>
      </div>
    );
  }

  return (
    <div className="h-screen-dynamic overflow-auto bg-transparent">
      <ReactCode
        code={code}
        hideEditor={true}
        className="h-full"
        containerClassName="h-full p-0 bg-transparent"
        courseUuid={courseUuid.current || undefined}
        lessonUuid={lessonUuid.current || undefined}
        chapterUuid={chapterUuid.current || undefined}
        blackboardUuid={blackboardUuid.current || undefined}
      />
    </div>
  );
};

export default CodePreviewPage;
