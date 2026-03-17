
import React, { useState } from 'react';
import { BaseTab } from './BaseTab';
import { Card } from '../components/Card';
import { MultiImageUploader } from '../components/MultiImageUploader';
import { generateImage } from '../services/aiService';
import { ImageFile } from '../types';
import { NumberSelector } from '../components/NumberSelector';
import { Icon } from '../components/icons';

// Engineered prompt from requirements
const ARCH_LAYOUT_PROMPT = "Tạo một bảng trình bày kiến trúc (architectural presentation board) sử dụng thiết kế của tòa nhà này. Sử dụng các bản vẽ đặc trưng được tải lên gồm: mặt bằng, mặt đứng, mặt cắt, tiểu cảnh, phối cảnh, vật liệu,...\nTạo thêm phối cảnh trục đo axonometric và 5 sơ đồ diễn tiến khối (massing evolution) từng bước. \nDựa trên các thành phần đó khiến bảng trình bày trở nên mạch lạc và thu hút bằng bố cục và phần chữ được sắp xếp hợp lý.";

export const ArchLayoutTab: React.FC = () => {
  const [sourceFiles, setSourceFiles] = useState<ImageFile[]>([]);
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [aspectRatio, setAspectRatio] = useState('4:3'); 
  const [prompt, setPrompt] = useState(ARCH_LAYOUT_PROMPT);

  return (
    <BaseTab 
      tabKey="arch_layout" 
      comparisonImage={sourceFiles.length > 0 ? sourceFiles[0].base64 : undefined}
    >
      {({ setLoading, setResult, addHistoryItem }) => {
        const handleGenerate = async () => {
          if (sourceFiles.length === 0) {
            alert('Vui lòng tải ảnh ý tưởng hoặc file PDF dữ liệu.');
            return;
          }

          setLoading(true);
          setResult(null);

          // Construct the full prompt with aspect ratio instruction
          const fullPrompt = `${prompt} Tỷ lệ khung hình: ${aspectRatio}. Chất lượng cực cao, chi tiết sắc nét. Sử dụng dữ liệu từ tất cả các file đã tải lên.`;

          // Call generateImage with '4K' resolution to enforce 'gemini-3-pro-image-preview' model usage
          const response = await generateImage(fullPrompt, sourceFiles, numberOfImages, '4K');
          
          setResult(response);
          if (!response.error) {
            addHistoryItem("Arch Layout Presentation Board", response);
          }
          setLoading(false);
        };

        return (
          <Card title="Dàn Trang Kiến Trúc (AI Arch Layout)">
            <div className="space-y-6">
                <div className="p-4 bg-brand-surface/30 rounded-lg border border-brand-primary/20">
                    <p className="text-sm text-brand-text-muted mb-4">
                        Tính năng này sử dụng AI (Model Pro) để tự động sắp xếp và tạo ra một <strong>Bảng trình bày kiến trúc (Presentation Board)</strong> hoàn chỉnh. Bạn có thể tải lên nhiều ảnh hoặc file PDF chứa dữ liệu.
                    </p>
                    <MultiImageUploader 
                        onFilesSelect={setSourceFiles} 
                        label="Tải ảnh Ý tưởng / Phối cảnh / PDF"
                        maxFiles={10}
                        acceptPdf={true}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-brand-text-muted mb-2">Prompt Kỹ thuật (Tự động áp dụng)</label>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full bg-black/20 border border-brand-primary/30 rounded-lg p-3 text-xs text-brand-text-muted font-mono h-32 focus:outline-none focus:border-brand-accent resize-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <NumberSelector 
                        label="Số lượng phương án" 
                        value={numberOfImages} 
                        onChange={setNumberOfImages} 
                        min={1} 
                        max={4}
                    />
                    <div>
                        <label className="block text-sm font-medium text-brand-text-muted mb-2">Tỷ lệ khung hình</label>
                        <select 
                            value={aspectRatio} 
                            onChange={(e) => setAspectRatio(e.target.value)}
                            className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition"
                        >
                            <option value="4:3">4:3 (Mặc định)</option>
                            <option value="3:4">3:4 (Dọc)</option>
                            <option value="16:9">16:9 (Landscape)</option>
                            <option value="1:1">1:1 (Vuông)</option>
                        </select>
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={sourceFiles.length === 0}
                    className="w-full bg-gradient-to-r from-brand-accent to-brand-secondary hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Icon name="sparkles" className="w-5 h-5" />
                    Tạo Layout Trình Bày
                </button>
            </div>
          </Card>
        );
      }}
    </BaseTab>
  );
};
