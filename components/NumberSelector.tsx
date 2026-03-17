
import React from 'react';

interface NumberSelectorProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  className?: string;
  min?: number;
  max?: number;
}

export const NumberSelector: React.FC<NumberSelectorProps> = ({ value, onChange, label, className = '', min = 1, max = 4 }) => {
  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let num = parseInt(e.target.value, 10);
    if (isNaN(num)) num = min;
    if (num < min) num = min;
    if (num > max) num = max;
    onChange(num);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-brand-text-muted mb-2">{label}</label>
      <div className="flex items-center gap-2 p-1 bg-black/20 rounded-xl border border-white/10 w-fit">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="w-8 h-8 flex items-center justify-center text-lg font-bold rounded-lg transition-colors bg-white/5 text-brand-text-muted hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Decrement"
        >
          -
        </button>
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          className="w-12 h-8 text-center font-semibold bg-transparent border-none text-brand-text focus:outline-none focus:ring-0"
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="w-8 h-8 flex items-center justify-center text-lg font-bold rounded-lg transition-colors bg-white/5 text-brand-text-muted hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Increment"
        >
          +
        </button>
      </div>
    </div>
  );
};
