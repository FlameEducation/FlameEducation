import React from 'react';
import SettingsLayout from '../components/SettingsLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProviderConfigTab from './ProviderConfigTab';
import ModelConfigTab from './ModelConfigTab';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const VoiceConfigPage: React.FC = () => {
  return (
    <SettingsLayout title="语音合成配置" description="配置语音合成服务商及教师语音参数。">

      <Alert className='mb-4'>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>关于语音合成配置</AlertTitle>
        <AlertDescription>
          用于教学过程中的语音合成任务和虚拟教师形象。
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="provider" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="provider">服务商配置</TabsTrigger>
          <TabsTrigger value="model">模型配置</TabsTrigger>
        </TabsList>
        <TabsContent value="provider">
          <ProviderConfigTab />
        </TabsContent>
        <TabsContent value="model">
          <ModelConfigTab />
        </TabsContent>
      </Tabs>
    </SettingsLayout>
  );
};

export default VoiceConfigPage;
