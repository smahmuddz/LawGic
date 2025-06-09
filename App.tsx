
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse, Candidate, Part } from '@google/genai';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ErrorMessage } from './components/ErrorMessage';
import { SuggestionChips } from './components/SuggestionChips'; // Assuming this is part of the user's current setup
import type { ChatMessageInterface, GroundingChunk } from './types';
import { GEMINI_MODEL_NAME, SYSTEM_INSTRUCTION, INITIAL_BOT_GREETING_ID, INITIAL_BOT_GREETING_TEXT, SUGGESTION_TEMPLATES } from './constants'; // Assuming SUGGESTION_TEMPLATES is defined

const CHAT_HISTORY_SESSION_KEY = 'chat_history';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Get only the base64 content
    };
    reader.onerror = (error) => reject(error);
  });
};

const App: React.FC = () => {
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessageInterface[]>([]);
  const [streamingBotResponse, setStreamingBotResponse] = useState<string>('');
  const [streamingBotGroundingChunks, setStreamingBotGroundingChunks] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const apiKey = process.env.API_KEY; // Using process.env.API_KEY as per guidelines

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
          tools: [{googleSearch: {}}] 
        },
      });

      const storedHistory = sessionStorage.getItem(CHAT_HISTORY_SESSION_KEY);
      let initialMessages: ChatMessageInterface[];

      if (storedHistory) {
        try {
          const parsedHistory = JSON.parse(storedHistory) as ChatMessageInterface[];
          // Basic validation for parsed history
          if (Array.isArray(parsedHistory) && parsedHistory.every(msg => msg.id && msg.text && msg.sender && msg.timestamp)) {
            initialMessages = parsedHistory.map(msg => ({...msg, timestamp: new Date(msg.timestamp) }));
          } else {
            throw new Error("Invalid chat history format");
          }
        } catch (e) {
          console.warn("Failed to parse chat history, starting fresh:", e);
          sessionStorage.removeItem(CHAT_HISTORY_SESSION_KEY); // Clear invalid history
          initialMessages = [{
            id: INITIAL_BOT_GREETING_ID,
            text: INITIAL_BOT_GREETING_TEXT,
            sender: 'bot',
            timestamp: new Date()
          }];
          sessionStorage.setItem(CHAT_HISTORY_SESSION_KEY, JSON.stringify(initialMessages));
        }
      } else {
        initialMessages = [{
          id: INITIAL_BOT_GREETING_ID,
          text: INITIAL_BOT_GREETING_TEXT,
          sender: 'bot',
          timestamp: new Date()
        }];
        sessionStorage.setItem(CHAT_HISTORY_SESSION_KEY, JSON.stringify(initialMessages));
      }
      
      setMessages(initialMessages);
      setChatSession(newChatSession);

    } catch (e) {
      console.error("Failed to initialize Gemini AI:", e);
      setError(`Failed to initialize AI services. ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [apiKey]);

  const handleSendMessage = useCallback(async (userInput: string, file?: File | null) => {
    if (!chatSession || (!userInput.trim() && !file) || isLoading) return;

    const userMessageText = userInput.trim();
    const newUserMessage: ChatMessageInterface = {
      id: Date.now().toString(),
      text: userMessageText,
      sender: 'user',
      timestamp: new Date(),
    };

    if (file) {
      newUserMessage.fileInfo = { name: file.name, type: file.type };
    }
    
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    sessionStorage.setItem(CHAT_HISTORY_SESSION_KEY, JSON.stringify(updatedMessages));

    setIsLoading(true);
    setError(null);
    setStreamingBotResponse('');
    setStreamingBotGroundingChunks([]);

    try {
      const messageParts: Part[] = [];
      if (userMessageText) {
        messageParts.push({ text: userMessageText });
      }

      if (file) {
        try {
          const base64Data = await fileToBase64(file);
          messageParts.push({
            inlineData: {
              mimeType: file.type,
              data: base64Data,
            },
          });
        } catch (fileError) {
          console.error("Error processing file:", fileError);
          setError(`Failed to process file: ${fileError instanceof Error ? fileError.message : String(fileError)}`);
          setIsLoading(false);
          const errorBotMessage: ChatMessageInterface = {
            id: Date.now().toString() + '-file-error',
            text: `Sorry, I couldn't process the file "${file.name}". Please try again.`,
            sender: 'bot',
            timestamp: new Date(),
          };
          setMessages(prev => {
             const finalMessages = [...prev, errorBotMessage];
             sessionStorage.setItem(CHAT_HISTORY_SESSION_KEY, JSON.stringify(finalMessages));
             return finalMessages;
          });
          return;
        }
      }
      
      if (messageParts.length === 0) {
        setIsLoading(false);
        return; 
      }

      const result = await chatSession.sendMessageStream({ message: messageParts });
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
            accumulatedChunks.push(...candidate.groundingMetadata.groundingChunks);
            // Deduplicate chunks for streaming display
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
      setError(`Sorry, an error occurred while processing your request. ${e instanceof Error ? e.message : String(e)}`);
      const errorBotMessage: ChatMessageInterface = {
        id: Date.now().toString() + '-bot-error',
        text: "I encountered an issue. Please try again or rephrase your question.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => {
         const finalMessages = [...prev, errorBotMessage];
         sessionStorage.setItem(CHAT_HISTORY_SESSION_KEY, JSON.stringify(finalMessages));
         return finalMessages;
      });
    } finally {
      setIsLoading(false);
      setStreamingBotResponse('');
      setStreamingBotGroundingChunks([]);
    }
  }, [chatSession, messages, isLoading, apiKey]); // Added apiKey to dependency array for re-initialization if it changes (though unlikely for process.env)

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans">
      <Header />
      <ChatWindow 
        messages={messages} 
        streamingBotResponse={streamingBotResponse} 
        streamingBotGroundingChunks={streamingBotGroundingChunks} 
      />
      <div className="px-4 pt-2 pb-1 bg-white border-t border-slate-200">
        {isLoading && <LoadingIndicator />}
        {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
        {!isLoading && !error && messages.length > 0 && SUGGESTION_TEMPLATES && ( // Check SUGGESTION_TEMPLATES existence
            <SuggestionChips
                suggestions={SUGGESTION_TEMPLATES}
                onSuggestionClick={(suggestionText) => handleSendMessage(suggestionText, null)} // Pass null for file
                isLoading={isLoading || !chatSession}
            />
        )}
      </div>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading || !chatSession} />
    </div>
  );
};

export default App;
