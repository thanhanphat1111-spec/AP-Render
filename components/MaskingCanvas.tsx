
import React, { useRef, useEffect, useState, useCallback, useId } from 'react';
import { ImageFile } from '../types';

// --- ICONS ---
const BrushIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>;
const EraserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 18.5l-8-8-4 4 8 8 4-4zM16 14.5l4-4"/><path d="M12.5 5.5l-4-4-8 8 4 4 1.5-1.5L14 10z"/></svg>;
const ClearIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>;
const UndoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 13v-3a2 2 0 0 0-2-2H7l-4 4 4 4h10a2 2 0 0 0 2-2z"/></svg>;
const PanIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><g fill="none" fillRule="evenodd"><path d="M18 11v5l-2-2.5 2-2.5zM6 11v5l2-2.5-2-2.5zM12 6v2.5l-2.5-2.5 2.5 2.5zM12 18v-2.5l-2.5 2.5 2.5-2.5zM12 6l2.5-2.5-2.5 2.5zM12 18l2.5 2.5-2.5-2.5zM18 11l2.5 2.5-2.5-2.5zM6 11l-2.5 2.5 2.5-2.5z"/><path d="M12 8v8M8 12h8"/></g></svg>;
const RectangleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>;
const CircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>;
const PolygonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l10 7-4 11H6L2 9z"/></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

type Tool = 'brush' | 'eraser' | 'pan' | 'rectangle' | 'circle' | 'polygon';

interface MaskingCanvasProps {
  initialImage?: ImageFile | null;
  onImageSelect: (imageFile: ImageFile | null) => void;
  onMaskChange: (maskFile: ImageFile | null) => void;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error("Invalid data URL");
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

export const MaskingCanvas: React.FC<MaskingCanvasProps> = ({ initialImage, onImageSelect, onMaskChange }) => {
    const imageCanvasRef = useRef<HTMLCanvasElement>(null);
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null); // This is the visible overlay
    const maskDataCanvasRef = useRef<HTMLCanvasElement | null>(null); // Offscreen canvas for mask data
    const containerRef = useRef<HTMLDivElement>(null);

    const [imageFile, setImageFile] = useState<ImageFile | null>(null);
    const [img, setImg] = useState<HTMLImageElement | null>(null);
    const [tool, setTool] = useState<Tool>('brush');
    const [brushSize, setBrushSize] = useState(40);
    const [history, setHistory] = useState<ImageData[]>([]);
    const [polygonPoints, setPolygonPoints] = useState<{x: number, y: number}[]>([]);
    
    // Refs for interaction state
    const isDrawing = useRef(false);
    const isPanning = useRef(false);
    const transform = useRef({ x: 0, y: 0, scale: 1 });
    const lastPanPoint = useRef({ x: 0, y: 0 });
    const lastDrawPoint = useRef<{x: number, y: number} | null>(null);
    const shapeStartPoint = useRef<{x: number, y: number} | null>(null);
    const currentMousePoint = useRef<{x: number, y: number} | null>(null);
    const uniqueId = useId();

    const draw = useCallback(() => {
        const imageCtx = imageCanvasRef.current?.getContext('2d');
        const drawingCtx = drawingCanvasRef.current?.getContext('2d');
        const maskDataCanvas = maskDataCanvasRef.current;
        if (!imageCtx || !drawingCtx) return;

        imageCtx.clearRect(0, 0, imageCtx.canvas.width, imageCtx.canvas.height);
        drawingCtx.clearRect(0, 0, drawingCtx.canvas.width, drawingCtx.canvas.height);

        if (img) {
            imageCtx.save();
            imageCtx.translate(transform.current.x, transform.current.y);
            imageCtx.scale(transform.current.scale, transform.current.scale);
            imageCtx.drawImage(img, 0, 0);
            imageCtx.restore();
            
            if (maskDataCanvas) {
                drawingCtx.save();
                drawingCtx.translate(transform.current.x, transform.current.y);
                drawingCtx.scale(transform.current.scale, transform.current.scale);
                drawingCtx.globalAlpha = 0.5;
                drawingCtx.drawImage(maskDataCanvas, 0, 0);
                drawingCtx.restore();
            }

            // --- Draw Previews ---
            drawingCtx.save();
            drawingCtx.translate(transform.current.x, transform.current.y);
            drawingCtx.scale(transform.current.scale, transform.current.scale);
            
            // Shape preview (rectangle/circle)
            if (isDrawing.current && shapeStartPoint.current && currentMousePoint.current && (tool === 'rectangle' || tool === 'circle')) {
                drawingCtx.fillStyle = 'rgba(233, 69, 96, 0.7)';
                if (tool === 'rectangle') {
                    const width = currentMousePoint.current.x - shapeStartPoint.current.x;
                    const height = currentMousePoint.current.y - shapeStartPoint.current.y;
                    drawingCtx.fillRect(shapeStartPoint.current.x, shapeStartPoint.current.y, width, height);
                } else { // Circle
                    const dx = currentMousePoint.current.x - shapeStartPoint.current.x;
                    const dy = currentMousePoint.current.y - shapeStartPoint.current.y;
                    const radius = Math.sqrt(dx * dx + dy * dy);
                    drawingCtx.beginPath();
                    drawingCtx.arc(shapeStartPoint.current.x, shapeStartPoint.current.y, radius, 0, 2 * Math.PI);
                    drawingCtx.fill();
                }
            }
            
            // Polygon preview
            if (tool === 'polygon' && polygonPoints.length > 0) {
                drawingCtx.strokeStyle = '#e94560';
                drawingCtx.lineWidth = 2 / transform.current.scale;
                drawingCtx.beginPath();
                drawingCtx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
                for (let i = 1; i < polygonPoints.length; i++) {
                    drawingCtx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
                }
                // Draw elastic line to current mouse position
                if (currentMousePoint.current) {
                    drawingCtx.lineTo(currentMousePoint.current.x, currentMousePoint.current.y);
                }
                drawingCtx.stroke();

                // Draw points
                drawingCtx.fillStyle = '#fff';
                for(const p of polygonPoints) {
                    drawingCtx.beginPath();
                    drawingCtx.arc(p.x, p.y, 3 / transform.current.scale, 0, Math.PI * 2);
                    drawingCtx.fill();
                }
            }

            drawingCtx.restore();
        }
    }, [img, tool, polygonPoints]);

    useEffect(() => {
        if(img) draw();
    }, [img, draw, history]);
    
    const updateMaskFile = useCallback(() => {
        const maskDataCanvas = maskDataCanvasRef.current;
        const maskCtx = maskDataCanvas?.getContext('2d');
        if (!maskDataCanvas || !maskCtx) {
            onMaskChange(null);
            return;
        }

        const maskImageData = maskCtx.getImageData(0, 0, maskDataCanvas.width, maskDataCanvas.height);
        const data = maskImageData.data;
        let hasDrawing = false;
        
        const finalMaskCanvas = document.createElement('canvas');
        finalMaskCanvas.width = maskDataCanvas.width;
        finalMaskCanvas.height = maskDataCanvas.height;
        const finalCtx = finalMaskCanvas.getContext('2d');
        if (!finalCtx) return;
        const finalImageData = finalCtx.createImageData(maskDataCanvas.width, maskDataCanvas.height);
        const finalData = finalImageData.data;

        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) {
                finalData[i] = 255; finalData[i + 1] = 255; finalData[i + 2] = 255; finalData[i + 3] = 255;
                hasDrawing = true;
            } else {
                finalData[i] = 0; finalData[i + 1] = 0; finalData[i + 2] = 0; finalData[i + 3] = 255;
            }
        }
        
        if (!hasDrawing) {
            onMaskChange(null);
            return;
        }

        finalCtx.putImageData(finalImageData, 0, 0);
        const base64 = finalMaskCanvas.toDataURL('image/png');
        const file = dataURLtoFile(base64, 'mask.png');
        onMaskChange({ file, base64, url: base64 });
    }, [onMaskChange]);

    const saveHistory = useCallback(() => {
        const maskCtx = maskDataCanvasRef.current?.getContext('2d');
        if (!maskCtx) return;
        const imageData = maskCtx.getImageData(0, 0, maskCtx.canvas.width, maskCtx.canvas.height);
        setHistory(prev => [...prev, imageData].slice(-10));
    }, []);

    const handleUndo = useCallback(() => {
        if (history.length <= 1) return;
        
        const newHistory = history.slice(0, -1);
        const lastState = newHistory[newHistory.length - 1];
        const maskCtx = maskDataCanvasRef.current?.getContext('2d');

        if (maskCtx && lastState) {
            maskCtx.clearRect(0, 0, maskCtx.canvas.width, maskCtx.canvas.height);
            maskCtx.putImageData(lastState, 0, 0);
            setHistory(newHistory);
            updateMaskFile();
        }
    }, [history, updateMaskFile]);

    const handleClear = useCallback(() => {
        const maskCtx = maskDataCanvasRef.current?.getContext('2d');
        if (!maskCtx) return;
        maskCtx.clearRect(0, 0, maskCtx.canvas.width, maskCtx.canvas.height);
        setHistory([maskCtx.getImageData(0, 0, maskCtx.canvas.width, maskCtx.canvas.height)]);
        onMaskChange(null);
        setPolygonPoints([]);
    }, [onMaskChange]);
    
    const setupCanvasWithImage = useCallback((imageSource: HTMLImageElement) => {
      const container = containerRef.current;
      const imageCanvas = imageCanvasRef.current;
      const drawingCanvas = drawingCanvasRef.current;
      if (!container || !imageCanvas || !drawingCanvas) return;

      const w = container.clientWidth;
      const h = container.clientHeight;
      imageCanvas.width = w;
      imageCanvas.height = h;
      drawingCanvas.width = w;
      drawingCanvas.height = h;

      if (!maskDataCanvasRef.current) {
        maskDataCanvasRef.current = document.createElement('canvas');
      }
      maskDataCanvasRef.current.width = imageSource.naturalWidth;
      maskDataCanvasRef.current.height = imageSource.naturalHeight;

      const scale = Math.min(w / imageSource.naturalWidth, h / imageSource.naturalHeight);
      const x = (w - imageSource.naturalWidth * scale) / 2;
      const y = (h - imageSource.naturalHeight * scale) / 2;

      transform.current = { x, y, scale };
      setImg(imageSource);
      const maskCtx = maskDataCanvasRef.current.getContext('2d');
      if (maskCtx) {
        maskCtx.clearRect(0, 0, imageSource.naturalWidth, imageSource.naturalHeight);
        setHistory([maskCtx.getImageData(0, 0, imageSource.naturalWidth, imageSource.naturalHeight)]);
      }
    }, []);

    const handleClearImage = useCallback(() => {
        const imageCanvas = imageCanvasRef.current;
        const drawingCanvas = drawingCanvasRef.current;
        if (imageCanvas) imageCanvas.getContext('2d')?.clearRect(0,0,imageCanvas.width, imageCanvas.height);
        if (drawingCanvas) drawingCanvas.getContext('2d')?.clearRect(0,0,drawingCanvas.width, drawingCanvas.height);

        setImageFile(null);
        setImg(null);
        setHistory([]);
        setPolygonPoints([]);
        onImageSelect(null);
        onMaskChange(null);
        transform.current = { x: 0, y: 0, scale: 1 };
    }, [onImageSelect, onMaskChange]);

    useEffect(() => {
      if (initialImage && initialImage.base64 !== imageFile?.base64) {
        const image = new Image();
        image.onload = () => {
          setupCanvasWithImage(image);
          setImageFile(initialImage); 
          onMaskChange(null);
        };
        image.src = initialImage.base64;
      }
    }, [initialImage, imageFile, onMaskChange, setupCanvasWithImage]);
    
    const handleFileChange = useCallback(async (file: File | null) => {
        if (file && ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
            const base64 = await fileToBase64(file);
            const image = new Image();
            image.onload = () => {
                const imageFileData: ImageFile = { file, base64, url: image.src, width: image.naturalWidth, height: image.naturalHeight };
                setImageFile(imageFileData);
                onImageSelect(imageFileData);
                setupCanvasWithImage(image);
                onMaskChange(null);
            };
            image.src = base64;
        } else {
            handleClearImage();
            if (file) alert('Invalid file type. Please use PNG, JPG, or WEBP.');
        }
    }, [onImageSelect, onMaskChange, setupCanvasWithImage, handleClearImage]);
    
    const getTransformedPoint = useCallback((clientX: number, clientY: number) => {
        const rect = imageCanvasRef.current!.getBoundingClientRect();
        return {
            x: (clientX - rect.left - transform.current.x) / transform.current.scale,
            y: (clientY - rect.top - transform.current.y) / transform.current.scale
        };
    }, []);

    const handleFinishPolygon = useCallback(() => {
        const maskCtx = maskDataCanvasRef.current?.getContext('2d');
        if (!maskCtx || polygonPoints.length < 3) return;
        saveHistory();
        maskCtx.fillStyle = '#e94560';
        maskCtx.beginPath();
        maskCtx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
        for(let i = 1; i < polygonPoints.length; i++) {
            maskCtx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
        }
        maskCtx.closePath();
        maskCtx.fill();
        setPolygonPoints([]);
        updateMaskFile();
    }, [polygonPoints, saveHistory, updateMaskFile]);

    // Listen for Enter key to finish polygon
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && tool === 'polygon' && polygonPoints.length >= 3) {
                handleFinishPolygon();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [tool, polygonPoints, handleFinishPolygon]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!img) return;
        if (tool === 'pan') {
            isPanning.current = true;
            lastPanPoint.current = { x: e.clientX, y: e.clientY };
        } else if (['brush', 'eraser', 'rectangle', 'circle'].includes(tool)) {
            isDrawing.current = true;
            const point = getTransformedPoint(e.clientX, e.clientY);
            if (tool === 'brush' || tool === 'eraser') {
                lastDrawPoint.current = point;
                saveHistory();
            } else {
                shapeStartPoint.current = point;
            }
        }
    }, [img, tool, getTransformedPoint, saveHistory]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!img) return;
        const point = getTransformedPoint(e.clientX, e.clientY);
        currentMousePoint.current = point;

        if (isPanning.current) {
            const dx = e.clientX - lastPanPoint.current.x;
            const dy = e.clientY - lastPanPoint.current.y;
            transform.current.x += dx;
            transform.current.y += dy;
            lastPanPoint.current = { x: e.clientX, y: e.clientY };
            draw();
        } else if (isDrawing.current) {
            if (tool === 'brush' || tool === 'eraser') {
                const maskCtx = maskDataCanvasRef.current?.getContext('2d');
                if (!maskCtx || !lastDrawPoint.current) return;
                
                maskCtx.save();
                maskCtx.lineCap = 'round';
                maskCtx.lineJoin = 'round';
                maskCtx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
                maskCtx.strokeStyle = tool === 'brush' ? '#e94560' : 'rgba(0,0,0,1)';
                maskCtx.lineWidth = brushSize / transform.current.scale;
                
                maskCtx.beginPath();
                maskCtx.moveTo(lastDrawPoint.current.x, lastDrawPoint.current.y);
                maskCtx.lineTo(point.x, point.y);
                maskCtx.stroke();
                maskCtx.restore();

                lastDrawPoint.current = point;
            }
            draw();
        } else if (tool === 'polygon' && polygonPoints.length > 0) {
            draw(); // Redraw to update the elastic line
        }
    }, [img, tool, brushSize, getTransformedPoint, draw, polygonPoints]);

    const handleMouseUp = useCallback(() => {
        if (isDrawing.current) {
            const maskCtx = maskDataCanvasRef.current?.getContext('2d');
            if (maskCtx && shapeStartPoint.current && currentMousePoint.current) {
                saveHistory();
                maskCtx.fillStyle = '#e94560';
                if (tool === 'rectangle') {
                    const width = currentMousePoint.current.x - shapeStartPoint.current.x;
                    const height = currentMousePoint.current.y - shapeStartPoint.current.y;
                    maskCtx.fillRect(shapeStartPoint.current.x, shapeStartPoint.current.y, width, height);
                } else if (tool === 'circle') {
                    const dx = currentMousePoint.current.x - shapeStartPoint.current.x;
                    const dy = currentMousePoint.current.y - shapeStartPoint.current.y;
                    const radius = Math.sqrt(dx * dx + dy * dy);
                    maskCtx.beginPath();
                    maskCtx.arc(shapeStartPoint.current.x, shapeStartPoint.current.y, radius, 0, 2 * Math.PI);
                    maskCtx.fill();
                }
            }
            updateMaskFile();
        }
        isDrawing.current = false;
        isPanning.current = false;
        lastDrawPoint.current = null;
        shapeStartPoint.current = null;
        draw();
    }, [tool, updateMaskFile, saveHistory, draw]);

    const handleCanvasClick = useCallback((e: React.MouseEvent) => {
        if (img && tool === 'polygon') {
            const point = getTransformedPoint(e.clientX, e.clientY);
            
            // Check if clicking near the start point to close the polygon
            if (polygonPoints.length >= 2) {
                const start = polygonPoints[0];
                const dist = Math.hypot(point.x - start.x, point.y - start.y);
                // 10px threshold scaled
                if (dist < 10 / transform.current.scale) {
                    handleFinishPolygon();
                    return;
                }
            }
            
            setPolygonPoints(prev => [...prev, point]);
        }
    }, [img, tool, getTransformedPoint, polygonPoints, handleFinishPolygon]);
    
    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (!img) return;
        e.preventDefault();
        const rect = imageCanvasRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomFactor = 1.1;
        const scale = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;
        
        transform.current.x = mouseX - (mouseX - transform.current.x) * scale;
        transform.current.y = mouseY - (mouseY - transform.current.y) * scale;
        transform.current.scale *= scale;
        draw();
    }, [img, draw]);

    const cursorClass = !img ? 'cursor-default' : tool === 'pan' ? (isPanning.current ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair';

    return (
        <div>
            <div 
                ref={containerRef} 
                className={`relative w-full h-96 bg-brand-bg/50 border-2 border-dashed border-brand-primary/80 rounded-xl overflow-hidden ${cursorClass}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onClick={handleCanvasClick}
            >
                {!img && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                        <input type="file" id={uniqueId} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} />
                        <label htmlFor={uniqueId} className="cursor-pointer text-center">
                            <svg className="w-12 h-12 text-brand-text-muted mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                            <p className="text-sm text-brand-text-muted">Tải ảnh gốc cần chỉnh sửa</p>
                            <span className="text-xs text-brand-text-muted mt-1">PNG, JPG, WEBP</span>
                        </label>
                    </div>
                )}
                {img && (
                    <button onClick={handleClearImage} title="Xoá ảnh" className="absolute top-2 right-2 p-1.5 rounded-full bg-brand-surface/80 hover:bg-brand-secondary text-white transition-colors z-10">
                        <CloseIcon />
                    </button>
                )}
                <canvas ref={imageCanvasRef} className="absolute top-0 left-0 pointer-events-none" />
                <canvas ref={drawingCanvasRef} className="absolute top-0 left-0 pointer-events-none" />
            </div>
            {img && (
                 <div className="flex flex-wrap items-center justify-between gap-2 mt-2 p-2 bg-brand-surface rounded-lg">
                    <div className="flex items-center gap-1">
                         <button onClick={() => setTool('brush')} className={`p-2 rounded-md ${tool === 'brush' ? 'bg-brand-accent' : 'bg-brand-primary'}`} title="Cọ vẽ"><BrushIcon /></button>
                         <button onClick={() => setTool('rectangle')} className={`p-2 rounded-md ${tool === 'rectangle' ? 'bg-brand-accent' : 'bg-brand-primary'}`} title="Hình chữ nhật"><RectangleIcon /></button>
                         <button onClick={() => setTool('circle')} className={`p-2 rounded-md ${tool === 'circle' ? 'bg-brand-accent' : 'bg-brand-primary'}`} title="Hình tròn"><CircleIcon /></button>
                         <button onClick={() => setTool('polygon')} className={`p-2 rounded-md ${tool === 'polygon' ? 'bg-brand-accent' : 'bg-brand-primary'}`} title="Đa giác (Click để chấm điểm, Enter để xong)"><PolygonIcon /></button>
                         <button onClick={() => setTool('eraser')} className={`p-2 rounded-md ${tool === 'eraser' ? 'bg-brand-accent' : 'bg-brand-primary'}`} title="Tẩy"><EraserIcon /></button>
                         <button onClick={() => setTool('pan')} className={`p-2 rounded-md ${tool === 'pan' ? 'bg-brand-accent' : 'bg-brand-primary'}`} title="Di chuyển"><PanIcon /></button>
                         <button onClick={handleUndo} className="p-2 rounded-md bg-brand-primary" title="Hoàn tác"><UndoIcon /></button>
                         <button onClick={handleClear} className="p-2 rounded-md bg-brand-primary" title="Xóa hết"><ClearIcon /></button>
                    </div>
                    {tool === 'polygon' && polygonPoints.length > 0 && (
                        <div className="flex items-center gap-2">
                           <button onClick={handleFinishPolygon} className="text-xs bg-green-600 hover:bg-green-500 px-2 py-1 rounded">Hoàn thành (Enter)</button>
                           <button onClick={() => setPolygonPoints([])} className="text-xs bg-red-600 hover:bg-red-500 px-2 py-1 rounded">Huỷ</button>
                        </div>
                    )}
                     {(tool === 'brush' || tool === 'eraser') && (
                        <div className="flex items-center gap-2">
                            <label htmlFor="brushSize" className="text-xs">Cỡ cọ:</label>
                            <input
                                type="range"
                                id="brushSize"
                                min="5"
                                max="150"
                                value={brushSize}
                                onChange={e => setBrushSize(Number(e.target.value))}
                                className="w-24"
                            />
                            <span className="text-xs font-mono w-8 text-center">{brushSize}</span>
                        </div>
                     )}
                </div>
            )}
        </div>
    );
};
