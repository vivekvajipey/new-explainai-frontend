// src/components/conversation/MessageList/index.ts
import { useRef } from 'react';
import { MessageListProps } from './types';

export function MessageList({ messages, streamingState, error }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  console.log('Messages:', messages);
  console.log('Streaming state:', streamingState);
  console.log('Messages:', messages.map(m => ({id: m.id, role: m.role})));
  console.log('Streaming state ID:', streamingState.id);


  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages
        .filter(msg => msg.role !== 'system')
        .map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
              message.role === 'user'
                ? 'bg-message-user-bg text-message-user-text'
                : 'bg-message-ai-bg text-message-ai-text'
            }`}
          >
            <p className="whitespace-pre-wrap">
              {message.id === streamingState.id && streamingState.isStreaming
                ? streamingState.content
                : message.content}
            </p>
          </div>
        </div>
      ))}
      {error && (
        <div className="text-error p-3 bg-error/10 rounded-lg text-center">
          {error}
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}