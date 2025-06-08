import React from 'react';

interface SuggestionChipsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  isLoading: boolean;
}

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({ suggestions, onSuggestionClick, isLoading }) => {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="pb-2 px-1 md:px-0">
      <p className="text-xs text-slate-500 mb-1.5 ml-1 font-medium">Quick Suggestions:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            disabled={isLoading}
            className="px-3 py-1.5 bg-sky-100 text-sky-700 rounded-full text-sm hover:bg-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label={`Suggestion: ${suggestion}`}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};