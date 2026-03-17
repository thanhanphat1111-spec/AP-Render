
import React from 'react';

interface TabButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  isActive: boolean;
}

export const TabButton: React.FC<TabButtonProps> = ({ children, onClick, isActive }) => {
  const baseClasses = "px-4 py-2 text-xs sm:text-sm font-medium rounded-xl transition-all duration-300 focus:outline-none relative overflow-hidden";
  const activeClasses = "bg-gradient-to-r from-brand-accent to-brand-secondary text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-105";
  const inactiveClasses = "text-brand-text-muted hover:text-white hover:bg-white/10";

  return (
    <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
      {children}
    </button>
  );
};
