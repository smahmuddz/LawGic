
import React from 'react';

const BookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

export const Header: React.FC = () => {
  return (
    <header className="bg-sky-800 text-white p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center gap-3">
        <BookIcon className="w-8 h-8 text-sky-300" />
        <h1 className="text-2xl font-semibold tracking-tight">LawGic - Legal Aid Chatbot</h1>
      </div>
      <p className="container mx-auto text-sm text-sky-200 pl-11">Your AI guide to Bangladeshi Law & Constitution</p>
    </header>
  );
};
