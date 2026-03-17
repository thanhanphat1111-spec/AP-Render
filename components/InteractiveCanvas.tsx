
import React, { useRef, useState, useEffect } from 'react';
import { SourceImage, ObjectTransform } from '../types';
import { sourceImageToDataUrl } from '../utils';

interface InteractiveCanvasProps {
    bgImage: SourceImage;
    canvaObjects: SourceImage[];
    canvaObjectTransforms: ObjectTransform[];
    setCanvaObjectTransforms: React.Dispatch<React.SetStateAction<ObjectTransform[]>>;
    selectedCanvaObjectIndex: number | null;
    setSelectedCanvaObjectIndex: React.Dispatch<React.SetStateAction<number | null>>;
    isCanvaLayoutLocked: boolean;
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
    bgImage,
    canvaObjects,
    canvaObjectTransforms,
    setCanvaObjectTransforms,
    selectedCanvaObjectIndex,
    setSelectedCanvaObjectIndex,
    isCanvaLayoutLocked
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [interactionState, setInteractionState] = useState<{
        type: 'move' | 'resize';
        startX: number;
        startY: number;
        startTransform: ObjectTransform | null;
        resizeHandle?: string; // 'nw', 'ne', 'sw', 'se'
    } | null>(null);

    const handleMouseDown = (e: React.MouseEvent, index: number) => {
        if (isCanvaLayoutLocked) return;
        e.stopPropagation();
        setSelectedCanvaObjectIndex(index);
        
        // Start Move
        setInteractionState({
            type: 'move',
            startX: e.clientX,
            startY: e.clientY,
            startTransform: null // Not needed for simple delta move, but helpful for precise logic if refactored
        });
    };

    const handleResizeStart = (e: React.MouseEvent, handle: string) => {
        if (isCanvaLayoutLocked || selectedCanvaObjectIndex === null) return;
        e.stopPropagation();
        e.preventDefault();
        
        setInteractionState({
            type: 'resize',
            startX: e.clientX,
            startY: e.clientY,
            startTransform: { ...canvaObjectTransforms[selectedCanvaObjectIndex] },
            resizeHandle: handle
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!interactionState || selectedCanvaObjectIndex === null || isCanvaLayoutLocked) return;
        
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();

        if (interactionState.type === 'move') {
            const dx = ((e.clientX - interactionState.startX) / rect.width) * 100;
            const dy = ((e.clientY - interactionState.startY) / rect.height) * 100;

            setCanvaObjectTransforms(prev => prev.map((t, i) => {
                if (i === selectedCanvaObjectIndex) {
                    return { ...t, x: t.x + dx, y: t.y + dy };
                }
                return t;
            }));
            
            // Update start point for continuous delta
            setInteractionState(prev => prev ? { ...prev, startX: e.clientX, startY: e.clientY } : null);
        } 
        else if (interactionState.type === 'resize' && interactionState.startTransform) {
            const dxPx = e.clientX - interactionState.startX;
            // Calculate scale change based on width percentage
            // We assume aspect ratio is locked.
            // If dragging right/bottom corners, positive dx increases size.
            // If dragging left/top corners, negative dx increases size (conceptually, but here we just scale width).
            
            // Simple logic: Change in width relative to container width
            let deltaScale = (dxPx / rect.width) * 100;

            // Invert logic for left-side handles
            if (interactionState.resizeHandle?.includes('w')) {
                deltaScale = -deltaScale;
            }

            const newScale = Math.max(5, Math.min(200, interactionState.startTransform.scale + deltaScale));

            setCanvaObjectTransforms(prev => prev.map((t, i) => {
                if (i === selectedCanvaObjectIndex) {
                    return { ...t, scale: newScale };
                }
                return t;
            }));
        }
    };

    const handleMouseUp = () => {
        setInteractionState(null);
    };

    // Deselect if clicked on background
    const handleBgClick = () => {
        setSelectedCanvaObjectIndex(null);
    };

    return (
        <div 
            ref={containerRef} 
            className="relative w-full h-full select-none overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleBgClick}
        >
            {/* Background */}
            <img 
                src={sourceImageToDataUrl(bgImage)} 
                className="w-full h-full object-contain pointer-events-none" 
                alt="Background" 
            />

            {/* Objects */}
            {canvaObjects.map((obj, index) => {
                const transform = canvaObjectTransforms[index];
                if (!transform) return null;

                const isSelected = selectedCanvaObjectIndex === index;

                return (
                    <div
                        key={index}
                        style={{
                            position: 'absolute',
                            left: `${transform.x}%`,
                            top: `${transform.y}%`,
                            width: `${transform.scale}%`,
                            transform: `translate(-50%, -50%) rotate(${transform.rotation}deg) scaleX(${transform.flipHorizontal ? -1 : 1}) scaleY(${transform.flipVertical ? -1 : 1})`,
                            zIndex: 10 + index,
                            cursor: isCanvaLayoutLocked ? 'default' : 'move'
                        }}
                        onMouseDown={(e) => handleMouseDown(e, index)}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img 
                            src={sourceImageToDataUrl(obj)} 
                            className={`w-full h-auto pointer-events-none select-none ${isSelected ? 'ring-1 ring-orange-500/50' : ''}`}
                            alt={`Decor ${index}`} 
                            draggable={false}
                        />
                        
                        {/* Selection & Resize UI */}
                        {isSelected && !isCanvaLayoutLocked && (
                            <>
                                {/* Bounding Box Border */}
                                <div className="absolute inset-0 border border-orange-500 pointer-events-none" />
                                
                                {/* Resize Handles */}
                                {/* Top Left */}
                                <div 
                                    className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-orange-500 rounded-full cursor-nw-resize z-50 hover:scale-125 transition-transform"
                                    onMouseDown={(e) => handleResizeStart(e, 'nw')}
                                />
                                {/* Top Right */}
                                <div 
                                    className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-orange-500 rounded-full cursor-ne-resize z-50 hover:scale-125 transition-transform"
                                    onMouseDown={(e) => handleResizeStart(e, 'ne')}
                                />
                                {/* Bottom Left */}
                                <div 
                                    className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-orange-500 rounded-full cursor-sw-resize z-50 hover:scale-125 transition-transform"
                                    onMouseDown={(e) => handleResizeStart(e, 'sw')}
                                />
                                {/* Bottom Right */}
                                <div 
                                    className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-orange-500 rounded-full cursor-se-resize z-50 hover:scale-125 transition-transform"
                                    onMouseDown={(e) => handleResizeStart(e, 'se')}
                                />
                                
                                {/* Rotation Handle (Top Center) */}
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-orange-500 pointer-events-none"></div>
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-500 rounded-full pointer-events-none"></div>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
