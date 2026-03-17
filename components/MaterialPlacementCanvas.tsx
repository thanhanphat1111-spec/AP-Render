import React, { useState, useRef, useId, useCallback, useEffect } from 'react';
import { ImageFile, ObjectTransform } from '../types';

// --- ICONS ---
const UploadIcon = () => <svg className="w-12 h-12 text-brand-text-muted mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>;
const RotateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const UnlockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>;

interface MaterialPlacementCanvasProps {
    sourceImage: ImageFile | null;
    materialImage: ImageFile | null;
    onTransformUpdate: (transform: ObjectTransform | null) => void;
}

const ResizeHandle: React.FC<{
    position: string;
    cursor: string;
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
}> = ({ position, cursor, onMouseDown }) => (
    <div
      className={`absolute w-4 h-4 bg-white border-2 border-orange-500 rounded-full z-20 ${position}`}
      style={{ cursor }}
      onMouseDown={onMouseDown}
    />
);

export const MaterialPlacementCanvas: React.FC<MaterialPlacementCanvasProps> = ({ sourceImage, materialImage, onTransformUpdate }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState<ObjectTransform | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    
    const interactionRef = useRef({
        type: null as 'move' | 'scale' | null,
        startX: 0,
        startY: 0,
        startTransform: null as ObjectTransform | null,
        objectCenterX: 0,
        objectCenterY: 0,
        startDist: 1,
    });

    // Reset when source or material changes
    useEffect(() => {
        if (materialImage) {
            const initialTransform = { x: 50, y: 50, scale: 25, rotation: 0, flipHorizontal: false, flipVertical: false };
            setTransform(initialTransform);
            onTransformUpdate(initialTransform);
        } else {
            setTransform(null);
            onTransformUpdate(null);
        }
        setIsLocked(false);
    }, [materialImage, sourceImage]);

    // Propagate transform updates
    useEffect(() => {
        onTransformUpdate(transform);
    }, [transform, onTransformUpdate]);


    const handleInteractionStart = (
        e: React.MouseEvent,
        type: 'move' | 'scale'
    ) => {
        if (isLocked || !transform) return;
        e.preventDefault();
        e.stopPropagation();
        
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + (transform.x / 100) * rect.width;
        const centerY = rect.top + (transform.y / 100) * rect.height;

        interactionRef.current = {
            type,
            startX: e.clientX,
            startY: e.clientY,
            startTransform: { ...transform },
            objectCenterX: centerX,
            objectCenterY: centerY,
            startDist: Math.sqrt(Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)),
        };
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { type, startX, startY, startTransform, objectCenterX, objectCenterY, startDist } = interactionRef.current;
        if (isLocked || type === null || !containerRef.current || !startTransform) return;
        
        e.preventDefault();
        const rect = containerRef.current.getBoundingClientRect();

        if (type === 'move') {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            const newX = startTransform.x + (dx / rect.width) * 100;
            const newY = startTransform.y + (dy / rect.height) * 100;
            
            setTransform(t => t ? { ...t, x: Math.max(0, Math.min(100, newX)), y: Math.max(0, Math.min(100, newY)) } : null);

        } else if (type === 'scale') {
            const currentDist = Math.sqrt(Math.pow(e.clientX - objectCenterX, 2) + Math.pow(e.clientY - objectCenterY, 2));
            if (startDist > 0) {
                const scaleFactor = currentDist / startDist;
                const newScale = startTransform.scale * scaleFactor;
                setTransform(t => t ? { ...t, scale: Math.max(5, Math.min(200, newScale)) } : null);
            }
        }
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        if (interactionRef.current.type) {
            e.preventDefault();
            interactionRef.current.type = null;
        }
    };

    const handleRotate = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isLocked) return;
        setTransform(t => t ? { ...t, rotation: (t.rotation + 45) % 360 } : null);
    };

    const handleLock = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLocked(!isLocked);
    };

    const renderContent = () => {
        if (!sourceImage) {
            return <p className="text-sm text-brand-text-muted">1. Tải ảnh gốc ở ô bên trái</p>;
        }
        if (!materialImage) {
            return <p className="text-sm text-brand-text-muted">2. Tải ảnh vật liệu ở ô bên trái</p>;
        }
        if (!transform) return null;

        return (
            <>
                <img src={sourceImage.base64} alt="Background" className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none" />
                 <div
                    className="absolute"
                    style={{
                        left: `${transform.x}%`,
                        top: `${transform.y}%`,
                        width: `${transform.scale}%`,
                        transform: `translate(-50%, -50%) rotate(${transform.rotation}deg)`,
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div
                        className="relative w-full h-full"
                        style={{ cursor: isLocked ? 'default' : 'grab' }}
                        onMouseDown={(e) => handleInteractionStart(e, 'move')}
                    >
                        <img
                            src={materialImage.base64}
                            alt="Material"
                            className="w-full h-auto pointer-events-none"
                            draggable="false"
                        />
                    </div>

                    {!isLocked && (
                        <>
                            <div className="absolute inset-0 border-2 border-dashed border-orange-500 pointer-events-none"></div>
                            <ResizeHandle position="-top-2 -left-2" cursor="nwse-resize" onMouseDown={(e) => handleInteractionStart(e, 'scale')} />
                            <ResizeHandle position="-top-2 -right-2" cursor="nesw-resize" onMouseDown={(e) => handleInteractionStart(e, 'scale')} />
                            <ResizeHandle position="-bottom-2 -left-2" cursor="nesw-resize" onMouseDown={(e) => handleInteractionStart(e, 'scale')} />
                            <ResizeHandle position="-bottom-2 -right-2" cursor="nwse-resize" onMouseDown={(e) => handleInteractionStart(e, 'scale')} />
                        </>
                    )}
                </div>
            </>
        );
    };

    return (
        <div className="w-full h-full flex flex-col items-center">
            <div 
                ref={containerRef}
                className="relative w-full h-full select-none overflow-hidden rounded-lg bg-black/30"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {renderContent()}
            </div>
             {materialImage && (
                <div className="flex items-center justify-end gap-2 mt-2">
                    <button onClick={handleRotate} disabled={isLocked} className="p-2 rounded-md bg-brand-primary disabled:opacity-50" title="Xoay 45°"><RotateIcon /></button>
                    <button onClick={handleLock} className={`p-2 rounded-md ${isLocked ? 'bg-brand-secondary' : 'bg-brand-primary'}`} title={isLocked ? 'Mở khoá' : 'Khoá'}>
                        {isLocked ? <LockIcon /> : <UnlockIcon />}
                    </button>
                </div>
            )}
        </div>
    );
};