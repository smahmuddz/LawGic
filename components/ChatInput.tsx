
import React, { useState, useRef } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string, file?: File | null) => void;
  isLoading: boolean;
}

const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-5 h-5"}>
    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
  </svg>
);

const PaperClipIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.122 2.122l7.81-7.81" />
  </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-4 h-4"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input
    }
  };

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (isLoading) return;
    if (input.trim() || selectedFile) {
      onSendMessage(input.trim(), selectedFile);
      setInput('');
      handleRemoveFile(); // Clears file and resets input
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-100 p-3 md:p-4 border-t border-slate-300 sticky bottom-0">
      <div className="bg-white rounded-lg shadow">
        {selectedFile && (
          <div className="px-3 py-2 text-sm text-slate-600 flex justify-between items-center border-b border-slate-200">
            <span className="truncate max-w-[calc(100%-2rem)]" title={selectedFile.name}>
              Attached: {selectedFile.name}
            </span>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Remove attached file"
              disabled={isLoading}
            >
              <XCircleIcon />
            </button>
          </div>
        )}
        <div className="flex items-center space-x-2 p-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/webp, application/pdf"
            disabled={isLoading}
            aria-label="Attach file"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-3 rounded-md text-slate-500 hover:text-sky-600 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
            aria-label="Attach file"
          >
            <PaperClipIcon className="w-5 h-5"/>
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Anything..."
            className="flex-grow p-3 border-none focus:ring-0 resize-none h-12 min-h-[3rem] max-h-32 leading-tight bg-transparent text-slate-700 placeholder-slate-400"
            rows={1}
            disabled={isLoading}
            aria-label="Chat message input"
          />
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !selectedFile)}
            className="p-3 rounded-md text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </form>
  );
};
