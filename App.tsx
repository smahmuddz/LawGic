// src/App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse, Candidate, Content } from '@google/genai';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ErrorMessage } from './components/ErrorMessage';
import { SuggestionChips } from './components/SuggestionChips';
import type { ChatMessageInterface, GroundingChunk } from './types';
import { GEMINI_MODEL_NAME, SYSTEM_INSTRUCTION, INITIAL_BOT_GREETING_ID, INITIAL_BOT_GREETING_TEXT, SUGGESTION_TEMPLATES } from './constants';

const CHAT_HISTORY_SESSION_KEY = 'chat_history';

// Type guard to validate data from sessionStorage
const isChatMessageHistory = (data: any): data is ChatMessageInterface[] => {
  return Array.isArray(data) && data.every(item => 
    typeof item.id === 'string' &&
    typeof item.text === 'string' &&
    (item.sender === 'user' || item.sender === 'bot') &&
    typeof item.timestamp === 'string'
  );
};

const App: React.FC = () => {
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessageInterface[]>([]);
  const [streamingBotResponse, setStreamingBotResponse] = useState<string>('');
  const [streamingBotGroundingChunks, setStreamingBotGroundingChunks] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const apiKey = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      setError("API Key not found. Please set VITE_API_KEY in your .env file.");
      return;
    }
    try {
      const ai = new GoogleGenAI({ apiKey });
      const savedHistoryRaw = sessionStorage.getItem(CHAT_HISTORY_SESSION_KEY);
      let savedHistory: ChatMessageInterface[] | null = null;

      if (savedHistoryRaw) {
        const parsedData = JSON.parse(savedHistoryRaw);
        if (isChatMessageHistory(parsedData)) {
          savedHistory = parsedData;
        }
      }

      let newChatSession;
      if (savedHistory && savedHistory.length > 1) { // Restore only if more than the greeting exists
        const historyForSDK: Content[] = savedHistory
          .slice(1) // Exclude initial greeting
          .map(msg => ({
            role: msg.sender === 'bot' ? 'model' : 'user',
            parts: [{ text: msg.text }]
          }));

        newChatSession = ai.chats.restore({
          model: GEMINI_MODEL_NAME,
          config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{googleSearch: {}}] },
          history: historyForSDK,
        });
        setMessages(savedHistory.map(msg => ({...msg, timestamp: new Date(msg.timestamp)})));
      } else {
        newChatSession = ai.chats.create({
          model: GEMINI_MODEL_NAME,
          config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{googleSearch: {}}] },
        });
        const initialGreeting: ChatMessageInterface = {
          id: INITIAL_BOT_GREETING_ID,
          text: INITIAL_BOT_GREETING_TEXT,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages([initialGreeting]);
        sessionStorage.setItem(CHAT_HISTORY_SESSION_KEY, JSON.stringify([initialGreeting]));
      }
      setChatSession(newChatSession);
    } catch (e) {
      console.error("Failed to initialize Gemini AI:", e);
      setError(`Failed to initialize AI services. ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [apiKey]);

  const handleSendMessage = useCallback(async (userInput: string) => {
    if (!chatSession || !userInput.trim() || isLoading) return;

    const newUserMessage: ChatMessageInterface = {
      id: Date.now().toString(),
      text: userInput,
      sender: 'user',
      timestamp: new Date(),
    };
    
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    sessionStorage.setItem(CHAT_HISTORY_SESSION_KEY, JSON.stringify(updatedMessages));

    setIsLoading(true);
    setError(null);
    setStreamingBotResponse('');
    setStreamingBotGroundingChunks([]);

    try {
      const result = await chatSession.sendMessageStream({ message: userInput });
      let accumulatedText = '';
      let accumulatedChunks: GroundingChunk[] = [];

      for await (const chunk of result) {
        const chunkText = chunk.text;
        if (chunkText) {
          accumulatedText += chunkText;
          setStreamingBotResponse(prev => prev + chunkText);
        }
        const candidate = chunk.candidates?.[0] as Candidate | undefined;
        if (candidate?.groundingMetadata?.groundingChunks) {
            accumulatedChunks.push(...candidate.groundingMetadata.groundingChunks);
            const uniqueStreamingChunks = Array.from(new Map(accumulatedChunks.filter(c => c.web?.uri).map(c => [c.web!.uri, c])).values());
            setStreamingBotGroundingChunks(uniqueStreamingChunks);
        }
      }
      
      const finalUniqueGroundingChunks = Array.from(new Map(accumulatedChunks.filter(c => c.web?.uri).map(c => [c.web!.uri, c])).values());
      
      const finalBotMessage: ChatMessageInterface = {
        id: Date.now().toString() + '-bot',
        text: accumulatedText,
        sender: 'bot',
        timestamp: new Date(),
        grounding: { chunks: finalUniqueGroundingChunks }
      };

      setMessages(prev => {
        const finalMessages = [...prev, finalBotMessage];
        sessionStorage.setItem(CHAT_HISTORY_SESSION_KEY, JSON.stringify(finalMessages));
        return finalMessages;
      });

    } catch (e) {
      console.error("Error sending message to Gemini:", e);
      setError(`Sorry, an error occurred. ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsLoading(false);
      setStreamingBotResponse('');
      setStreamingBotGroundingChunks([]);
    }
  }, [chatSession, messages, isLoading]);

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans">
      <Header />
      <ChatWindow 
        messages={messages} 
        streamingBotResponse={streamingBotResponse} 
        streamingBotGroundingChunks={streamingBotGroundingChunks} 
      />
      <div className="px-4 pt-2 pb-1 bg-white border-t">
        {isLoading && <LoadingIndicator />}
        {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
        {!isLoading && !error && messages.length > 0 && (
            <SuggestionChips
                suggestions={SUGGESTION_TEMPLATES}
                onSuggestionClick={handleSendMessage}
                isLoading={isLoading || !chatSession}
            />
        )}
      </div>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading || !chatSession} />
    </div>
  );
};

export default App;
