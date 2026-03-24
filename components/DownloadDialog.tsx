import React, { useState } from 'react';

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
    const [fitTo, setFitTo] = useState('original');
    const [resample, setResample] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    if (!isOpen) return null;

    // HÀM ÉP TẢI XUỐNG VƯỢT LỖI CORS
    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `AP_Render_${Date.now()}.png`; // Tự động đặt tên theo thời gian
            document.body.appendChild(a);
            a.click();
            
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            onClose(); // Tải xong tự động đóng bảng
        } catch (error) {
            console.error("Lỗi tải ảnh:", error);
            // Phương án dự phòng: Mở tab mới
            window.open(imageUrl, '_blank');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[#333] border border-[#555] rounded-lg shadow-2xl w-[450px] text-sm text-[#ddd] flex flex-col overflow-hidden">
                <div className="bg-[#444] px-4 py-2 border-b border-[#555] flex justify-between items-center">
                    <h3 className="font-semibold text-white">Image Size</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>

                <div className="p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <label>Fit To:</label>
                        <select 
                            value={fitTo} 
                            onChange={e => setFitTo(e.target.value)} 
                            className="bg-[#222] border border-[#555] rounded px-2 py-1 w-48 outline-none"
                        >
                            {Object.entries(PAPER_SIZES).map(([key, size]) => (
                                <option key={key} value={key}>{size.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" id="resample" checked={resample} onChange={(e) => setResample(e.target.checked)} />
                        <label htmlFor="resample">Resample Image</label>
                        <span className="ml-auto text-[#888]">Automatic</span>
                    </div>
                </div>

                <div className="p-4 border-t border-[#444] flex justify-end gap-3 bg-[#444]">
                    <button onClick={onClose} className="px-4 py-1.5 rounded border border-[#666] hover:bg-[#555] transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={handleDownload} 
                        disabled={isDownloading}
                        className="px-4 py-1.5 rounded bg-[#4a4a4a] border border-[#666] hover:bg-[#666] text-white transition-colors shadow-inner disabled:opacity-50"
                    >
                        {isDownloading ? 'Đang xử lý...' : 'OK'}
                    </button>
                </div>
            </div>
        </div>
    );
};
