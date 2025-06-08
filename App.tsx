import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse, Candidate } from '@google/genai';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ErrorMessage } from './components/ErrorMessage';
import { SuggestionChips } from './components/SuggestionChips';
import type { ChatMessageInterface, GroundingChunk } from './types';
import { GEMINI_MODEL_NAME, SYSTEM_INSTRUCTION, INITIAL_BOT_GREETING_ID, INITIAL_BOT_GREETING_TEXT, SUGGESTION_TEMPLATES } from './constants';

const App: React.FC = () => {
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessageInterface[]>([]);
  const [streamingBotResponse, setStreamingBotResponse] = useState<string>('');
  const [streamingBotGroundingChunks, setStreamingBotGroundingChunks] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const apiKey = process.env.API_KEY;

  useEffect(() => {
    if (!apiKey) {
      setError("API_KEY environment variable not set. Please configure it to use the chatbot.");
      setIsLoading(false);
      return;
    }
    try {
      const ai = new GoogleGenAI({ apiKey });
      const newChatSession = ai.chats.create({
        model: GEMINI_MODEL_NAME,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{googleSearch: {}}], // Enable Google Search grounding
        },
      });
      setChatSession(newChatSession);
      // Add initial greeting message from the bot
      setMessages([{
        id: INITIAL_BOT_GREETING_ID,
        text: INITIAL_BOT_GREETING_TEXT,
        sender: 'bot',
        timestamp: new Date()
      }]);
    } catch (e) {
      console.error("Failed to initialize Gemini AI:", e);
      setError(`Failed to initialize AI services. ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [apiKey]);

  const handleSendMessage = useCallback(async (userInput: string) => {
    if (!chatSession || !userInput.trim()) return;

    const newUserMessage: ChatMessageInterface = {
      id: Date.now().toString(),
      text: userInput,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setIsLoading(true);
    setError(null);
    setStreamingBotResponse('');
    setStreamingBotGroundingChunks([]);

    try {
      const result = await chatSession.sendMessageStream({ message: userInput });
      let accumulatedText = '';
      let accumulatedChunks: GroundingChunk[] = [];

      for await (const chunk of result) { // chunk is GenerateContentResponse
        const chunkText = chunk.text;
        if (chunkText) {
          accumulatedText += chunkText;
          setStreamingBotResponse(prev => prev + chunkText);
        }
        
        const candidate = chunk.candidates?.[0] as Candidate | undefined;
        if (candidate?.groundingMetadata?.groundingChunks) {
            accumulatedChunks = [...accumulatedChunks, ...candidate.groundingMetadata.groundingChunks];
            // Deduplicate streaming chunks immediately for UI responsiveness
            const uniqueUris = new Set<string>();
            const uniqueStreamingChunks = accumulatedChunks.filter(c => {
                if (c.web?.uri && !uniqueUris.has(c.web.uri)) {
                    uniqueUris.add(c.web.uri);
                    return true;
                }
                return false;
            });
            setStreamingBotGroundingChunks(uniqueStreamingChunks);
        }
      }
      
      const finalBotMessage: ChatMessageInterface = {
        id: Date.now().toString() + '-bot',
        text: accumulatedText,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      // Process final grounding chunks, ensuring uniqueness
      const finalUniqueChunksMap = new Map<string, GroundingChunk>();
      accumulatedChunks.forEach(chunk => {
        if (chunk.web?.uri && !finalUniqueChunksMap.has(chunk.web.uri)) {
          finalUniqueChunksMap.set(chunk.web.uri, chunk);
        }
      });
      const finalUniqueGroundingChunks = Array.from(finalUniqueChunksMap.values());

     if (finalUniqueGroundingChunks.length > 0) {
  const sourcesText = finalUniqueGroundingChunks
    .map(chunk => `[${chunk.web?.title || 'Source'}](${chunk.web?.uri})`)
    .join('\n');
  
  if (sourcesText) {
    finalBotMessage.text += `\n\n**Sources:**\n${sourcesText}`; // <-- This line appends the duplicate list
  }
}

      setMessages(prevMessages => [...prevMessages, finalBotMessage]);

    } catch (e) {
      console.error("Error sending message to Gemini:", e);
      setError(`Sorry, an error occurred while processing your request. ${e instanceof Error ? e.message : String(e)}`);
      const errorBotMessage: ChatMessageInterface = {
        id: Date.now().toString() + '-bot-error',
        text: "I encountered an issue. Please try again or rephrase your question.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prevMessages => [...prevMessages, errorBotMessage]);
    } finally {
      setIsLoading(false);
      setStreamingBotResponse('');
      setStreamingBotGroundingChunks([]);
    }
  }, [chatSession]);

  if (!apiKey && !error) {
     return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center">
          <h1 className="text-2xl font-bold text-sky-700 mb-4">Legal Aid Chatbot</h1>
          <p className="text-red-600 text-lg">Configuration Error: API_KEY is missing.</p>
          <p className="text-slate-600 mt-2">Please ensure the API_KEY environment variable is set for the application to function.</p>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans">
      <Header />
      <ChatWindow messages={messages} streamingBotResponse={streamingBotResponse} streamingBotGroundingChunks={streamingBotGroundingChunks} />
      <div className="px-3 md:px-4 pt-2 pb-1 bg-slate-100">
        {isLoading && <LoadingIndicator />}
        {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
        {!isLoading && !error && messages.length > 0 && ( // Show suggestions only when not loading, no error, and chat has started
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
