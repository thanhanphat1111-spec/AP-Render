
import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/20 rounded-2xl p-6 ring-1 ring-white/5 ${className}`}>
      <h3 className="text-lg font-semibold text-brand-text mb-5 flex items-center gap-2 border-b border-white/5 pb-3">
        {title}
      </h3>
      <div>{children}</div>
    </div>
  );
};
