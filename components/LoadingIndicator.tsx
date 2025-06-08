
import React from 'react';

export const LoadingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start items-center p-4 pl-6 md:pl-8">
      <div className="flex items-center space-x-1 text-slate-500">
        <div className="w-2 h-2 bg-sky-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-sky-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-sky-600 rounded-full animate-bounce"></div>
        <span className="ml-2 text-sm">LawGic is thinking...</span>
      </div>
    </div>
  );
};
