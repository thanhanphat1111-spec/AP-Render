
import React, { useState, useRef, useEffect } from 'react';

interface DownloadDialogProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const PAPER_SIZES: Record<string, { w: number, h: number, label: string }> = {
    'custom': { w: 0, h: 0, label: 'Custom' },
    'original': { w: 0, h: 0, label: 'Original Size' },
    'a4': { w: 210, h: 297, label: 'A4 (210 x 297 mm)' },
    'a3': { w: 297, h: 420, label: 'A3 (297 x 420 mm)' },
    'a2': { w: 420, h: 594, label: 'A2 (420 x 594 mm)' },
    'a1': { w: 594, h: 841, label: 'A1 (594 x 841 mm)' },
};

export const DownloadDialog: React.FC<DownloadDialogProps> = ({ imageUrl, isOpen, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [img, setImg] = useState<HTMLImageElement | null>(null);
    
    // Image & Print Settings
    const [fitTo, setFitTo] = useState('original');
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [resolution, setResolution] = useState(300); // DPI
    const [resample, setResample] = useState(true);
    const [linked, setLinked] = useState(true);
    const [fileSize, setFileSize] = useState('0.0M');

    // Crop State (normalized 0-1)
    const [crop, setCrop] = useState({ x: 0, y: 0, w: 1, h: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const previewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && imageUrl) {
            const image = new Image();
            image.src = imageUrl;
            image.onload = () => {
                setImg(image);
                setWidth(image.naturalWidth);
                setHeight(image.naturalHeight);
                calculateFileSize(image.naturalWidth, image.naturalHeight);
            };
        }
    }, [isOpen, imageUrl]);

    const calculateFileSize = (w: number, h: number) => {
        // Approx size for uncompressed bitmap in memory or high quality jpeg
        const pixels = w * h;
        const bytes = pixels * 3; // RGB
        setFileSize((bytes / 1024 / 1024).toFixed(1) + 'M');
    };

    const handleFitToChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const mode = e.target.value;
        setFitTo(mode);
        
        if (mode === 'original' && img) {
            setWidth(img.naturalWidth);
            setHeight(img.naturalHeight);
            setResolution(72); // Screen default
            calculateFileSize(img.naturalWidth, img.naturalHeight);
            setCrop({ x: 0, y: 0, w: 1, h: 1 });
        } else if (mode !== 'custom') {
            // Paper sizes (mm -> px at current DPI)
            const paper = PAPER_SIZES[mode];
            const wPx = Math.round((paper.w / 25.4) * resolution);
            const hPx = Math.round((paper.h / 25.4) * resolution);
            setWidth(wPx);
            setHeight(hPx);
            calculateFileSize(wPx, hPx);
            
            // Adjust crop aspect ratio
            if (img) {
                const imgAspect = img.naturalWidth / img.naturalHeight;
                const paperAspect = wPx / hPx;
                
                if (imgAspect > paperAspect) {
                    // Image is wider than paper -> Fit height, crop width
                    const wNorm = paperAspect / imgAspect;
                    setCrop({ x: (1 - wNorm)/2, y: 0, w: wNorm, h: 1 });
                } else {
                    // Image is taller -> Fit width, crop height
                    const hNorm = imgAspect / paperAspect;
                    setCrop({ x: 0, y: (1 - hNorm)/2, w: 1, h: hNorm });
                }
            }
        }
    };

    const handleDimensionChange = (key: 'w' | 'h', val: string) => {
        let v = parseInt(val, 10);
        if (isNaN(v)) v = 0;
        
        setFitTo('custom');
        
        if (key === 'w') {
            setWidth(v);
            if (linked && width > 0) {
                const ratio = height / width;
                setHeight(Math.round(v * ratio));
            }
        } else {
            setHeight(v);
            if (linked && height > 0) {
                const ratio = width / height;
                setWidth(Math.round(v * ratio));
            }
        }
        calculateFileSize(v, height); // Approx update
    };

    const handleDpiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dpi = parseInt(e.target.value, 10) || 72;
        setResolution(dpi);
        
        // If standard paper size selected, update pixel dimensions
        if (fitTo !== 'custom' && fitTo !== 'original') {
            const paper = PAPER_SIZES[fitTo];
            const wPx = Math.round((paper.w / 25.4) * dpi);
            const hPx = Math.round((paper.h / 25.4) * dpi);
            setWidth(wPx);
            setHeight(hPx);
            calculateFileSize(wPx, hPx);
        }
    };

    const handleDownload = () => {
        if (!img) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
            // Source coords
            const sx = crop.x * img.naturalWidth;
            const sy = crop.y * img.naturalHeight;
            const sw = crop.w * img.naturalWidth;
            const sh = crop.h * img.naturalHeight;
            
            // Destination coords (full canvas)
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
            
            const link = document.createElement('a');
            link.download = `export-${fitTo}-${width}x${height}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.9);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        onClose();
    };

    // Crop Interaction
    const handleMouseDown = (e: React.MouseEvent) => {
        if (fitTo === 'original') return;
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !previewRef.current) return;
        
        const rect = previewRef.current.getBoundingClientRect();
        const dxPx = e.clientX - dragStart.x;
        const dyPx = e.clientY - dragStart.y;
        
        const dxNorm = dxPx / rect.width;
        const dyNorm = dyPx / rect.height;
        
        let newX = crop.x + dxNorm;
        let newY = crop.y + dyNorm;
        
        // Clamp
        newX = Math.max(0, Math.min(1 - crop.w, newX));
        newY = Math.max(0, Math.min(1 - crop.h, newY));
        
        setCrop(prev => ({ ...prev, x: newX, y: newY }));
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#3d3d3d] w-[900px] h-[600px] max-h-full rounded shadow-2xl flex overflow-hidden text-[#dcdcdc] font-sans text-xs">
                
                {/* Left: Preview Area */}
                <div className="flex-grow bg-[#2b2b2b] flex items-center justify-center relative overflow-hidden p-4"
                     onMouseMove={handleMouseMove}
                     onMouseUp={handleMouseUp}
                     onMouseLeave={handleMouseUp}
                >
                    {img && (
                        <div 
                            ref={previewRef}
                            className="relative shadow-lg border border-black"
                            style={{ 
                                aspectRatio: `${img.naturalWidth}/${img.naturalHeight}`,
                                maxHeight: '100%',
                                maxWidth: '100%'
                            }}
                        >
                            <img src={img.src} className="w-full h-full object-contain pointer-events-none opacity-50" />
                            
                            {/* Crop Overlay */}
                            <div 
                                className="absolute border-2 border-white bg-transparent cursor-move"
                                style={{
                                    left: `${crop.x * 100}%`,
                                    top: `${crop.y * 100}%`,
                                    width: `${crop.w * 100}%`,
                                    height: `${crop.h * 100}%`,
                                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                                    outline: '1px dashed #333'
                                }}
                                onMouseDown={handleMouseDown}
                            >
                                {/* Grid Lines */}
                                <div className="absolute top-1/3 left-0 w-full h-px bg-white/30"></div>
                                <div className="absolute top-2/3 left-0 w-full h-px bg-white/30"></div>
                                <div className="absolute left-1/3 top-0 w-px h-full bg-white/30"></div>
                                <div className="absolute left-2/3 top-0 w-px h-full bg-white/30"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Settings Sidebar */}
                <div className="w-72 bg-[#535353] flex flex-col border-l border-[#2b2b2b]">
                    <div className="p-2 border-b border-[#444] flex justify-between items-center bg-[#444]">
                        <span className="font-bold">Image Size</span>
                        <button onClick={onClose} className="hover:text-white text-lg leading-none">&times;</button>
                    </div>
                    
                    <div className="p-4 space-y-4 overflow-y-auto flex-grow">
                        
                        <div className="flex justify-between items-baseline text-[#a0a0a0]">
                            <span>Image Size:</span>
                            <span>{fileSize}</span>
                        </div>

                        <div className="border-t border-[#666] my-2"></div>

                        <div>
                            <label className="block mb-1">Dimensions:</label>
                            <div className="flex items-center gap-2 text-[#a0a0a0]">
                                <select 
                                    className="bg-[#3d3d3d] border border-[#222] rounded px-2 py-1 w-full"
                                    value="px"
                                    disabled
                                >
                                    <option value="px">Pixels</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1">Fit To:</label>
                            <select 
                                className="w-full bg-[#3d3d3d] border border-[#222] rounded px-2 py-1 text-white"
                                value={fitTo}
                                onChange={handleFitToChange}
                            >
                                <option value="original">Original Size</option>
                                <option value="custom">Custom</option>
                                <option disabled>--- Paper Sizes ---</option>
                                <option value="a4">A4</option>
                                <option value="a3">A3</option>
                                <option value="a2">A2</option>
                                <option value="a1">A1</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex-grow">
                                <label className="block mb-1">Width:</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-[#3d3d3d] border border-[#222] rounded px-2 py-1 text-right"
                                    value={width}
                                    onChange={(e) => handleDimensionChange('w', e.target.value)}
                                />
                            </div>
                            <div className="w-16 pt-5">Pixels</div>
                        </div>

                        <div className="flex items-center gap-2 relative">
                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-8 border-l-2 border-t-2 border-b-2 border-[#888] w-2 rounded-l"></div>
                            <button 
                                onClick={() => setLinked(!linked)}
                                className={`absolute -left-5 top-1/2 -translate-y-1/2 bg-[#535353] p-0.5 ${linked ? 'text-white' : 'text-[#888]'}`}
                            >
                                🔗
                            </button>
                            <div className="flex-grow">
                                <label className="block mb-1">Height:</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-[#3d3d3d] border border-[#222] rounded px-2 py-1 text-right"
                                    value={height}
                                    onChange={(e) => handleDimensionChange('h', e.target.value)}
                                />
                            </div>
                            <div className="w-16 pt-5">Pixels</div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex-grow">
                                <label className="block mb-1">Resolution:</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-[#3d3d3d] border border-[#222] rounded px-2 py-1 text-right"
                                    value={resolution}
                                    onChange={handleDpiChange}
                                />
                            </div>
                            <div className="w-16 pt-5">Pixels/Inch</div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input 
                                type="checkbox" 
                                id="resample" 
                                checked={resample} 
                                onChange={(e) => setResample(e.target.checked)} 
                            />
                            <label htmlFor="resample">Resample Image</label>
                            <span className="ml-auto text-[#888]">Automatic</span>
                        </div>

                    </div>

                    <div className="p-4 border-t border-[#444] flex justify-end gap-3 bg-[#444]">
                        <button 
                            onClick={onClose}
                            className="px-4 py-1.5 rounded border border-[#666] hover:bg-[#555] transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleDownload}
                            className="px-4 py-1.5 rounded bg-[#4a4a4a] border border-[#666] hover:bg-[#666] text-white transition-colors shadow-inner"
                        >
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
