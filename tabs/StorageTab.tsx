
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/Card';
import { HistoryItem, ImageFile } from '../types';
import { TAB_HISTORY_KEYS, LOCAL_STORAGE_HISTORY_KEY } from '../constants';

interface StorageTabProps {
    onEditRequest: (image: ImageFile) => void;
    onVideoRequest: (image: ImageFile) => void;
}

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

export const StorageTab: React.FC<StorageTabProps> = ({ onEditRequest, onVideoRequest }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [allItems, setAllItems] = useState<HistoryItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [previewItem, setPreviewItem] = useState<HistoryItem | null>(null);

    // Load all items from sessionStorage
    useEffect(() => {
        const items: HistoryItem[] = [];
        Object.keys(TAB_HISTORY_KEYS).forEach(key => {
            const storageKey = `${LOCAL_STORAGE_HISTORY_KEY}_${key}`;
            try {
                const stored = window.sessionStorage.getItem(storageKey);
                if (stored) {
                    const parsed: HistoryItem[] = JSON.parse(stored);
                    // Ensure category is set
                    parsed.forEach(item => {
                        if (!item.category) item.category = key;
                        items.push(item);
                    });
                }
            } catch (e) {
                console.error(`Error loading history for ${key}`, e);
            }
        });
        // Sort by timestamp desc
        items.sort((a, b) => b.timestamp - a.timestamp);
        setAllItems(items);
    }, []);

    const filteredItems = useMemo(() => {
        return allItems.filter(item => {
            const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
            const matchesSearch = item.prompt.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [allItems, selectedCategory, searchTerm]);

    const handleSelectAll = () => {
        if (selectedItems.size === filteredItems.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(filteredItems.map(i => i.id)));
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedItems(newSet);
    };

    const handleDelete = () => {
        if (!window.confirm(`Bạn có chắc muốn xóa ${selectedItems.size} mục đã chọn?`)) return;

        // Group deletions by category key to update sessionStorage
        const deletionsByCategory: Record<string, string[]> = {};
        
        selectedItems.forEach(id => {
            const item = allItems.find(i => i.id === id);
            if (item && item.category) {
                if (!deletionsByCategory[item.category]) deletionsByCategory[item.category] = [];
                deletionsByCategory[item.category].push(id);
            }
        });

        // Update sessionStorage
        Object.entries(deletionsByCategory).forEach(([catKey, ids]) => {
            const storageKey = `${LOCAL_STORAGE_HISTORY_KEY}_${catKey}`;
            try {
                const stored = window.sessionStorage.getItem(storageKey);
                if (stored) {
                    const parsed: HistoryItem[] = JSON.parse(stored);
                    const remaining = parsed.filter(i => !ids.includes(i.id));
                    window.sessionStorage.setItem(storageKey, JSON.stringify(remaining));
                }
            } catch (e) {
                console.error(e);
            }
        });

        // Update local state
        setAllItems(prev => prev.filter(i => !selectedItems.has(i.id)));
        setSelectedItems(new Set());
    };

    const handleAction = (item: HistoryItem, action: 'edit' | 'video') => {
        const imageUrl = item.fullImage || item.thumbnail;
        const file = dataURLtoFile(imageUrl, 'storage-image.png');
        const imageFile: ImageFile = { file, base64: imageUrl, url: imageUrl };
        
        if (action === 'edit') onEditRequest(imageFile);
        else onVideoRequest(imageFile);
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-4">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0 bg-[var(--bg-surface-1)] backdrop-blur-md border border-[var(--border-1)] rounded-xl p-2 overflow-y-auto">
                <h3 className="text-sm font-bold text-white px-3 py-2 mb-2">Danh mục</h3>
                <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left text-xs px-3 py-2 rounded-lg mb-1 transition-colors ${selectedCategory === 'all' ? 'bg-brand-accent text-white' : 'text-brand-text-muted hover:bg-brand-primary/30'}`}
                >
                    Tất cả ({allItems.length})
                </button>
                {Object.entries(TAB_HISTORY_KEYS).map(([key, label]) => {
                    const count = allItems.filter(i => i.category === key).length;
                    if (count === 0) return null;
                    return (
                        <button
                            key={key}
                            onClick={() => setSelectedCategory(key)}
                            className={`w-full text-left text-xs px-3 py-2 rounded-lg mb-1 transition-colors ${selectedCategory === key ? 'bg-brand-accent text-white' : 'text-brand-text-muted hover:bg-brand-primary/30'}`}
                        >
                            {label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Main Content */}
            <div className="flex-grow flex flex-col gap-4">
                <Card title={`Lưu trữ (${filteredItems.length})`} className="flex-grow flex flex-col overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                checked={filteredItems.length > 0 && selectedItems.size === filteredItems.length}
                                onChange={handleSelectAll}
                                className="rounded bg-brand-bg border-brand-primary w-4 h-4"
                            />
                            <span className="text-xs text-brand-text-muted">Chọn tất cả</span>
                            {selectedItems.size > 0 && (
                                <button 
                                    onClick={handleDelete}
                                    className="ml-4 bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-1.5 rounded transition-colors"
                                >
                                    Xóa ({selectedItems.size})
                                </button>
                            )}
                        </div>
                        <div className="flex-grow max-w-md relative">
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo mô tả..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-brand-bg border border-brand-primary rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-accent"
                            />
                            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="flex-grow overflow-y-auto pr-1">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredItems.map(item => (
                                <div 
                                    key={item.id} 
                                    className={`relative group aspect-square rounded-lg overflow-hidden border cursor-pointer transition-all ${selectedItems.has(item.id) ? 'border-brand-accent ring-2 ring-brand-accent/50' : 'border-brand-primary/30 hover:border-brand-primary'}`}
                                    onClick={() => setPreviewItem(item)}
                                >
                                    <img src={item.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                                    <div className="absolute top-2 left-2" onClick={e => e.stopPropagation()}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedItems.has(item.id)}
                                            onChange={() => toggleSelection(item.id)}
                                            className="w-4 h-4 rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
                                        />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-[10px] text-white line-clamp-2">{item.prompt}</p>
                                        <div className="flex gap-2 mt-1 justify-end">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleAction(item, 'edit'); }}
                                                className="text-xs bg-brand-surface hover:bg-brand-primary p-1 rounded"
                                                title="Chỉnh sửa"
                                            >
                                                ✏️
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleAction(item, 'video'); }}
                                                className="text-xs bg-brand-surface hover:bg-brand-primary p-1 rounded"
                                                title="Làm video"
                                            >
                                                🎥
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {filteredItems.length === 0 && (
                            <div className="text-center py-10 text-brand-text-muted">
                                Không tìm thấy mục nào.
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Preview Modal */}
            {previewItem && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setPreviewItem(null)}>
                    <div className="max-w-4xl max-h-full w-full flex flex-col bg-brand-surface/90 rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b border-brand-primary/30">
                            <h3 className="text-white font-bold text-sm truncate pr-4">{TAB_HISTORY_KEYS[previewItem.category || ''] || 'Kết quả'} - {new Date(previewItem.timestamp).toLocaleString()}</h3>
                            <button onClick={() => setPreviewItem(null)} className="text-white hover:text-brand-secondary text-xl">&times;</button>
                        </div>
                        <div className="flex-grow overflow-auto p-4 flex items-center justify-center bg-black/50">
                            <img src={previewItem.fullImage || previewItem.thumbnail} className="max-w-full max-h-[70vh] object-contain" />
                        </div>
                        <div className="p-4 bg-brand-bg/50 border-t border-brand-primary/30">
                            <p className="text-xs text-brand-text-muted mb-2 max-h-20 overflow-y-auto">{previewItem.prompt}</p>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => { handleAction(previewItem, 'edit'); setPreviewItem(null); }} className="bg-brand-primary hover:bg-brand-accent text-white text-xs px-4 py-2 rounded transition-colors">Sửa ảnh này</button>
                                <button onClick={() => { handleAction(previewItem, 'video'); setPreviewItem(null); }} className="bg-brand-secondary hover:bg-brand-secondary/80 text-white text-xs px-4 py-2 rounded transition-colors">Tạo Video</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
