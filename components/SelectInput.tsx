
import React from 'react';

interface SelectInputProps {
    label: string;
    options: readonly string[];
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    disabled?: boolean;
    className?: string;
}

export const SelectInput: React.FC<SelectInputProps> = ({ label, options, value, onChange, disabled = false, className = '' }) => (
    <div className={className}>
        <label className="block text-[10px] uppercase font-bold text-brand-text-muted mb-1.5 tracking-wider">{label}</label>
        <div className="relative">
            <select 
                value={value} 
                onChange={onChange} 
                disabled={disabled} 
                className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent/50 transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/30"
            >
                {options.map(opt => <option key={opt} value={opt} className="bg-slate-900 text-brand-text">{opt}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-brand-text-muted">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
        </div>
    </div>
);
