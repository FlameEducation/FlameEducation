import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactCode from '../../components/sendbox/ReactCode.tsx';

const buttonExample = `
function Demo() {
  return (
    <div className="space-x-4">
      <Button>默认按钮</Button>
      <Button variant="secondary">次要按钮</Button>
      <Button variant="destructive">危险按钮</Button>
    </div>
  );
}
`.trim();

const inputExample = `
function InputDemo() {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="email">邮箱</Label>
        <Input id="email" placeholder="请输入邮箱..." />
      </div>
      <div>
        <Label htmlFor="search">搜索</Label>
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input id="search" placeholder="搜索..." className="pl-9" />
        </div>
      </div>
    </div>
  );
}
`.trim();

const cardExample = `
function CardDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>卡片标题</CardTitle>
        <CardDescription>卡片描述文本</CardDescription>
      </CardHeader>
      <CardContent>
        <p>卡片内容区域，可以放置任何元素</p>
      </CardContent>
      <CardFooter>
        <Button>确认</Button>
      </CardFooter>
    </Card>
  );
}
`.trim();

const examples = [
  { id: 'button', name: '按钮', code: buttonExample },
  { id: 'input', name: '输入框', code: inputExample },
  { id: 'card', name: '卡片', code: cardExample },
];

const ReactCodeTest: React.FC = () => {
  const [selectedExample, setSelectedExample] = React.useState(examples[0]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="flex items-center mb-6">
          <Link to="/test" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">React 代码预览</h1>
            <p className="text-muted-foreground">测试 React 组件的实时代码预览功能</p>
          </div>
        </div>

        {/* 示例选择器 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {examples.map(example => (
            <Button
              key={example.id}
              variant={selectedExample.id === example.id ? "default" : "outline"}
              onClick={() => setSelectedExample(example)}
            >
              {example.name}示例
            </Button>
          ))}
        </div>

        {/* 显示编辑器和预览 */}
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-3">编辑器 + 预览</h2>
          <ReactCode
            code={selectedExample.code}
            minHeight="200px"
          />
        </div>

        {/* 只显示预览结果 */}
        <div>
          <h2 className="text-lg font-medium mb-3">仅预览模式</h2>
          <ReactCode
            code={selectedExample.code}
            hideEditor={true}
            minHeight="150px"
          />
        </div>
      </div>
    </div>
  );
};

export default ReactCodeTest;