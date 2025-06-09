// src/App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ErrorMessage } from './components/ErrorMessage';
import { SuggestionChips } from './components/SuggestionChips';
import type { ChatMessageInterface } from './types';
import {
  GEMINI_MODEL_NAME,
  SYSTEM_INSTRUCTION,
  INITIAL_BOT_GREETING_ID,
  INITIAL_BOT_GREETING_TEXT,
  SUGGESTION_TEMPLATES,
} from './constants';

const App: React.FC = () => {
  const [model, setModel] = useState<any | null>(null);
  const [messages, setMessages] = useState<ChatMessageInterface[]>([]);
  const [streamingBotResponse, setStreamingBotResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const apiKey = process.env.API_KEY;

  useEffect(() => {
    const init = async () => {
      if (!apiKey) {
        setError('API Key not found. Please set VITE_API_KEY in your .env file.');
        return;
      }

      try {
        const ai = new GoogleGenerativeAI(apiKey);
        const model = ai.getGenerativeModel({
          model: GEMINI_MODEL_NAME,
          systemInstruction: SYSTEM_INSTRUCTION,
        });

        setModel(model);

        const initialGreeting: ChatMessageInterface = {
          id: INITIAL_BOT_GREETING_ID,
          text: INITIAL_BOT_GREETING_TEXT,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages([initialGreeting]);
      } catch (e) {
        console.error('Failed to initialize AI:', e);
        setError(`Failed to initialize AI services. ${e instanceof Error ? e.message : String(e)}`);
      }
    };

    init();
  }, [apiKey]);

  const handleSendMessage = useCallback(
    async (userInput: string) => {
      if (!model || !userInput.trim() || isLoading) return;

      const newUserMessage: ChatMessageInterface = {
        id: Date.now().toString(),
        text: userInput,
        sender: 'user',
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, newUserMessage];
      setMessages(updatedMessages);

      setIsLoading(true);
      setError(null);
      setStreamingBotResponse('');

      try {
        const result = await model.generateContentStream([userInput]);
        let responseText = '';

        for await (const chunk of result.stream) {
          const part = chunk.text();
          if (part) {
            responseText += part;
            setStreamingBotResponse((prev) => prev + part);
          }
        }

        const finalBotMessage: ChatMessageInterface = {
          id: Date.now().toString() + '-bot',
          text: responseText,
          sender: 'bot',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, finalBotMessage]);
      } catch (e) {
        console.error('Error during AI response:', e);
        setError(`Error: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setIsLoading(false);
        setStreamingBotResponse('');
      }
    },
    [model, messages, isLoading]
  );

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans">
      <Header />
      <ChatWindow
        messages={messages}
        streamingBotResponse={streamingBotResponse}
        streamingBotGroundingChunks={[]} // Optional: remove if not used
      />
      <div className="px-4 pt-2 pb-1 bg-white border-t">
        {isLoading && <LoadingIndicator />}
        {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
        {!isLoading && !error && messages.length > 0 && (
          <SuggestionChips
            suggestions={SUGGESTION_TEMPLATES}
            onSuggestionClick={handleSendMessage}
            isLoading={isLoading || !model}
          />
        )}
      </div>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading || !model} />
    </div>
  );
};

export default App;
