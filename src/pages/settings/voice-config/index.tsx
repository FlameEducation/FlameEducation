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

      <Tabs defaultValue="model" className="w-full">
        <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="model" className="px-4">语音角色配置</TabsTrigger>
          <TabsTrigger value="provider" className="px-4">服务商配置</TabsTrigger>
        </TabsList>
        <TabsContent value="provider" className="mt-4">
          <ProviderConfigTab />
        </TabsContent>
        <TabsContent value="model" className="mt-4">
          <ModelConfigTab />
        </TabsContent>
      </Tabs>
    </SettingsLayout>
  );
};

export default VoiceConfigPage;
