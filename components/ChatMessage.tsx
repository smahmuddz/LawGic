import React from 'react';
import type { ChatMessageInterface, GroundingChunk } from '../types';

interface ChatMessageProps {
  message: ChatMessageInterface;
  isStreaming?: boolean;
  streamingGroundingChunks?: GroundingChunk[];
}

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-6 h-6"}>
    <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
  </svg>
);

const BotIcon: React.FC<{ className?: string }> = ({ className }) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);


export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming = false, streamingGroundingChunks }) => {
  const isUser = message.sender === 'user';
  
  const formatText = (text: string) => {
    // Basic markdown for bold and links
    // Convert **text** to <strong>text</strong>
    let htmlText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Convert [title](url) to <a href="url" target="_blank">title</a>
    htmlText = htmlText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-sky-600 hover:text-sky-800 underline">$1</a>');
    // Convert newlines to <br />
    htmlText = htmlText.replace(/\n/g, '<br />');
    return { __html: htmlText };
  };

  // Filter unique grounding chunks by URI for streaming display
  const uniqueStreamingChunks = isStreaming && streamingGroundingChunks ? 
    Array.from(new Map(streamingGroundingChunks.filter(c => c.web?.uri).map(c => [c.web!.uri, c])).values()) 
    : [];

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-700 flex items-center justify-center text-white">
          <BotIcon className="w-5 h-5" />
        </div>
      )}
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-2xl px-4 py-3 rounded-xl shadow ${
          isUser
            ? 'bg-sky-600 text-white rounded-br-none'
            : 'bg-slate-200 text-slate-800 rounded-bl-none'
        }`}
      >
        <div className="prose prose-sm max-w-none text-inherit" dangerouslySetInnerHTML={formatText(message.text)} />
        
        {isStreaming && uniqueStreamingChunks && uniqueStreamingChunks.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-300">
            <p className="text-xs font-semibold text-slate-600">Sources (updating):</p>
            <ul className="list-disc list-inside text-xs">
              {uniqueStreamingChunks.map(chunk => (
                  <li key={chunk.web!.uri}>
                    <a href={chunk.web!.uri} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-800 underline">
                      {chunk.web!.title || chunk.web!.uri}
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        )}
        <p className={`text-xs mt-2 ${isUser ? 'text-sky-200 text-right' : 'text-slate-500 text-left'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {isStreaming && <span className="italic ml-1">(typing...)</span>}
        </p>
      </div>
      {isUser && (
         <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-700">
          <UserIcon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};