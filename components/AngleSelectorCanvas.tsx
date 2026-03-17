import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ImageFile } from '../types';

interface AngleSelectorCanvasProps {
  imageFile: ImageFile | null;
  onDirectionChange: (direction: { start: { x: number, y: number }, end: { x: number, y: number } } | null) => void;
}

export const AngleSelectorCanvas: React.FC<AngleSelectorCanvasProps> = ({ imageFile, onDirectionChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [points, setPoints] = useState<{ x: number, y: number }[]>([]);

  useEffect(() => {
    if (imageFile) {
      const image = new Image();
      image.src = imageFile.base64;
      image.onload = () => setImg(image);
      setPoints([]);
      onDirectionChange(null);
    } else {
      setImg(null);
      setPoints([]);
    }
  }, [imageFile, onDirectionChange]);

  const getRenderParameters = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return null;

    const hRatio = canvas.width / img.width;
    const vRatio = canvas.height / img.height;
    const ratio = Math.min(hRatio, vRatio);
    const centerShiftX = (canvas.width - img.width * ratio) / 2;
    const centerShiftY = (canvas.height - img.height * ratio) / 2;
    
    return { ratio, centerShiftX, centerShiftY };
  }, [img]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const renderParams = getRenderParameters();

    if (img && renderParams) {
      ctx.drawImage(img, 0, 0, img.width, img.height, renderParams.centerShiftX, renderParams.centerShiftY, img.width * renderParams.ratio, img.height * renderParams.ratio);
    } else {
      ctx.fillStyle = '#16213e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#a0a0a0';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '14px sans-serif';
      ctx.fillText('Tải ảnh Mặt bằng tổng thể ở mục 1 để vẽ góc nhìn', canvas.width / 2, canvas.height / 2);
      return;
    }

    if (points.length > 0) {
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(83, 114, 240, 0.8)';
      ctx.fill();
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.fillStyle = '#e0e0e0';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('1', points[0].x, points[0].y);
    }
    if (points.length > 1) {
      ctx.beginPath();
      ctx.arc(points[1].x, points[1].y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(233, 69, 96, 0.8)';
      ctx.fill();
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.fillStyle = '#e0e0e0';
      ctx.fillText('2', points[1].x, points[1].y);

      const headlen = 15;
      const dx = points[1].x - points[0].x;
      const dy = points[1].y - points[0].y;
      const angle = Math.atan2(dy, dx);
      
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(points[1].x, points[1].y);
      ctx.lineTo(points[1].x - headlen * Math.cos(angle - Math.PI / 6), points[1].y - headlen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(points[1].x, points[1].y);
      ctx.lineTo(points[1].x - headlen * Math.cos(angle + Math.PI / 6), points[1].y - headlen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    }
  }, [img, points, getRenderParameters]);

  useEffect(() => {
    draw();
  }, [draw]);
  
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const renderParams = getRenderParameters();
    if (!canvas || !img || !renderParams) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const newPoints = [...points, { x, y }];
    if (newPoints.length > 2) {
      setPoints([{ x, y }]);
      onDirectionChange(null);
    } else {
      setPoints(newPoints);
      if (newPoints.length === 2) {
          const normalize = (p: {x:number, y:number}) => ({
              x: (p.x - renderParams.centerShiftX) / (img.width * renderParams.ratio),
              y: (p.y - renderParams.centerShiftY) / (img.height * renderParams.ratio)
          });

          const start = normalize(newPoints[0]);
          const end = normalize(newPoints[1]);
          const clamp = (val: number) => Math.max(0, Math.min(1, val));
          
          onDirectionChange({
              start: { x: clamp(start.x), y: clamp(start.y) },
              end: { x: clamp(end.x), y: clamp(end.y) }
          });
      }
    }
  };

  const handleClear = () => {
    setPoints([]);
    onDirectionChange(null);
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={500}
        height={300}
        onClick={handleClick}
        className="w-full bg-brand-bg rounded-lg cursor-crosshair border border-brand-primary/50"
      />
      <div className="flex justify-end">
        <button onClick={handleClear} className="text-xs bg-brand-primary hover:bg-brand-accent px-3 py-1.5 rounded-md transition-colors disabled:opacity-50" disabled={points.length === 0}>
            Xoá hướng nhìn
        </button>
      </div>
    </div>
  );
};