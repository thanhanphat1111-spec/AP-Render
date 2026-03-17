
import React, { useState, useEffect } from 'react';
import { MODEL_STORAGE_KEY } from '../constants';

const Logo: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="24" fill="url(#paint0_linear_1_2)"/>
    <path d="M25 75V35L50 25L75 35V75L50 85L25 75Z" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M25 35L50 45L75 35" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M50 85V45" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="paint0_linear_1_2" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366f1"/>
        <stop offset="1" stopColor="#ec4899"/>
      </linearGradient>
    </defs>
  </svg>
);


export const Header: React.FC = () => {
  const [hasKey, setHasKey] = useState(true);
  const [modelType, setModelType] = useState('free');

  useEffect(() => {
    const checkKey = async () => {
        if (window.aistudio?.hasSelectedApiKey) {
            const selected = await window.aistudio.hasSelectedApiKey();
            setHasKey(selected);
        }
    };
    checkKey();

    const storedModel = localStorage.getItem(MODEL_STORAGE_KEY);
    if (storedModel) {
        setModelType(storedModel);
    } else {
        localStorage.setItem(MODEL_STORAGE_KEY, 'free');
    }
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
        await window.aistudio.openSelectKey();
        setHasKey(true);
    } else {
        alert("Tính năng chọn API Key chỉ khả dụng trong môi trường AI Studio hoặc bạn cần cấu hình biến môi trường API_KEY.");
    }
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setModelType(val);
      localStorage.setItem(MODEL_STORAGE_KEY, val);
  };

  return (
    <header className="bg-slate-900/60 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Logo />
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">AP Render</h1>
        </div>
        <div className="flex items-center gap-3">
             <div className="relative">
                <select
                    value={modelType}
                    onChange={handleModelChange}
                    className="appearance-none bg-white/5 border border-white/10 text-xs font-medium text-brand-text rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-brand-accent hover:bg-white/10 transition-colors cursor-pointer"
                >
                    <option value="free" className="bg-slate-900">🍌 NanoBanana Free</option>
                    <option value="pro" className="bg-slate-900">🍌 NanoBanana Pro</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-brand-text-muted">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
             </div>

             {!hasKey && (
                <button onClick={handleSelectKey} className="text-xs bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 px-3 py-1.5 rounded-lg font-semibold transition-colors animate-pulse">
                    ⚠ Chọn API Key
                </button>
             )}
            <button onClick={handleSelectKey} className="text-xs text-brand-text-muted hover:text-white transition-colors border border-white/10 bg-white/5 px-3 py-1.5 rounded-lg hover:bg-white/10">
                Đổi API Key
            </button>
        </div>
      </div>
    </header>
  );
};
