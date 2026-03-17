import React, { useState } from 'react';

interface ImageComparatorProps {
  before: string;
  after: string;
}

export const ImageComparator: React.FC<ImageComparatorProps> = ({ before, after }) => {
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none group/comparator">
      {/* Before Image (base layer, right side) */}
      <img
        src={before}
        alt="Before"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />
       <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded z-10 pointer-events-none">
        Ảnh Gốc
      </div>

      {/* After Image (clipped layer, left side) */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
        style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
      >
        <img
          src={after}
          alt="After"
          className="w-full h-full object-contain"
        />
        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded z-10 pointer-events-none">
            Kết Quả
        </div>
      </div>
      
      {/* Slider */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white/70 cursor-ew-resize opacity-50 group-hover/comparator:opacity-100 transition-opacity"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -left-3.5 bg-white/70 p-1 rounded-full backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </div>
         <div className="absolute top-1/2 -translate-y-1/2 -right-3.5 bg-white/70 p-1 rounded-full backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPosition}
        onChange={handleSliderChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
        aria-label="Image comparison slider"
      />
    </div>
  );
};