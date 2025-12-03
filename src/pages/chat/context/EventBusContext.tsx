// EventBusContext.tsx
import React, { createContext, useContext } from 'react';

// 定义事件监听器的类型
type EventCallback = (data?: any) => void;

// 定义事件总线的接口
interface EventBus {
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: EventCallback) => void;
  off: (event: string, callback: EventCallback) => void;
}

// 创建事件总线实例
class EventBusImpl implements EventBus {
  private listeners: Map<string, EventCallback[]>;

  constructor() {
    this.listeners = new Map();
  }

  emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }

  on(event: string, callback: EventCallback) {
    const callbacks = this.listeners.get(event) || [];
    this.listeners.set(event, [...callbacks, callback]);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.listeners.get(event) || [];
    this.listeners.set(
      event,
      callbacks.filter(cb => cb !== callback)
    );
  }
}

// 创建事件总线实例
const eventBus = new EventBusImpl();

// 创建 Context
const EventBusContext = createContext<EventBus>(eventBus);

// 提供 Provider 组件
export const EventBusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <EventBusContext.Provider value={eventBus}>
    {children}
  </EventBusContext.Provider>
);

// 提供使用 hook
export const useEventBus = () => useContext(EventBusContext);