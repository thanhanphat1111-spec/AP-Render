
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/Card';
import { MultiImageUploader } from '../components/MultiImageUploader';
import { ImageUploader } from '../components/ImageUploader';
import { generateVideo, generateScript, extendVideo, generateImage } from '../services/aiService';
import { ImageFile, VideoScene, TimelineClip, AudioTrack } from '../types';
import { Spinner } from '../components/Spinner';

// --- Constants ---
const ASPECT_RATIO_OPTIONS: Array<'16:9' | '9:16'> = ['16:9', '9:16'];
const RESOLUTION_OPTIONS: Record<string, '1080p' | '720p'> = {
    '1080p (Full HD)': '1080p',
    '720p (HD)': '720p',
};
const VIDEO_TOOL_OPTIONS = [
    'Veo Fast (Tốc độ cao)',
    'Veo Quality (Chất lượng cao)',
    'Ray-2 (Thử nghiệm)',
    'Luma Dream Machine (Mô phỏng)'
];

const TRANSITION_OPTIONS = ['None', 'Fade', 'Dissolve', 'Wipe Left', 'Wipe Right', 'Zoom In'];

const CHARACTER_PROMPTS = [
    { label: 'KTS Nam trẻ', prompt: 'Một kiến trúc sư nam trẻ tuổi, mặc áo sơ mi trắng, quần âu, đội mũ bảo hộ màu trắng, phong cách chuyên nghiệp.' },
    { label: 'KTS Nữ hiện đại', prompt: 'Một nữ kiến trúc sư hiện đại, tóc buộc cao, mặc vest công sở gọn gàng, cầm bản vẽ trên tay.' },
    { label: 'Công nhân xây dựng', prompt: 'Một người công nhân xây dựng mặc đồ bảo hộ màu xanh, đội mũ vàng, đang làm việc tập trung.' },
    { label: 'Doanh nhân Vest đen', prompt: 'Một người đàn ông doanh nhân thành đạt, mặc vest đen sang trọng, phong thái tự tin.' },
    { label: 'Người mẫu thời trang', prompt: 'Một cô gái trẻ trung, thời thượng, mặc váy dạ hội đỏ, dáng vẻ thanh lịch.' }
];

// --- Components ---
const SelectInput: React.FC<{ label?: string, options: readonly string[], value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, disabled?: boolean, className?: string }> = ({ label, options, value, onChange, disabled=false, className='' }) => (
    <div className={className}>
        {label && <label className="block text-xs font-medium text-brand-text-muted mb-1">{label}</label>}
        <select value={value} onChange={onChange} disabled={disabled} className="w-full bg-brand-bg border border-brand-primary rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent transition disabled:opacity-50">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

const VideoSceneCard: React.FC<{
    scene: VideoScene;
    index: number;
    onUpdate: (id: string, data: Partial<VideoScene>) => void;
    onGenerate: (scene: VideoScene) => void;
    onExtend: (scene: VideoScene) => void;
    onAddToTimeline: (scene: VideoScene) => void;
    onDownload: (url: string, index: number) => void;
    onRemove: (id: string) => void;
}> = ({ scene, index, onUpdate, onGenerate, onExtend, onAddToTimeline, onDownload, onRemove }) => {
    return (
        <div className="bg-[var(--bg-surface-1)] border border-[var(--border-1)] rounded-lg p-3 flex gap-4 items-start relative group">
             <button 
                onClick={() => onRemove(scene.id)}
                className="absolute top-2 right-2 text-brand-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Xóa cảnh này"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            {/* Left: Image/Preview/Video Player */}
            <div className="w-32 h-32 flex-shrink-0 bg-brand-bg rounded-md overflow-hidden relative group border border-brand-primary/50">
                {scene.generatedVideoUrl ? (
                    <video 
                        src={scene.generatedVideoUrl} 
                        controls 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <img src={scene.image.url} alt={`Scene ${index + 1}`} className="w-full h-full object-cover" />
                )}
                <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 rounded pointer-events-none">#{index + 1}</div>
            </div>

            {/* Middle: Prompt & Status */}
            <div className="flex-grow space-y-2 mr-6">
                <textarea
                    value={scene.prompt}
                    onChange={(e) => onUpdate(scene.id, { prompt: e.target.value })}
                    className="w-full h-20 bg-brand-bg border border-brand-primary rounded px-2 py-1 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-brand-accent"
                    placeholder="Mô tả kịch bản cho phân cảnh này..."
                />
                <div className="flex items-center justify-between">
                    <div className="text-xs">
                         {scene.isLoading ? (
                            <span className="text-yellow-400 flex items-center gap-1"><Spinner /> Đang tạo...</span>
                         ) : scene.error ? (
                            <span className="text-red-400" title={scene.error}>Lỗi: {scene.error.substring(0, 40)}...</span>
                         ) : scene.generatedVideoUrl ? (
                            <span className="text-green-400">Đã tạo xong</span>
                         ) : (
                            <span className="text-brand-text-muted">Sẵn sàng</span>
                         )}
                    </div>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-col gap-2 w-28">
                <button
                    onClick={() => onGenerate(scene)}
                    disabled={scene.isLoading}
                    className="bg-brand-accent hover:bg-brand-accent/80 text-white text-xs py-1.5 px-2 rounded transition-colors disabled:opacity-50"
                >
                    {scene.generatedVideoUrl ? 'Tạo lại' : 'Tạo Video'}
                </button>
                 <button
                    onClick={() => onExtend(scene)}
                    disabled={!scene.generatedVideoUrl || scene.isLoading}
                    className="bg-brand-primary hover:bg-brand-primary/80 text-white text-xs py-1.5 px-2 rounded transition-colors disabled:opacity-50"
                >
                    Nối dài
                </button>
                 <button
                    onClick={() => onAddToTimeline(scene)}
                    disabled={!scene.generatedVideoUrl}
                    className="bg-brand-surface hover:bg-white/10 text-white text-xs py-1.5 px-2 rounded transition-colors disabled:opacity-50 border border-brand-primary/50"
                >
                    Add Timeline
                </button>
                {scene.generatedVideoUrl && (
                    <button
                         onClick={() => onDownload(scene.generatedVideoUrl!, index)}
                         className="bg-green-600 hover:bg-green-500 text-white text-xs py-1.5 px-2 rounded transition-colors"
                    >
                        Tải xuống
                    </button>
                )}
            </div>
        </div>
    );
};

export const MultiVideoTab: React.FC = () => {
    // --- State ---
    const [scenes, setScenes] = useState<VideoScene[]>([]);
    const [timeline, setTimeline] = useState<TimelineClip[]>([]);
    const [aspectRatio, setAspectRatio] = useState<string>(ASPECT_RATIO_OPTIONS[0]);
    const [resolution, setResolution] = useState<string>('1080p');
    const [videoTool, setVideoTool] = useState<string>(VIDEO_TOOL_OPTIONS[0]);
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [hasSelectedKey, setHasSelectedKey] = useState(false);
    
    // Preview Player State
    const [activeClipIndex, setActiveClipIndex] = useState<number | null>(null);
    const [isPlayingSequence, setIsPlayingSequence] = useState(false);
    const mainPlayerRef = useRef<HTMLVideoElement>(null);

    // Extension Modal State
    const [extensionModalOpen, setExtensionModalOpen] = useState(false);
    const [sceneToExtend, setSceneToExtend] = useState<VideoScene | null>(null);
    const [extensionPrompt, setExtensionPrompt] = useState('');

    // Character State
    const [charImage, setCharImage] = useState<ImageFile | null>(null);
    const [charPrompt, setCharPrompt] = useState('');
    const [selectedCharPrompt, setSelectedCharPrompt] = useState(CHARACTER_PROMPTS[0].prompt);
    const [selectedScenesForChar, setSelectedScenesForChar] = useState<string[]>([]);

    // Drag and Drop State
    const [draggedClipIndex, setDraggedClipIndex] = useState<number | null>(null);
    const videoUploadInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio?.hasSelectedApiKey) {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setHasSelectedKey(hasKey);
            } else {
                setHasSelectedKey(true); 
            }
        };
        checkKey();
    }, []);

    const handleSelectKey = async () => {
        if (window.aistudio?.openSelectKey) {
            await window.aistudio.openSelectKey();
            setHasSelectedKey(true);
        } else {
             alert("Vui lòng cấu hình API Key trong môi trường.");
        }
    };

    // --- Handlers ---
    const handleImagesSelected = (files: ImageFile[]) => {
        const newScenes: VideoScene[] = files.map((file, index) => ({
            id: `scene-${Date.now()}-${index}`,
            image: file,
            prompt: '',
            isLoading: false
        }));
        setScenes(prev => [...prev, ...newScenes]);
    };

    const handleClearAllScenes = () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa tất cả phân cảnh và bắt đầu lại?')) {
            setScenes([]);
        }
    };

    const handleRemoveScene = (id: string) => {
        setScenes(prev => prev.filter(s => s.id !== id));
    };

    const handleGenerateScript = async () => {
        if (scenes.length === 0) return;
        
        if (!hasSelectedKey) {
             handleSelectKey();
             return;
        }
        
        setIsGeneratingScript(true);
        
        const updatedScenes = [...scenes];
        for (let i = 0; i < updatedScenes.length; i++) {
            if (!updatedScenes[i].prompt) {
                 updatedScenes[i].prompt = "Đang tạo kịch bản...";
                 setScenes([...updatedScenes]); 
                 const scriptResult = await generateScript(updatedScenes[i].image);
                 
                 if (scriptResult.error) {
                    if (scriptResult.error.includes('API Key') || scriptResult.error.includes('UNAUTHENTICATED') || scriptResult.error.includes('khả dụng') || scriptResult.error.includes('hết hạn')) {
                       setHasSelectedKey(false);
                       alert(scriptResult.error);
                       setIsGeneratingScript(false);
                       return;
                    }
                    updatedScenes[i].prompt = `Lỗi: ${scriptResult.error}`;
                 } else {
                    updatedScenes[i].prompt = scriptResult.text || "";
                 }
                 setScenes([...updatedScenes]);
            }
        }
        setIsGeneratingScript(false);
    };

    const handleUpdateScene = (id: string, data: Partial<VideoScene>) => {
        setScenes(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    };

    const handleGenerateVideo = async (scene: VideoScene) => {
        if (!hasSelectedKey) {
             handleSelectKey();
             return;
        }
        if (!scene.prompt) {
            alert("Vui lòng nhập prompt cho phân cảnh.");
            return;
        }

        handleUpdateScene(scene.id, { isLoading: true, error: undefined });
        
        const ar = aspectRatio.split(' ')[0] as '16:9' | '9:16';
        const res = RESOLUTION_OPTIONS[resolution];

        // Enforce structural fidelity
        const strictPrompt = `STRICT: Preserve exact architecture, layout, and furniture from the image. No hallucinations. Cinematic camera movement. ${scene.prompt}`;

        const result = await generateVideo(strictPrompt, scene.image, ar, res, () => {}, false);

        if (result.videoUrl) {
            handleUpdateScene(scene.id, { isLoading: false, generatedVideoUrl: result.videoUrl });
        } else {
            if (result.error && (result.error.includes('API Key') || result.error.includes('UNAUTHENTICATED') || result.error.includes('khả dụng') || result.error.includes('hết hạn'))) {
                setHasSelectedKey(false);
                alert(result.error);
            }
            handleUpdateScene(scene.id, { isLoading: false, error: result.error || "Lỗi tạo video" });
        }
    };

    const handleOpenExtensionModal = (scene: VideoScene) => {
        setSceneToExtend(scene);
        setExtensionPrompt(scene.prompt + " tiếp tục chuyển động, góc quay mở rộng hơn.");
        setExtensionModalOpen(true);
    }

    const handleExtendVideo = async () => {
        if (!sceneToExtend || !sceneToExtend.generatedVideoUrl) return;
        setExtensionModalOpen(false);
        alert("Tính năng nối dài video đang được hoàn thiện (yêu cầu backend storage).");
    };

    const handleAddToTimeline = (scene: VideoScene) => {
        if (!scene.generatedVideoUrl) return;
        const newClip: TimelineClip = {
            id: `clip-${Date.now()}`,
            videoUrl: scene.generatedVideoUrl,
            thumbnailUrl: scene.image.url,
            duration: 5, // Default mock duration
            transitionEffect: 'Fade'
        };
        setTimeline(prev => [...prev, newClip]);
        if (timeline.length === 0) {
            setActiveClipIndex(0);
        }
    };
    
    const handleUploadExternalVideo = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const videoUrl = URL.createObjectURL(file);
            // Generate a thumbnail (using a generic icon or trying to grab a frame would be better, but for now simple)
            // We'll use a placeholder thumbnail for external videos if we can't generate one easily in browser without heavy logic
            const newClip: TimelineClip = {
                id: `clip-ext-${Date.now()}`,
                videoUrl: videoUrl,
                thumbnailUrl: 'https://placehold.co/160x90/1a1a2e/e0e0e0?text=Video+Upload', // Placeholder
                duration: 5,
                transitionEffect: 'Fade'
            };
             setTimeline(prev => [...prev, newClip]);
             if (timeline.length === 0) {
                setActiveClipIndex(0);
            }
        }
    };

    const handleDownloadVideo = (url: string, index: number) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `scene_${index + 1}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Character Handlers
    const handlePreviewChar = async () => {
        const promptToUse = charImage ? "Tạo một nhân vật dựa trên ảnh mẫu" : selectedCharPrompt;
        alert(`Đang tạo preview nhân vật: ${promptToUse}`);
    };

    const handleApplyCharToScenes = () => {
        const charDescription = charPrompt || selectedCharPrompt;
        const updatedScenes = scenes.map((scene, index) => {
             if (selectedScenesForChar.includes(scene.id)) {
                 return {
                     ...scene,
                     prompt: `${scene.prompt}. Có sự xuất hiện của ${charDescription}.`
                 };
             }
             return scene;
        });
        setScenes(updatedScenes);
        alert("Đã thêm mô tả nhân vật vào các phân cảnh đã chọn.");
        setSelectedScenesForChar([]);
    };

    const toggleSceneSelection = (id: string) => {
        setSelectedScenesForChar(prev => 
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    // --- Timeline Playback Logic ---
    const handlePlayAll = () => {
        if (timeline.length === 0) return;
        setIsPlayingSequence(true);
        setActiveClipIndex(0);
    };

    const handleVideoEnded = () => {
        if (!isPlayingSequence) return;
        
        if (activeClipIndex !== null && activeClipIndex < timeline.length - 1) {
            setActiveClipIndex(activeClipIndex + 1);
        } else {
            setIsPlayingSequence(false);
            setActiveClipIndex(0); 
        }
    };
    
    const handleClipClick = (index: number) => {
        setIsPlayingSequence(false);
        setActiveClipIndex(index);
    };
    
    const handleRemoveClip = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        const newTimeline = [...timeline];
        newTimeline.splice(index, 1);
        setTimeline(newTimeline);
        if (activeClipIndex === index) setActiveClipIndex(null);
        if (activeClipIndex !== null && activeClipIndex > index) setActiveClipIndex(activeClipIndex - 1);
    };

    // --- Drag & Drop Logic ---
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedClipIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedClipIndex === null) return;
        if (draggedClipIndex === dropIndex) return;

        const newTimeline = [...timeline];
        const draggedItem = newTimeline[draggedClipIndex];
        
        // Remove dragged item
        newTimeline.splice(draggedClipIndex, 1);
        // Insert at new position
        newTimeline.splice(dropIndex, 0, draggedItem);
        
        setTimeline(newTimeline);
        setDraggedClipIndex(null);
        
        // Update active index if needed
        if (activeClipIndex === draggedClipIndex) {
            setActiveClipIndex(dropIndex);
        }
    };
    
    const handleTransitionChange = (e: React.ChangeEvent<HTMLSelectElement>, index: number) => {
        const newTimeline = [...timeline];
        newTimeline[index].transitionEffect = e.target.value;
        setTimeline(newTimeline);
    };


    return (
        <div className="space-y-6 pb-20">
             {/* Key Selection Warning */}
             {!hasSelectedKey && (
                <div className="p-4 border border-yellow-500/50 bg-yellow-900/20 rounded-lg text-center mb-4">
                    <p className="text-sm text-yellow-300 mb-2">Tính năng này yêu cầu API Key riêng. Vui lòng chọn key của bạn để tiếp tục.</p>
                    <button
                        onClick={handleSelectKey}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                        Chọn API Key
                    </button>
                </div>
             )}

             {/* Section 1: Configuration & Character */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="1. Thiết lập & Kịch bản" className="lg:col-span-2">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                             <SelectInput 
                                label="Công cụ Video" 
                                options={VIDEO_TOOL_OPTIONS} 
                                value={videoTool} 
                                onChange={e => setVideoTool(e.target.value)} 
                             />
                             <SelectInput 
                                label="Tỷ lệ khung hình" 
                                options={ASPECT_RATIO_OPTIONS} 
                                value={aspectRatio} 
                                onChange={e => setAspectRatio(e.target.value)} 
                             />
                             <SelectInput 
                                label="Chất lượng" 
                                options={Object.keys(RESOLUTION_OPTIONS)} 
                                value={resolution} 
                                onChange={e => setResolution(e.target.value)} 
                             />
                        </div>
                         <MultiImageUploader 
                            label="Tải ảnh phân cảnh (Max 20)" 
                            onFilesSelect={handleImagesSelected}
                            maxFiles={20}
                         />
                         
                         <div className="flex gap-2">
                             <button
                                onClick={handleClearAllScenes}
                                disabled={scenes.length === 0}
                                className="bg-red-600/80 hover:bg-red-500 text-white py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
                             >
                                Xóa tất cả
                             </button>
                             <button
                                onClick={handleGenerateScript}
                                disabled={scenes.length === 0 || isGeneratingScript}
                                className="flex-grow bg-brand-primary hover:bg-brand-accent text-white py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                             >
                                {isGeneratingScript ? 'Đang phân tích ảnh...' : '✨ Tự động tạo kịch bản từ ảnh'}
                             </button>
                         </div>
                    </div>
                </Card>

                <Card title="2. Thêm Nhân vật">
                     <div className="space-y-4">
                        <div className="flex gap-2 text-xs bg-brand-bg p-1 rounded-lg">
                            <button onClick={() => setCharImage(null)} className={`flex-1 py-1 rounded ${!charImage ? 'bg-brand-accent text-white' : 'text-brand-text-muted'}`}>Prompt mẫu</button>
                            <button onClick={() => setCharImage({} as any)} className={`flex-1 py-1 rounded ${charImage ? 'bg-brand-accent text-white' : 'text-brand-text-muted'}`}>Upload ảnh</button>
                        </div>

                        {!charImage ? (
                             <div className="space-y-2">
                                <SelectInput 
                                    options={CHARACTER_PROMPTS.map(c => c.label)} 
                                    value={CHARACTER_PROMPTS.find(c => c.prompt === selectedCharPrompt)?.label || ''}
                                    onChange={(e) => setSelectedCharPrompt(CHARACTER_PROMPTS.find(c => c.label === e.target.value)?.prompt || '')}
                                />
                                <textarea 
                                    value={selectedCharPrompt}
                                    onChange={(e) => setSelectedCharPrompt(e.target.value)}
                                    className="w-full h-20 bg-brand-bg border border-brand-primary rounded px-2 py-1 text-xs resize-none focus:outline-none"
                                />
                             </div>
                        ) : (
                            <ImageUploader label="Ảnh nhân vật mẫu" onFileSelect={setCharImage} />
                        )}

                        <button onClick={handlePreviewChar} className="w-full border border-brand-primary text-brand-text-muted hover:text-white text-xs py-1.5 rounded transition-colors">
                            Xem trước nhân vật
                        </button>
                        
                        {scenes.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-brand-text-muted">Chọn phân cảnh xuất hiện:</label>
                                <div className="max-h-32 overflow-y-auto bg-brand-bg rounded p-2 space-y-1">
                                    {scenes.map((s, i) => (
                                        <div key={s.id} className="flex items-center gap-2 text-xs">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedScenesForChar.includes(s.id)}
                                                onChange={() => toggleSceneSelection(s.id)}
                                                className="rounded bg-brand-surface border-brand-primary"
                                            />
                                            <span>Cảnh {i + 1}</span>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={handleApplyCharToScenes} className="w-full bg-brand-secondary hover:bg-brand-secondary/80 text-white text-xs py-1.5 rounded">
                                    Áp dụng vào cảnh đã chọn
                                </button>
                            </div>
                        )}
                     </div>
                </Card>
             </div>

             {/* Section 2: Scene List */}
             {scenes.length > 0 && (
                <Card title={`3. Danh sách Phân cảnh (${scenes.length})`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
                        {scenes.map((scene, index) => (
                            <VideoSceneCard
                                key={scene.id}
                                scene={scene}
                                index={index}
                                onUpdate={handleUpdateScene}
                                onGenerate={handleGenerateVideo}
                                onExtend={handleOpenExtensionModal}
                                onAddToTimeline={handleAddToTimeline}
                                onDownload={handleDownloadVideo}
                                onRemove={handleRemoveScene}
                            />
                        ))}
                    </div>
                </Card>
             )}

             {/* Section 3: Timeline & Preview */}
             <Card title="4. Timeline & Dựng phim">
                 <div className="space-y-4">
                    {/* Large Preview Player */}
                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-brand-primary/50 flex items-center justify-center">
                        {activeClipIndex !== null && timeline[activeClipIndex] ? (
                             <div className="w-full h-full flex flex-col">
                                <video 
                                    ref={mainPlayerRef}
                                    src={timeline[activeClipIndex].videoUrl} 
                                    className="w-full h-full object-contain"
                                    controls
                                    autoPlay={true}
                                    onEnded={handleVideoEnded}
                                />
                                {isPlayingSequence && (
                                    <div className="absolute top-2 right-2 bg-brand-accent text-white text-xs px-2 py-1 rounded animate-pulse">
                                        Đang phát chuỗi ({activeClipIndex + 1}/{timeline.length})
                                    </div>
                                )}
                             </div>
                        ) : (
                            <div className="text-center text-brand-text-muted p-4">
                                <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <p>Chọn clip bên dưới hoặc nhấn "Phát tất cả" để xem</p>
                            </div>
                        )}
                    </div>

                    {/* Timeline Strip */}
                    <div className="bg-brand-bg/50 h-44 rounded-lg flex items-center border-2 border-dashed border-brand-primary/30 overflow-x-auto p-2 gap-2">
                         {/* Upload Button in Timeline */}
                         <div className="flex-shrink-0 w-24 h-32 flex flex-col items-center justify-center border border-brand-primary rounded hover:bg-brand-surface transition cursor-pointer" onClick={() => videoUploadInputRef.current?.click()}>
                             <input 
                                type="file" 
                                accept="video/*" 
                                ref={videoUploadInputRef} 
                                className="hidden"
                                onChange={handleUploadExternalVideo}
                             />
                             <div className="text-2xl mb-1">+</div>
                             <div className="text-[10px] text-center px-1">Thêm Video Ngoài</div>
                         </div>

                         {timeline.length === 0 ? (
                             <div className="w-full text-center">
                                 <p className="text-brand-text-muted text-sm">Kéo phân cảnh từ trên xuống hoặc tải video ngoài vào đây.</p>
                             </div>
                         ) : (
                             <div className="flex gap-2 h-full items-center">
                                 {timeline.map((clip, i) => (
                                     <div 
                                        key={clip.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, i)}
                                        onDragOver={(e) => handleDragOver(e, i)}
                                        onDrop={(e) => handleDrop(e, i)}
                                        onClick={() => handleClipClick(i)}
                                        className={`flex-shrink-0 w-40 bg-brand-surface rounded-lg overflow-hidden relative group cursor-pointer transition-all border ${activeClipIndex === i ? 'border-brand-accent shadow-lg shadow-brand-accent/20' : 'border-transparent hover:border-brand-primary'}`}
                                     >
                                         <div className="relative h-24">
                                            <img src={clip.thumbnailUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100" />
                                            <button 
                                                onClick={(e) => handleRemoveClip(e, i)}
                                                className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-500 text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition"
                                                title="Xóa clip"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                            <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1 rounded">#{i+1}</div>
                                         </div>
                                         
                                         {/* Transition Selector */}
                                         <div className="p-1 bg-brand-bg/90 border-t border-brand-primary/30">
                                             <select 
                                                value={clip.transitionEffect || 'Fade'} 
                                                onChange={(e) => handleTransitionChange(e, i)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full bg-brand-surface text-[10px] text-brand-text border border-brand-primary/50 rounded focus:outline-none"
                                             >
                                                 {TRANSITION_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                             </select>
                                         </div>
                                         
                                         {activeClipIndex === i && (
                                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none top-0 h-24">
                                                 <div className="w-8 h-8 bg-brand-accent/80 rounded-full flex items-center justify-center">
                                                     <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                                 </div>
                                             </div>
                                         )}
                                     </div>
                                 ))}
                             </div>
                         )}
                    </div>
                    
                    {/* Controls */}
                    <div className="flex gap-4 justify-between items-center">
                        <button className="bg-brand-primary text-white px-4 py-2 rounded text-sm hover:bg-brand-primary/80 transition-colors">
                            🎵 Thêm nhạc nền
                        </button>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={handlePlayAll}
                                disabled={timeline.length === 0}
                                className="bg-green-600 text-white px-6 py-2 rounded text-sm hover:bg-green-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                Phát Tất Cả
                            </button>
                            <button className="bg-brand-accent text-white px-6 py-2 rounded text-sm hover:bg-brand-accent/80 transition-colors">
                                🎬 Xuất Video Tổng Hợp
                            </button>
                        </div>
                    </div>
                 </div>
             </Card>

             {/* Extension Modal */}
             {extensionModalOpen && (
                 <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                     <div className="bg-brand-surface p-6 rounded-xl max-w-lg w-full border border-brand-primary">
                         <h3 className="text-lg font-bold mb-4">Nối dài phân cảnh</h3>
                         {sceneToExtend?.image && (
                             <img src={sceneToExtend.image.url} className="h-40 object-contain mx-auto mb-4 rounded" />
                         )}
                         <textarea 
                            value={extensionPrompt}
                            onChange={(e) => setExtensionPrompt(e.target.value)}
                            className="w-full h-24 bg-brand-bg border border-brand-primary rounded p-2 text-sm mb-4"
                         />
                         <div className="flex justify-end gap-2">
                             <button onClick={() => setExtensionModalOpen(false)} className="px-4 py-2 text-sm text-brand-text-muted hover:text-white">Huỷ</button>
                             <button onClick={handleExtendVideo} className="px-4 py-2 text-sm bg-brand-accent text-white rounded">Tạo đoạn tiếp theo</button>
                         </div>
                     </div>
                 </div>
             )}
        </div>
    );
};
