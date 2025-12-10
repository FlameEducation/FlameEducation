import {Routes, Route, Navigate} from 'react-router-dom';
import TabLayout from '@/components/layout/TabLayout';
import HomePage from '@/pages/main';
import CoursesPage from '@/pages/courses';
import TutorPage from '@/pages/tutor';
import ProfilePage from '@/pages/profile';
import {ThemeProvider} from '@/providers/ThemeProvider';
import {GlobalSettingsProvider} from '@/contexts';
import ThemeSettingsPage from '@/pages/settings/theme';
import CourseDetailPage from '@/pages/courses/detail';
import AllCoursesPageNew from './pages/courses/all-courses';
import LoginPage from './pages/auth/login';
import CodePreviewPage from '@/components/sendbox/codePreview.tsx';
import ChatPage from './pages/chat';
import SceneConfigPage from './pages/settings/scene-config';
import ProvidersSettingsPage from './pages/settings/providers';
import BalanceDetailPage from './pages/profile/balance.tsx';
import {Toaster} from "@/components/ui/toaster"
import CreateCoursePage from '@/pages/settings/create-course/index.tsx';
import AdminCoursesPage from '@/pages/settings/courses/index.tsx';
import VoiceConfigPage from '@/pages/settings/voice-config/index.tsx';
import AsrConfigPage from '@/pages/settings/asr-config/index.tsx';
import ImageConfigPage from '@/pages/settings/image-config/index.tsx';
import {useEffect} from 'react';
import {initDynamicVH} from '@/utils/viewport';
import ReactCodeTest from '@/pages/test/ReactCodeTest';
import {useAudioUnlock} from './hooks/useAudioUnlock.ts'; // 引入全局音频解锁Hook
import {GameSoundService} from './services/soundService.ts'; // 引入音效服务
import MindMapTest from '@/pages/test/MindMapTest';
import AvatarAnimationTest from '@/pages/test/AvatarAnimationTest';

import InitPage from '@/pages/init';

function App() {
  // 应用全局音频解锁策略
  useAudioUnlock();

  // 初始化全局服务
  useEffect(() => {
    initDynamicVH();
    GameSoundService.initialize(); // 初始化音效服务
  }, []);

  return (
    <GlobalSettingsProvider>
      <ThemeProvider>
        <Routes>
          <Route path="/init" element={<InitPage />} />
          <Route element={<TabLayout/>}>
            <Route path="/" element={<HomePage/>}/>
            <Route path="/courses" element={<CoursesPage/>}/>
            <Route path="/courses/all-courses" element={<AllCoursesPageNew/>}/>
            <Route path="/tutor" element={<TutorPage/>}/>
            <Route path="/profile" element={<ProfilePage/>}/>
          </Route>
          {/* 非Tab布局的路由 */}
          <Route path="/test/react-code" element={<ReactCodeTest/>}/>
          <Route path="/balance" element={<BalanceDetailPage/>}/>
          <Route path="/settings" element={<Navigate to="/settings/providers" replace />}/>
          <Route path="/settings/theme" element={<ThemeSettingsPage/>}/>
          <Route path="/settings/providers" element={<ProvidersSettingsPage/>}/>
          <Route path="/settings/scene-config" element={<SceneConfigPage/>}/>
          <Route path="/settings/courses" element={<AdminCoursesPage/>}/>
          <Route path="/settings/courses/create" element={<CreateCoursePage/>}/>
          <Route path="/settings/voice-config" element={<VoiceConfigPage/>}/>
          <Route path="/settings/asr-config" element={<AsrConfigPage/>}/>
          <Route path="/settings/image-config" element={<ImageConfigPage/>}/>
          <Route path="/courses/:courseId" element={<CourseDetailPage/>}/>
          <Route path="/codePreview" element={<CodePreviewPage/>}/>
          {/* 其他路由 */}
          <Route path="/auth/login" element={<LoginPage/>}/>
          <Route path="/course/learn" element={<ChatPage/>}/>
          <Route path="/test/mindmap" element={<MindMapTest/>}/>
          <Route path="/test/avatar-animation" element={<AvatarAnimationTest/>}/>
          
          
        </Routes>
        <Toaster/>
      </ThemeProvider>
    </GlobalSettingsProvider>
  );
}

export default App;
