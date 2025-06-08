import React, { useState, useEffect, useCallback } from 'react';
// Note: You'll need to export your ChatMessage and ChatWindow for this structure
import { ChatMessage, ChatWindow } from './components/ChatWindow'; 
import { ChatInput } from './components/ChatInput';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ErrorMessage } from './components/ErrorMessage';
import { SuggestionChips } from './components/SuggestionChips';
import type { ChatMessageInterface, GroundingChunk } from './types';
import { GEMINI_MODEL_NAME, SYSTEM_INSTRUCTION, INITIAL_BOT_GREETING_ID, INITIAL_BOT_GREETING_TEXT, SUGGESTION_TEMPLATES } from './constants';
import { GoogleGenAI, Chat, GenerateContentResponse, Candidate } from '@google/genai';

const CHAT_HISTORY_SESSION_KEY = 'chat_history';

const App: React.FC = () => {
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessageInterface[]>([]);
  // ... other state variables remain the same

  const apiKey = process.env.API_KEY;

  // This effect now initializes the chat, either new or restored from sessionStorage
  useEffect(() => {
    if (!apiKey) {
      setError("API_KEY environment variable not set. Please configure it to use the chatbot.");
      return;
    }
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // --- START: NEW LOGIC FOR RESTORING HISTORY ---
      const savedHistoryRaw = sessionStorage.getItem(CHAT_HISTORY_SESSION_KEY);
      const savedHistory: ChatMessageInterface[] | null = savedHistoryRaw ? JSON.parse(savedHistoryRaw) : null;

      let newChatSession;
      if (savedHistory && savedHistory.length > 0) {
        console.log("Restoring chat history from sessionStorage.");
        // Re-map history to the format Gemini SDK's `restore` expects
        const historyForSDK = savedHistory.map(msg => ({
          role: msg.sender, // 'user' or 'bot'
          parts: [{ text: msg.text }]
        })).slice(1); // Exclude the initial greeting, as the system instruction handles it
        
        newChatSession = ai.chats.restore({
          model: GEMINI_MODEL_NAME,
          config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{googleSearch: {}}] },
          history: historyForSDK
        });
        // Also restore the messages for display
        setMessages(savedHistory.map(msg => ({...msg, timestamp: new Date(msg.timestamp)})));
      } else {
        console.log("Starting a new chat session.");
        newChatSession = ai.chats.create({
          model: GEMINI_MODEL_NAME,
          config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{googleSearch: {}}] },
        });
        // Add initial greeting for a new chat
        const initialGreeting = {
          id: INITIAL_BOT_GREETING_ID,
          text: INITIAL_BOT_GREETING_TEXT,
          sender: 'bot' as const,
          timestamp: new Date()
        };
        setMessages([initialGreeting]);
        sessionStorage.setItem(CHAT_HISTORY_SESSION_KEY, JSON.stringify([initialGreeting]));
      }
      // --- END: NEW LOGIC ---

      setChatSession(newChatSession);

    } catch (e) {
      console.error("Failed to initialize Gemini AI:", e);
      setError(`Failed to initialize AI services. ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [apiKey]);

  // This function now saves the updated history after each message
  const handleSendMessage = useCallback(async (userInput: string) => {
    if (!chatSession || !userInput.trim()) return;

    const newUserMessage: ChatMessageInterface = {
      id: Date.now().toString(),
      text: userInput,
      sender: 'user',
      timestamp: new Date(),
    };
    
    // Optimistically update UI and save history
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    sessionStorage.setItem(CHAT_HISTORY_SESSION_KEY, JSON.stringify(updatedMessages));

    setIsLoading(true);
    // ... reset error, streaming state ...
    setError(null);
    setStreamingBotResponse('');
    setStreamingBotGroundingChunks([]);

    try {
      // ... the entire streaming logic from `const result = ...` remains the same ...
      const result = await chatSession.sendMessageStream({ message: userInput });
      let accumulatedText = '';
      let accumulatedChunks: GroundingChunk[] = [];

      for await (const chunk of result) { /* ... */ } // This part is unchanged

      // ... logic for cleaning text and creating finalBotMessage remains the same ...
      const finalBotMessage: ChatMessageInterface = { /* ... */ }; // Unchanged
      
      // Update the UI and save the final state to sessionStorage
      setMessages(prev => {
        const finalMessages = [...prev, finalBotMessage];
        sessionStorage.setItem(CHAT_HISTORY_SESSION_KEY, JSON.stringify(finalMessages));
        return finalMessages;
      });

    } catch (e) {
      // ... error handling is the same ...
    } finally {
      // ... finally block is the same ...
      setIsLoading(false);
      setStreamingBotResponse('');
      setStreamingBotGroundingChunks([]);
    }
  }, [chatSession, messages]); // Add `messages` to dependencies

  // ... rest of the component remains unchanged
  return ( /* ... */ );
};

export default App;
