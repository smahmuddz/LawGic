
import React, { useEffect, useRef } from 'react';
import type { ChatMessageInterface, GroundingChunk } from '../types';
import { ChatMessage } from './ChatMessage';

interface ChatWindowProps {
  messages: ChatMessageInterface[];
  streamingBotResponse: string;
  streamingBotGroundingChunks: GroundingChunk[];
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, streamingBotResponse, streamingBotGroundingChunks }) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingBotResponse]);

  return (
    <div className="flex-grow p-4 md:p-6 space-y-4 overflow-y-auto bg-slate-50">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      {streamingBotResponse && (
         <ChatMessage 
            key="streaming-bot-message"
            message={{
              id: 'streaming-bot-message',
              text: streamingBotResponse,
              sender: 'bot',
              timestamp: new Date(),
            }}
            isStreaming={true}
            streamingGroundingChunks={streamingBotGroundingChunks}
          />
      )}
      <div ref={chatEndRef} />
    </div>
  );
};
