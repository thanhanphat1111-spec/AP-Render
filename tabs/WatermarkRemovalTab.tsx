import React, { useState } from 'react';
import { BaseTab } from './BaseTab';
import { Card } from '../components/Card';
import { ImageUploader } from '../components/ImageUploader';
import { removeWatermark, generateText } from '../services/aiService';
import { ImageFile } from '../types';
import { NumberSelector } from '../components/NumberSelector';

interface WatermarkRemovalTabProps {
  onEditRequest: (image: ImageFile) => void;
  onVideoRequest: (image: ImageFile) => void;
}

const PROMPT_SAMPLES = [
    'Xoá tất cả watermark và văn bản khỏi ảnh, kể cả những chữ mờ.',
    'Loại bỏ logo ở góc dưới bên phải.',
    'Xoá dòng chữ mờ chạy dọc theo cạnh ảnh.',
    'Tái tạo lại vùng bị che bởi watermark, giữ nguyên chi tiết nền.',
    'Xoá cả logo và dòng text nhỏ bên cạnh nó.',
    'Làm sạch hình ảnh, loại bỏ tất cả các ký tự và biểu tượng không phải là một phần của ảnh gốc.'
];


const PromptSampleList: React.FC<{ onSelect: (prompt: string) => void }> = ({ onSelect }) => (
    <div>
        <label className="block text-sm font-medium text-brand-text-muted mb-2">Hoặc chọn một mẫu có sẵn:</label>
        <div className="max-h-32 overflow-y-auto space-y-2 p-2 bg-brand-bg/50 rounded-lg border border-brand-primary/50">
            {PROMPT_SAMPLES.map((sample, index) => (
                <button key={index} onClick={() => onSelect(sample)} className="w-full text-left text-xs p-2 rounded-md bg-brand-primary/50 hover:bg-brand-accent transition-colors">
                    {sample}
                </button>
            ))}
        </div>
    </div>
);

export const WatermarkRemovalTab: React.FC<WatermarkRemovalTabProps> = ({ onEditRequest, onVideoRequest }) => {
  const [sourceImage, setSourceImage] = useState<ImageFile | null>(null);
  const [userHint, setUserHint] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [numberOfImages, setNumberOfImages] = useState(1);

  return (
    <BaseTab 
      tabKey="watermark_removal" 
      onEditRequest={onEditRequest}
      onVideoRequest={onVideoRequest}
      comparisonImage={sourceImage?.base64}
    >
      {({ setLoading, setResult, addHistoryItem }) => {
        const handleGenerate = async () => {
          if (!sourceImage) {
            alert('Vui lòng tải ảnh có watermark.');
            return;
          }

          setLoading(true);
          setResult(null);

          const response = await removeWatermark(sourceImage, userHint, numberOfImages);
          
          setResult(response);
          if (!response.error) {
            // Use a generic prompt for history since the hint is optional
            addHistoryItem('Remove watermark', response);
          }
          setLoading(false);
        };
        
        const handleSuggestPrompt = async () => {
            if (!sourceImage) {
                alert("Vui lòng tải ảnh trước khi dùng gợi ý.");
                return;
            }
            setIsSuggesting(true);
            setResult(null);

            const systemInstruction = "Bạn là một AI chuyên gia về chỉnh sửa ảnh. Nhiệm vụ của bạn là tạo một câu lệnh (prompt) hiệu quả bằng tiếng Việt để ra lệnh cho một AI khác xóa watermark, kể cả những cái mờ và ẩn. Chỉ trả về nội dung của câu lệnh.";
            const userPrompt = `Phân tích hình ảnh này. Tạo một prompt chi tiết để xóa tất cả các văn bản, logo hoặc watermark. Mô tả vị trí và đặc điểm của chúng nếu có thể để tăng độ chính xác.`;

            const response = await generateText(userPrompt, systemInstruction, sourceImage);

            if (response.text) {
                setUserHint(response.text);
            } else {
                alert(`Lỗi khi tạo gợi ý: ${response.error || 'Lỗi không xác định'}`);
            }
            setIsSuggesting(false);
        };


        return (
            <Card title="1. Dữ Liệu Đầu Vào">
                <div className="space-y-6">
                    <ImageUploader onFileSelect={setSourceImage} label="Ảnh có Watermark" />
                    
                    <div>
                         <div className="flex justify-between items-center mb-1">
                            <label htmlFor="watermark-hint" className="block text-sm font-medium text-brand-text-muted">
                                Gợi ý cho AI (tuỳ chọn)
                            </label>
                            <button
                                onClick={handleSuggestPrompt}
                                disabled={isSuggesting || !sourceImage}
                                className="text-xs bg-brand-primary hover:bg-brand-accent px-2 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSuggesting ? 'Đang nghĩ...' : '✨ Gợi ý từ AI'}
                            </button>
                        </div>
                        <textarea
                            id="watermark-hint"
                            rows={3}
                            value={userHint}
                            onChange={(e) => setUserHint(e.target.value)}
                            className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition"
                            placeholder="Mô tả vị trí hoặc đặc điểm của watermark để AI xoá chính xác hơn..."
                        />
                    </div>
                    
                    <PromptSampleList onSelect={setUserHint} />
                    
                    <NumberSelector 
                        label="Số lượng kết quả"
                        value={numberOfImages}
                        onChange={setNumberOfImages}
                        min={1}
                        max={4}
                    />

                    <button
                        onClick={handleGenerate}
                        className="w-full bg-brand-accent hover:bg-opacity-80 text-white font-semibold px-4 py-3 rounded-lg text-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0
 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><path d="M12 22v-6.31"/><path d="M12 22a8 8 0 0 0 5.66-13.66"/></svg>
                        Thực Hiện
                    </button>
                </div>
            </Card>
        );
      }}
    </BaseTab>
  );
};