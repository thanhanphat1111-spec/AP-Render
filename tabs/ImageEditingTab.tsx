
import React, { useState, useEffect } from 'react';
import { BaseTab } from './BaseTab';
import { Card } from '../components/Card';
import { MaskingCanvas } from '../components/MaskingCanvas';
import { editImage } from '../services/aiService';
import { ImageFile } from '../types';
import { NumberSelector } from '../components/NumberSelector';
import { SelectionEditor } from '../components/SelectionEditor';
import { AnnotationEditor } from '../components/AnnotationEditor';

interface ImageEditingTabProps {
  initialImage: ImageFile | null;
  onClearInitialImage: () => void;
  onEditRequest: (image: ImageFile) => void;
  onVideoRequest: (image: ImageFile) => void;
  onTransferToMasterplan: (image: ImageFile) => void;
}

type EditMode = 'concept' | 'select' | 'annotate';

const EDIT_TYPES = ['Chung (General)', 'Công trình (Architecture)', 'Nội thất (Interior)', 'Quy hoạch (Planning)', 'Cảnh quan (Landscape)'];
const EDIT_MODES = ['3D (Perspective)', '2D (Plan/Flat)'];

// --- Sub-Components for this Tab ---

const SelectInput: React.FC<{ label: string, options: string[], value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }> = ({ label, options, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-brand-text-muted mb-1">{label}</label>
        <select value={value} onChange={onChange} className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

// --- Main Tab Component ---

export const ImageEditingTab: React.FC<ImageEditingTabProps> = ({ initialImage, onClearInitialImage, onEditRequest, onVideoRequest, onTransferToMasterplan }) => {
  const [activeMode, setActiveMode] = useState<EditMode>('concept');
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  
  // Concept Mode State
  const [maskFile, setMaskFile] = useState<ImageFile | null>(null);
  const [prompt, setPrompt] = useState('');
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [editType, setEditType] = useState(EDIT_TYPES[0]);
  const [editMode, setEditMode] = useState(EDIT_MODES[0]);

  useEffect(() => {
    if (initialImage) {
      setImageFile(initialImage);
      onClearInitialImage();
    }
  }, [initialImage, onClearInitialImage]);

  const handleConceptGenerate = async (setLoading: any, setResult: any, addHistoryItem: any) => {
      if (!imageFile) { alert('Vui lòng tải ảnh gốc.'); return; }
      if (!prompt) { alert('Vui lòng nhập lệnh chỉnh sửa.'); return; }

      setLoading(true);
      setResult(null);
      
      let finalPrompt = prompt;
      if (editType.includes('Quy hoạch') || editType.includes('Cảnh quan')) {
          if (editMode.includes('2D')) {
              finalPrompt = `STRICT 2D PLAN MODE: ${prompt}. Keep flat.`;
          } else {
              finalPrompt = `3D AERIAL VIEW: ${prompt}.`;
          }
      }

      if (maskFile) {
          finalPrompt = `MASK INSTRUCTION: Apply changes ONLY within the mask area. ${finalPrompt}`;
      }

      const response = await editImage(finalPrompt, imageFile, maskFile, numberOfImages);
      setResult(response);
      addHistoryItem(finalPrompt, response);
      setLoading(false);
  };

  return (
    <BaseTab tabKey="editing" comparisonImage={imageFile?.base64} onEditRequest={onEditRequest} onVideoRequest={onVideoRequest}>
      {({ setLoading, setResult, addHistoryItem, result }) => {
        return (
          <div className="space-y-6">
             {/* Sub-navigation */}
            <div className="flex flex-wrap justify-center gap-2 bg-brand-surface/50 p-2 rounded-xl backdrop-blur-sm border border-brand-primary/30">
                <button
                    onClick={() => setActiveMode('concept')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        activeMode === 'concept' ? 'bg-brand-accent text-white shadow-lg scale-105' : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'
                    }`}
                >
                    🎨 Edit Concept
                </button>
                <button
                    onClick={() => setActiveMode('select')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        activeMode === 'select' ? 'bg-brand-accent text-white shadow-lg scale-105' : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'
                    }`}
                >
                    ✂️ Chọn để sửa
                </button>
                <button
                    onClick={() => setActiveMode('annotate')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        activeMode === 'annotate' ? 'bg-brand-accent text-white shadow-lg scale-105' : 'text-brand-text-muted hover:bg-brand-bg hover:text-white'
                    }`}
                >
                    ✏️ Ghi chú (Zalo style)
                </button>
            </div>

            {/* Mode Content */}
            {activeMode === 'concept' && (
                <Card title="Edit Concept (Vẽ Mask)">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-brand-text-muted mb-1">1. Tải ảnh & Vẽ vùng chọn (Mask)</label>
                            <MaskingCanvas 
                                initialImage={imageFile}
                                onImageSelect={setImageFile}
                                onMaskChange={setMaskFile}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SelectInput label="Loại hình" options={EDIT_TYPES} value={editType} onChange={e => setEditType(e.target.value)} />
                            <SelectInput label="Định hướng" options={EDIT_MODES} value={editMode} onChange={e => setEditMode(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-text-muted mb-1">2. Lệnh chỉnh sửa</label>
                            <textarea
                                rows={4}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition"
                                placeholder="Mô tả thay đổi..."
                            />
                        </div>
                        <NumberSelector label="3. Số lượng kết quả" value={numberOfImages} onChange={setNumberOfImages} />
                        <button
                            onClick={() => handleConceptGenerate(setLoading, setResult, addHistoryItem)}
                            className="w-full bg-brand-accent hover:bg-opacity-80 text-white font-semibold px-4 py-3 rounded-lg text-sm transition-colors"
                        >
                            Thực hiện
                        </button>
                    </div>
                </Card>
            )}

            {activeMode === 'select' && (
                <SelectionEditor 
                    initialImage={imageFile}
                    onImageChange={setImageFile}
                    onResult={(res) => {
                        setResult(res);
                        if(!res.error) addHistoryItem("Select to Edit", res);
                    }}
                    setLoading={setLoading}
                />
            )}

            {activeMode === 'annotate' && (
                <AnnotationEditor 
                    initialImage={imageFile}
                    onImageChange={setImageFile}
                    onResult={(res) => {
                        setResult(res);
                        if(!res.error) addHistoryItem("Annotated Edit", res);
                    }}
                    setLoading={setLoading}
                />
            )}
          </div>
        );
      }}
    </BaseTab>
  );
};
