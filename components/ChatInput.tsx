import React, { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-5 h-5"}>
    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
  </svg>
);


export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-100 p-3 md:p-4 pt-2 border-t border-slate-300 sticky bottom-0">
      <div className="flex items-center space-x-2 bg-white rounded-lg shadow p-1">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about Bangladeshi law or constitution..."
          className="flex-grow p-3 border-none focus:ring-0 resize-none h-16 min-h-[3rem] max-h-32 leading-tight bg-transparent text-slate-700 placeholder-slate-400"
          rows={1}
          disabled={isLoading}
          aria-label="Chat message input"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-3 rounded-md text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </div>
    </form>
  );
};