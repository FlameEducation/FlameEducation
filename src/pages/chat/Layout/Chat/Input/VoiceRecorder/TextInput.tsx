import React, { useState, useRef, useEffect } from 'react';
import { Keyboard, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface TextInputProps {
  onSendText: (text: string) => Promise<void>;
  isLoading?: boolean;
  isLoadingUI?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  onSendText,
  isLoading = false,
  isLoadingUI = false
}) => {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    
    // 自动调整高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  };

  const handleSend = async () => {
    if (!text.trim() || isLoading || isLoadingUI) return;
    
    try {
      const textToSend = text.trim();
      setText(''); // 立即清空输入框，提供更好的用户体验
      
      // 重置文本框高度
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      await onSendText(textToSend);
    } catch (error) {
      console.error('发送文本时出错:', error);
      // 如果发送失败，可以恢复文本
      setText(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 初始化时聚焦输入框
  useEffect(() => {
    if (textareaRef.current && !isLoading && !isLoadingUI) {
      textareaRef.current.focus();
    }
  }, [isLoading, isLoadingUI]);

  return (
    <div className="w-full">
      {/* 文本输入区域 */}
      <div className={cn(
        "relative flex items-end bg-white rounded-md border transition-all duration-200",
        isFocused ? 'border-green-400' : 'border-gray-200',
        (isLoading || isLoadingUI) && 'opacity-80'
      )}>
        {/* 左侧图标 - 居中对齐 */}
        <div className="flex items-center justify-center px-3 py-2 text-green-600">
          <Keyboard className="w-4 h-4" />
        </div>
        
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="有什么想问的吗？"
          className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 focus:border-0 text-sm min-h-[40px] max-h-[100px] py-2 px-0"
          rows={1}
          disabled={isLoading || isLoadingUI}
        />
        
        <Button
          size="sm"
          className={cn(
            "m-1.5 h-8 w-8 p-0 transition-all duration-200",
            text.trim() 
              ? "bg-green-500 hover:bg-green-600 text-white shadow-md" 
              : "bg-gray-200 text-gray-400 cursor-not-allowed hover:bg-gray-200"
          )}
          onClick={handleSend}
          disabled={!text.trim() || isLoading || isLoadingUI}
          aria-label="发送消息"
        >
          {isLoading || isLoadingUI ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}; 