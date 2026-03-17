
import React, { useState, useRef, useEffect } from 'react';
import { ImageFile, AiServiceResult } from '../types';
import { editImage } from '../services/aiService';
import { ImageUploader } from './ImageUploader';
import { Icon } from './icons';
import { NumberSelector } from './NumberSelector';

interface AnnotationEditorProps {
    initialImage: ImageFile | null;
    onImageChange?: (image: ImageFile | null) => void;
    onResult: (result: AiServiceResult) => void;
    setLoading: (loading: boolean) => void;
}

const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error("Invalid data URL");
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
};

type Tool = 'rect' | 'arrow' | 'text';
interface Annotation {
    id: string; 
    type: Tool;
    color: string;
    x?: number; y?: number; w?: number; h?: number; // Rect
    x1?: number; y1?: number; x2?: number; y2?: number; // Arrow
    text?: string; // Text
    lineWidth?: number;
}

export const AnnotationEditor: React.FC<AnnotationEditorProps> = ({ initialImage, onImageChange, onResult, setLoading }) => {
    const [image, setImage] = useState<ImageFile | null>(initialImage || null);
    const [isOpen, setIsOpen] = useState(false);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [numberOfImages, setNumberOfImages] = useState(1);
    
    // Editor State
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [activeTool, setActiveTool] = useState<Tool>('arrow');
    const [color, setColor] = useState('#ff0000');
    const [lineWidth, setLineWidth] = useState(4);
    
    // Interaction State
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({x:0, y:0});
    const [currentPos, setCurrentPos] = useState({x:0, y:0});
    
    // Dragging State for Text
    const [isDraggingText, setIsDraggingText] = useState(false);
    const [draggedTextId, setDraggedTextId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({x: 0, y: 0});

    // Text Input State
    const [textInput, setTextInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [textPos, setTextPos] = useState({x:0, y:0});
    const [editingId, setEditingId] = useState<string | null>(null);

    // Sync prop
    useEffect(() => {
        if(initialImage) setImage(initialImage);
    }, [initialImage]);

    const handleImageUpdate = (newImage: ImageFile | null) => {
        setImage(newImage);
        if (onImageChange) onImageChange(newImage);
    };

    // Draw Function
    const redraw = () => {
        const cvs = canvasRef.current;
        if(!cvs || !image) return;
        const ctx = cvs.getContext('2d');
        if(!ctx) return;
        
        // Clear
        ctx.clearRect(0,0,cvs.width, cvs.height);
        
        // Background Image
        const img = new Image();
        img.src = image.base64.includes(',') ? image.base64 : `data:${image.file.type};base64,${image.base64}`;
        
        if (img.complete && img.naturalWidth > 0) {
             ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
        } else {
            img.onload = () => ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
        }
        
        // Existing Annotations
        const drawItem = (a: Annotation) => {
            ctx.strokeStyle = a.color;
            ctx.fillStyle = a.color;
            ctx.lineWidth = a.lineWidth || 3;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            
            ctx.font = 'bold 24px Arial'; 
            ctx.textBaseline = 'top';

            ctx.beginPath();
            
            if (a.type === 'rect') {
                ctx.strokeRect(a.x!, a.y!, a.w!, a.h!);
                ctx.save();
                ctx.globalAlpha = 0.1;
                ctx.fillStyle = a.color;
                ctx.fillRect(a.x!, a.y!, a.w!, a.h!);
                ctx.restore();
            } else if (a.type === 'arrow') {
                const headLen = 20;
                const dx = a.x2! - a.x1!;
                const dy = a.y2! - a.y1!;
                const angle = Math.atan2(dy, dx);
                
                ctx.moveTo(a.x1!, a.y1!);
                ctx.lineTo(a.x2!, a.y2!);
                ctx.stroke();
                
                // Arrowhead
                ctx.beginPath();
                ctx.moveTo(a.x2!, a.y2!);
                ctx.lineTo(a.x2! - headLen * Math.cos(angle - Math.PI / 6), a.y2! - headLen * Math.sin(angle - Math.PI / 6));
                ctx.lineTo(a.x2! - headLen * Math.cos(angle + Math.PI / 6), a.y2! - headLen * Math.sin(angle + Math.PI / 6));
                ctx.fill();
            } else if (a.type === 'text') {
                const metrics = ctx.measureText(a.text!);
                const padding = 6;
                const boxWidth = metrics.width + padding * 2;
                const boxHeight = 32;

                ctx.save();
                ctx.fillStyle = 'rgba(255,255,255,0.9)';
                ctx.shadowColor = "rgba(0,0,0,0.3)";
                ctx.shadowBlur = 4;
                ctx.fillRect(a.x! - padding, a.y! - padding, boxWidth, boxHeight);
                ctx.strokeStyle = a.color;
                ctx.lineWidth = 2;
                ctx.strokeRect(a.x! - padding, a.y! - padding, boxWidth, boxHeight);
                ctx.restore();
                
                ctx.fillStyle = a.color;
                ctx.fillText(a.text!, a.x!, a.y!);
            }
        };

        annotations.forEach(drawItem);

        // Current Drawing Preview
        if (isDrawing) {
            const tempAnn: Annotation = { id: 'temp', type: activeTool, color, lineWidth };
            if (activeTool === 'rect') {
                tempAnn.x = startPos.x; tempAnn.y = startPos.y;
                tempAnn.w = currentPos.x - startPos.x; tempAnn.h = currentPos.y - startPos.y;
            } else if (activeTool === 'arrow') {
                tempAnn.x1 = startPos.x; tempAnn.y1 = startPos.y;
                tempAnn.x2 = currentPos.x; tempAnn.y2 = currentPos.y;
            }
            if (activeTool !== 'text') drawItem(tempAnn);
        }
    };

    useEffect(() => {
        if(isOpen) {
            const loop = () => {
                redraw();
                requestAnimationFrame(loop);
            }
            const id = requestAnimationFrame(loop);
            return () => cancelAnimationFrame(id);
        }
    }, [isOpen, annotations, isDrawing, currentPos, image]);

    // --- Helpers ---
    const getMousePos = (e: React.MouseEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left),
            y: (e.clientY - rect.top)
        };
    };

    const isHitText = (pos: {x: number, y: number}, ann: Annotation) => {
        if (ann.type !== 'text' || !ann.text) return false;
        const cvs = canvasRef.current;
        if (!cvs) return false;
        const ctx = cvs.getContext('2d');
        if (!ctx) return false;
        
        ctx.font = 'bold 24px Arial';
        const metrics = ctx.measureText(ann.text);
        const padding = 6;
        const width = metrics.width + padding * 2;
        const height = 32; // Approx based on font size + padding
        
        const bx = ann.x! - padding;
        const by = ann.y! - padding;
        
        return (pos.x >= bx && pos.x <= bx + width && pos.y >= by && pos.y <= by + height);
    }

    // --- Interaction ---
    const handleMouseDown = (e: React.MouseEvent) => {
        const pos = getMousePos(e);

        // Check if hitting existing text for Move
        const hitText = [...annotations].reverse().find(a => isHitText(pos, a));
        if (hitText) {
            setIsDraggingText(true);
            setDraggedTextId(hitText.id);
            setDragOffset({ x: pos.x - hitText.x!, y: pos.y - hitText.y! });
            return;
        }

        // Tool Logic
        if(activeTool === 'text') {
            // New text creation
            setTextPos(pos);
            setIsTyping(true);
            setEditingId(null);
            setTextInput('');
            return;
        }
        
        setIsDrawing(true);
        setStartPos(pos);
        setCurrentPos(pos);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const pos = getMousePos(e);
        
        if (isDraggingText && draggedTextId) {
            setAnnotations(prev => prev.map(a => 
                a.id === draggedTextId 
                ? { ...a, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y } 
                : a
            ));
            return;
        }

        if(isDrawing) {
            setCurrentPos(pos);
        }
        
        // Cursor management
        const hitText = annotations.some(a => isHitText(pos, a));
        if (canvasRef.current) {
            canvasRef.current.style.cursor = hitText ? 'move' : 'crosshair';
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (isDraggingText) {
            setIsDraggingText(false);
            setDraggedTextId(null);
            return;
        }

        if(isDrawing) {
            setIsDrawing(false);
            const pos = getMousePos(e);
            
            const newAnn: Annotation = { id: Date.now().toString(), type: activeTool, color, lineWidth };
            if (activeTool === 'rect') {
                newAnn.x = startPos.x; newAnn.y = startPos.y;
                newAnn.w = pos.x - startPos.x; newAnn.h = pos.y - startPos.y;
                // Avoid tiny rects
                if (Math.abs(newAnn.w) > 5 && Math.abs(newAnn.h) > 5) {
                    setAnnotations(prev => [...prev, newAnn]);
                }
            } else if (activeTool === 'arrow') {
                newAnn.x1 = startPos.x; newAnn.y1 = startPos.y;
                newAnn.x2 = pos.x; newAnn.y2 = pos.y;
                if (Math.hypot(newAnn.x2-newAnn.x1, newAnn.y2-newAnn.y1) > 10) {
                    setAnnotations(prev => [...prev, newAnn]);
                }
            }
        }
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        const pos = getMousePos(e);
        const clickedAnn = [...annotations].reverse().find(a => isHitText(pos, a));

        if (clickedAnn) {
            setEditingId(clickedAnn.id);
            setTextInput(clickedAnn.text || '');
            setTextPos({ x: clickedAnn.x!, y: clickedAnn.y! });
            setIsTyping(true);
        }
    };

    const handleAddText = () => {
        if (textInput.trim()) {
            if (editingId) {
                // Update existing
                setAnnotations(prev => prev.map(a => a.id === editingId ? { ...a, text: textInput } : a));
            } else {
                // Create new
                setAnnotations(prev => [...prev, { 
                    id: Date.now().toString(),
                    type: 'text', text: textInput, x: textPos.x, y: textPos.y, color, lineWidth 
                }]);
            }
        } else if (editingId) {
            // Empty text on edit -> delete
            setAnnotations(prev => prev.filter(a => a.id !== editingId));
        }
        
        setTextInput('');
        setIsTyping(false);
        setEditingId(null);
    };

    // --- Execute AI Edit ---
    const handleExecuteEdit = async () => {
        if(!image) return;
        setLoading(true);
        
        try {
            // 1. Generate Mask from Rectangles and Arrow heads
            const w = canvasRef.current?.width || 1024;
            const h = canvasRef.current?.height || 1024;
            
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = w; maskCanvas.height = h;
            const mCtx = maskCanvas.getContext('2d');
            
            let hasMask = false;
            if(mCtx) {
                mCtx.fillStyle = 'black';
                mCtx.fillRect(0,0,w,h);
                mCtx.fillStyle = 'white';
                
                annotations.forEach(a => {
                    if (a.type === 'rect') {
                        mCtx.fillRect(a.x!, a.y!, a.w!, a.h!);
                        hasMask = true;
                    } else if (a.type === 'arrow') {
                        // Mark area around arrow head for edit
                        mCtx.beginPath();
                        mCtx.arc(a.x2!, a.y2!, 30, 0, 2 * Math.PI); // 30px radius around arrow tip
                        mCtx.fill();
                        hasMask = true;
                    }
                });
            }
            
            let maskFile: ImageFile | null = null;
            if (hasMask) {
                const maskBase64 = maskCanvas.toDataURL('image/png');
                maskFile = { 
                    file: dataURLtoFile(maskBase64, 'mask.png'), 
                    base64: maskBase64, 
                    url: maskBase64 
                };
            }

            // 2. Pair Arrows with closest Text to form Instructions
            const arrows = annotations.filter(a => a.type === 'arrow');
            const texts = annotations.filter(a => a.type === 'text');
            const rects = annotations.filter(a => a.type === 'rect');

            let instructionPrompt = "";

            if (arrows.length > 0 && texts.length > 0) {
                // Map each arrow to closest text
                const pairs = arrows.map(arr => {
                    let minD = Infinity;
                    let closestTxt = null;
                    
                    // Tip of arrow is target, Tail of arrow is likely near text
                    const tailX = arr.x1!;
                    const tailY = arr.y1!;

                    texts.forEach(txt => {
                        const d = Math.hypot(txt.x! - tailX, txt.y! - tailY);
                        if (d < minD) {
                            minD = d;
                            closestTxt = txt;
                        }
                    });
                    return { arrow: arr, text: closestTxt };
                });

                instructionPrompt = pairs.map((p, idx) => {
                    if (!p.text) return "";
                    return `Instruction ${idx+1}: At the specific location indicated by the arrow tip (approx coordinates x:${Math.round(p.arrow.x2!)}, y:${Math.round(p.arrow.y2!)}), execute the following change: "${p.text.text}".`;
                }).join(" ");
            } else if (texts.length > 0) {
                // Just use all text if no arrows or mismatch
                instructionPrompt = "Edit instructions: " + texts.map(t => t.text).join(". ");
            } else {
                instructionPrompt = "Edit the image based on the marked areas.";
            }

            // 3. Strict System Prompt
            const finalPrompt = `${instructionPrompt}. 
            CRITICAL REQUIREMENTS FOR REALISM:
            1. Scale Matching: The added details MUST match the scale of surrounding elements in the original image.
            2. Lighting Integration: Analyze the original image's light source direction, intensity, and color temperature. The new details must have consistent highlights and shadows.
            3. Perspective Consistency: Use the original image's vanishing points. Added objects must lie flat on surfaces (floors/tables) or align with walls properly.
            4. Color Harmony: Match the noise level and color grading of the original photo.
            5. Result must be a single cohesive photorealistic image.`;

            const result = await editImage(finalPrompt, image, maskFile, numberOfImages);
            onResult(result);

        } catch(e: any) {
            console.error(e);
            onResult({ error: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[var(--bg-surface-1)] p-4 rounded-xl border border-[var(--border-1)] flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-white">Chức năng: Ghi chú (Zalo style)</h3>
            
            <div className="bg-black/20 rounded-lg p-4 border border-white/10 flex flex-col gap-4 items-center justify-center min-h-[160px]">
                {!image ? (
                    <div className="w-full">
                        <ImageUploader onFileSelect={handleImageUpdate} label="Tải ảnh cần ghi chú" />
                    </div>
                ) : (
                    <div className="flex gap-4 items-center w-full">
                        <div className="relative h-32 w-32 bg-black rounded border border-brand-primary/50 overflow-hidden shrink-0">
                            <img src={image.url} className="w-full h-full object-cover opacity-60" />
                            {annotations.length > 0 && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-green-600/90 text-white text-[10px] px-2 py-1 rounded font-bold shadow">
                                        Đã có {annotations.length} ghi chú
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2 flex-grow">
                            <button 
                                onClick={() => setIsOpen(true)}
                                className="w-full bg-brand-primary hover:bg-brand-accent text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Icon name="pencil" className="w-4 h-4" />
                                {annotations.length > 0 ? 'Sửa ghi chú' : 'Bắt đầu ghi chú'}
                            </button>
                            
                            <NumberSelector 
                                label="Số lượng kết quả" 
                                value={numberOfImages} 
                                onChange={setNumberOfImages} 
                                min={1} 
                                max={4}
                                className="text-xs"
                            />

                            <button 
                                onClick={handleExecuteEdit}
                                disabled={annotations.length === 0}
                                className="w-full bg-gradient-to-r from-brand-accent to-brand-secondary text-white py-2 px-4 rounded-lg font-bold shadow-lg transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Icon name="sparkles" className="w-4 h-4" />
                                Thực hiện chỉnh sửa
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* FULL SCREEN ANNOTATION OVERLAY */}
            {isOpen && image && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-fade-in">
                    {/* Header / Toolbar */}
                    <div className="h-14 bg-brand-surface border-b border-brand-primary/50 flex items-center justify-between px-4 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="flex bg-black/30 rounded-lg p-1 gap-1">
                                <button onClick={() => setActiveTool('arrow')} className={`p-2 rounded ${activeTool === 'arrow' ? 'bg-brand-accent text-white' : 'text-brand-text-muted hover:text-white'}`} title="Mũi tên">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                </button>
                                <button onClick={() => setActiveTool('rect')} className={`p-2 rounded ${activeTool === 'rect' ? 'bg-brand-accent text-white' : 'text-brand-text-muted hover:text-white'}`} title="Khung vuông (Tạo vùng chọn)">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                                </button>
                                <button onClick={() => setActiveTool('text')} className={`p-2 rounded ${activeTool === 'text' ? 'bg-brand-accent text-white' : 'text-brand-text-muted hover:text-white'}`} title="Chữ (Click để thêm, Double-click để sửa)">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
                                </button>
                            </div>
                            
                            <div className="h-8 w-px bg-white/10 mx-2"></div>
                            
                            {/* Colors */}
                            <div className="flex gap-2">
                                {['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#ffffff'].map(c => (
                                    <button 
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>

                            <div className="h-8 w-px bg-white/10 mx-2"></div>

                            <button onClick={() => setAnnotations(prev => prev.slice(0, -1))} className="text-white hover:text-brand-accent text-sm flex items-center gap-1">
                                <Icon name="arrow-uturn-left" className="w-4 h-4" /> Undo
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setIsOpen(false)} className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-sm font-medium transition-colors">
                                Hủy
                            </button>
                            <button onClick={() => setIsOpen(false)} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-bold transition-colors shadow-lg">
                                Hoàn tất
                            </button>
                        </div>
                    </div>

                    {/* Canvas Container */}
                    <div className="flex-grow relative bg-[#111] overflow-hidden flex items-center justify-center cursor-crosshair">
                        <canvas 
                            ref={canvasRef}
                            // Set resolution high enough, or match window inner size
                            width={window.innerWidth}
                            height={window.innerHeight - 56} 
                            className="block max-w-full max-h-full"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onDoubleClick={handleDoubleClick}
                        />
                        
                        {/* Text Input Overlay */}
                        {isTyping && (
                            <div 
                                className="absolute bg-white p-2 rounded shadow-xl flex gap-2 animate-fade-in z-50"
                                style={{ 
                                    left: textPos.x, 
                                    top: textPos.y 
                                }}
                            >
                                <input 
                                    autoFocus
                                    value={textInput}
                                    onChange={e => setTextInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddText()}
                                    className="text-black border border-gray-300 rounded px-2 py-1 outline-none w-48 text-sm"
                                    placeholder="Nhập ghi chú..."
                                />
                                <button onClick={handleAddText} className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-blue-500">OK</button>
                            </div>
                        )}
                        
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-4 py-2 rounded-full pointer-events-none text-center">
                            Mẹo: Kéo thả để di chuyển chữ. Click đúp vào chữ để sửa nội dung.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
