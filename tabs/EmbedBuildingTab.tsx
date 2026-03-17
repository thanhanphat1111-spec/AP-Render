import React, { useState } from 'react';
import { BaseTab } from './BaseTab';
import { Card } from '../components/Card';
import { ImageUploader } from '../components/ImageUploader';
import { MaskingCanvas } from '../components/MaskingCanvas';
import { generateImage, generateText } from '../services/aiService';
import { ImageFile } from '../types';

interface EmbedBuildingTabProps {
  onEditRequest: (image: ImageFile) => void;
  onVideoRequest: (image: ImageFile) => void;
}

export const EmbedBuildingTab: React.FC<EmbedBuildingTabProps> = ({ onEditRequest, onVideoRequest }) => {
  const [contextImage, setContextImage] = useState<ImageFile | null>(null);
  const [buildingImage, setBuildingImage] = useState<ImageFile | null>(null);
  const [maskFile, setMaskFile] = useState<ImageFile | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleSuggestPrompt = async () => {
    setIsSuggesting(true);
    const suggestedPrompt = "Tạo ảnh chụp thực tế, ghép công trình vào vị trí được đánh dấu trên ảnh hiện trạng. Tự động điều chỉnh góc nhìn, phối cảnh, ánh sáng và bóng đổ của công trình cho phù hợp và liền mạch với bối cảnh xung quanh.";
    setPrompt(suggestedPrompt);
    setIsSuggesting(false);
  };
  
  return (
    <BaseTab 
      tabKey="embed_building" 
      onEditRequest={onEditRequest}
      onVideoRequest={onVideoRequest}
      comparisonImage={contextImage?.base64}
    >
      {({ setLoading, setResult, addHistoryItem }) => {
        const handleGenerate = async () => {
          if (!contextImage) {
            alert('Vui lòng tải ảnh chụp hiện trạng.');
            return;
          }
          if (!buildingImage) {
            alert('Vui lòng tải ảnh công trình cần chèn.');
            return;
          }
          if (!maskFile) {
            alert('Vui lòng vẽ vị trí cần chèn công trình lên ảnh hiện trạng.');
            return;
          }
           if (!prompt) {
            alert('Vui lòng nhập mô tả hoặc sử dụng gợi ý từ AI.');
            return;
          }

          setLoading(true);
          setResult(null);
          
          const fullPrompt = `INSTRUCTION: You are an expert photo editor. Your task is to seamlessly embed a building into a context photo.
- IMAGE 1 is the context photo (the background).
- IMAGE 2 is the mask, defining the exact location and shape for insertion.
- IMAGE 3 is the building to be inserted.
- TASK: Place the building from IMAGE 3 into the masked area of IMAGE 1. You MUST adjust the building's perspective, scale, lighting, and shadows to perfectly match the context photo's environment. The final result should be a single, photorealistic image.
- USER REQUEST: "${prompt}".`;
          
          const imagesToSend: ImageFile[] = [contextImage, maskFile, buildingImage];

          // We use generateImage as it's designed to handle multiple image inputs
          const response = await generateImage(fullPrompt, imagesToSend, 1);
          
          setResult(response);
          addHistoryItem(fullPrompt, response);
          setLoading(false);
        };

        return (
          <Card title="Input">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-brand-text-muted mb-1">1. Tải và vẽ lên ảnh hiện trạng</label>
                   <MaskingCanvas
                        onImageSelect={setContextImage}
                        onMaskChange={setMaskFile}
                   />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-text-muted mb-1">2. Tải ảnh công trình</label>
                  <ImageUploader onFileSelect={setBuildingImage} label="Tải ảnh công trình cần chèn (nền trắng/trong suốt)" />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                    <label htmlFor="embed-prompt" className="block text-sm font-medium text-brand-text-muted">
                      3. Yêu cầu & Mô tả
                    </label>
                     <button
                        onClick={handleSuggestPrompt}
                        disabled={isSuggesting}
                        className="text-xs bg-brand-primary hover:bg-brand-accent px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                    >
                        {isSuggesting ? '...' : '✨ Gợi ý từ AI'}
                    </button>
                </div>
                <textarea
                  id="embed-prompt"
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition"
                  placeholder="e.g., Giữ lại cây xanh ở phía trước, làm cho công trình trông như được xây dựng 5 năm..."
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={!contextImage || !buildingImage || !maskFile}
                className="w-full bg-brand-accent hover:bg-opacity-80 text-white font-semibold px-4 py-3 rounded-lg text-sm transition-colors disabled:bg-brand-surface disabled:cursor-not-allowed"
              >
                Thực Hiện Chèn Ghép
              </button>
            </div>
          </Card>
        );
      }}
    </BaseTab>
  );
};
