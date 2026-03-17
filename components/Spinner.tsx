
import React from 'react';

export const Spinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 text-brand-text-muted">
      <div className="w-8 h-8 border-4 border-brand-primary border-t-brand-accent rounded-full animate-spin"></div>
      <p className="text-sm">Đang xử lý...</p>
    </div>
  );
};
