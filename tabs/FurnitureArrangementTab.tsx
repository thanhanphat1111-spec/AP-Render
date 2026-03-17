
import React, { useState, useCallback, useEffect } from 'react';
import { CanvaMixInterior } from '../components/CanvaMixInterior';
import { generateImage } from '../services/aiService';
import { HistoryItem, ImageFile, ObjectTransform, SourceImage } from '../types';
import { useSessionStorage } from '../hooks/useSessionStorage';
import { LOCAL_STORAGE_HISTORY_KEY } from '../constants';

interface FurnitureArrangementTabProps {
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
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
}

// Helper function needed for thumbnail creation logic in history
const createThumbnail = (base64Image: string, size: number = 256): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Image;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not get canvas context'));
            const aspectRatio = img.width / img.height;
            let newWidth = size;
            let newHeight = size;
            if (aspectRatio > 1) newHeight = size / aspectRatio; else newWidth = size * aspectRatio;
            canvas.width = newWidth;
            canvas.height = newHeight;
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = (error) => reject(error);
    });
};

export const FurnitureArrangementTab: React.FC<FurnitureArrangementTabProps> = ({ onEditRequest, onVideoRequest }) => {
  const [intSourceImage, setIntSourceImage] = useState<SourceImage | null>(null);
  const [intCanvaObjects, setIntCanvaObjects] = useState<SourceImage[]>([]);
  const [intCanvaObjectTransforms, setIntCanvaObjectTransforms] = useState<ObjectTransform[]>([]);
  const [intSelectedCanvaObjectIndex, setIntSelectedCanvaObjectIndex] = useState<number | null>(null);
  const [intIsCanvaLayoutLocked, setIntIsCanvaLayoutLocked] = useState(false);
  const [intPrompt, setIntPrompt] = useState('');
  const [intIsLoading, setIntIsLoading] = useState(false);
  const [intGeneratedImages, setIntGeneratedImages] = useState<string[]>([]);
  const [intSelectedImage, setIntSelectedImage] = useState<string | null>(null);
  const [intHistory, setIntHistory] = useSessionStorage<HistoryItem[]>(`${LOCAL_STORAGE_HISTORY_KEY}_canva_mix_interior`, []);

  // Helper to create objects layer image
  const createObjectsOnlyLayer = async (bg: SourceImage, objects: SourceImage[], transforms: ObjectTransform[]): Promise<ImageFile | null> => {
      if (!bg.base64) return null;
      
      // We need BG dimensions
      const bgImg = new Image();
      bgImg.src = `data:${bg.mimeType};base64,${bg.base64}`;
      await new Promise(resolve => bgImg.onload = resolve);
      
      const canvas = document.createElement('canvas');
      canvas.width = bgImg.naturalWidth;
      canvas.height = bgImg.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      for (let i = 0; i < objects.length; i++) {
          const obj = objects[i];
          const t = transforms[i];
          
          const objImg = new Image();
          objImg.src = `data:${obj.mimeType};base64,${obj.base64}`;
          await new Promise(resolve => objImg.onload = resolve);
          
          const canvasCenterX = (t.x / 100) * canvas.width;
          const canvasCenterY = (t.y / 100) * canvas.height;
          const objWidth = (t.scale / 100) * canvas.width;
          const objHeight = objImg.naturalHeight * (objWidth / objImg.naturalWidth);
          
          ctx.save();
          ctx.translate(canvasCenterX, canvasCenterY);
          ctx.rotate(t.rotation * Math.PI / 180);
          ctx.scale(t.flipHorizontal ? -1 : 1, t.flipVertical ? -1 : 1);
          ctx.drawImage(objImg, -objWidth / 2, -objHeight / 2, objWidth, objHeight);
          ctx.restore();
      }
      
      const base64 = canvas.toDataURL('image/png'); // PNG for transparency
      return {
          file: dataURLtoFile(base64, 'objects_layer.png'),
          base64: base64,
          url: base64
      } as ImageFile;
  };

  const handleIntGenerate = async () => {
      if (!intSourceImage) { alert("Vui lòng tải ảnh nền."); return; }
      if (intCanvaObjects.length === 0) { alert("Vui lòng thêm ít nhất một đồ vật."); return; }
      if (!intPrompt) { alert("Vui lòng nhập prompt."); return; }

      setIntIsLoading(true);
      
      try {
          const bgFile: ImageFile = { 
              file: new File([], 'bg', { type: intSourceImage.mimeType }), 
              base64: `data:${intSourceImage.mimeType};base64,${intSourceImage.base64}`, 
              url: '' 
          };
          
          // Create the "Image 2" (Objects Overlay)
          const objectsLayer = await createObjectsOnlyLayer(intSourceImage, intCanvaObjects, intCanvaObjectTransforms);
          
          if (!objectsLayer) throw new Error("Failed to create layout layer");

          // Construct the strict prompt
          const engineeredPrompt = `Image 1 is the Background Room. Image 2 contains the Furniture Objects to insert.
          TASK: ${intPrompt}.
          INSTRUCTION: Insert the furniture from Image 2 into Image 1 exactly at the positioned locations shown in Image 2.
          - Maintain the exact scale and position from Image 2.
          - Adjust lighting, shadows, and perspective of the furniture to match Image 1's environment perfectly.
          - Make it photorealistic. Do not move the furniture positions.`;
          
          const response = await generateImage(engineeredPrompt, [bgFile, objectsLayer], 1);
          
          if (response.imageUrls) {
              setIntGeneratedImages(response.imageUrls);
              setIntSelectedImage(response.imageUrls[0]);
              try {
                const thumb = await createThumbnail(response.imageUrls[0]);
                const historyItem: HistoryItem = {
                    id: Date.now().toString(),
                    prompt: intPrompt,
                    thumbnail: thumb,
                    fullImage: response.imageUrls[0],
                    imageCount: 1,
                    timestamp: Date.now(),
                    category: 'canva_mix_interior'
                };
                setIntHistory(prev => [historyItem, ...prev].slice(0, 10));
              } catch (e) { console.error(e); }
          } else if (response.error) {
              alert("Lỗi tạo ảnh: " + response.error);
          }
      } catch (error) {
          console.error(error);
          alert("Có lỗi xảy ra khi xử lý hình ảnh.");
      }
      setIntIsLoading(false);
  };

  return (
    <div className="animate-fade-in h-[800px]">
        <CanvaMixInterior
            sourceImage={intSourceImage}
            setSourceImage={setIntSourceImage}
            canvaObjects={intCanvaObjects}
            setCanvaObjects={setIntCanvaObjects}
            canvaObjectTransforms={intCanvaObjectTransforms}
            setCanvaObjectTransforms={setIntCanvaObjectTransforms}
            selectedCanvaObjectIndex={intSelectedCanvaObjectIndex}
            setSelectedCanvaObjectIndex={setIntSelectedCanvaObjectIndex}
            isCanvaLayoutLocked={intIsCanvaLayoutLocked}
            setIsCanvaLayoutLocked={setIntIsCanvaLayoutLocked}
            prompt={intPrompt}
            setPrompt={setIntPrompt}
            isLoading={intIsLoading}
            handleGeneration={handleIntGenerate}
            generatedImages={intGeneratedImages}
            selectedImage={intSelectedImage}
            setSelectedImage={setIntSelectedImage}
            setFullscreenImage={() => {}}
        />
    </div>
  );
};
