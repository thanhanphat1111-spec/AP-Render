
import React, { useState, useCallback } from 'react';
import { HistoryList } from '../components/HistoryList';
import { ResultDisplay } from '../components/ResultDisplay';
import { useSessionStorage } from '../hooks/useSessionStorage';
import { AiServiceResult, HistoryItem, ImageFile } from '../types';
import { LOCAL_STORAGE_HISTORY_KEY } from '../constants';

/**
 * Creates a small, compressed JPEG thumbnail from a base64 image string.
 * @param base64Image The original base64 image.
 * @param size The maximum width/height of the thumbnail.
 * @returns A promise that resolves with the new, smaller base64 JPEG string.
 */
const createThumbnail = (base64Image: string, size: number = 256): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Image;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            const aspectRatio = img.width / img.height;
            let newWidth = size;
            let newHeight = size;

            if (aspectRatio > 1) { // Landscape
                newHeight = size / aspectRatio;
            } else { // Portrait or square
                newWidth = size * aspectRatio;
            }

            canvas.width = newWidth;
            canvas.height = newHeight;

            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            // Use JPEG with quality 0.8 for significant size reduction
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = (error) => reject(error);
    });
};


interface AngleOption {
    label: string;
    modifier: string;
}
interface BaseTabProps {
  children: (props: {
    isLoading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setResult: React.Dispatch<React.SetStateAction<AiServiceResult | null>>;
    addHistoryItem: (prompt: string, result: AiServiceResult) => void;
    setLoadingMessage: React.Dispatch<React.SetStateAction<string>>;
    result: AiServiceResult | null;
  }) => React.ReactNode;
  tabKey: string;
  onEditRequest?: (image: ImageFile) => void;
  onVideoRequest?: (image: ImageFile) => void;
  onStyleChangeRequest?: (image: ImageFile, type: 'exterior' | 'interior') => void;
  onMaterialChangeRequest?: (image: ImageFile) => void;
  onGenerateTopDownRequest?: (image: ImageFile) => Promise<AiServiceResult>;
  onImageChange?: (url: string, index: number) => void;
  styleChangeType?: 'exterior' | 'interior';
  comparisonImage?: string;
  showAngleActions?: boolean;
  angleOptions?: AngleOption[];
  isPanorama?: boolean;
  resultMiddleContent?: React.ReactNode;
}

export const BaseTab: React.FC<BaseTabProps> = ({ 
  children, 
  tabKey, 
  onEditRequest, 
  onVideoRequest, 
  onStyleChangeRequest, 
  onMaterialChangeRequest, 
  onGenerateTopDownRequest, 
  onImageChange,
  styleChangeType, 
  comparisonImage, 
  showAngleActions, 
  angleOptions, 
  isPanorama = false,
  resultMiddleContent
}) => {
  const [isLoading, setLoading] = useState(false);
  const [result, setResult] = useState<AiServiceResult | null>(null);
  // Use session storage instead of local storage to clear on app reload but persist on tab switch
  const [history, setHistory] = useSessionStorage<HistoryItem[]>(`${LOCAL_STORAGE_HISTORY_KEY}_${tabKey}`, []);
  const [loadingMessage, setLoadingMessage] = useState('');

  const addHistoryItem = useCallback(async (prompt: string, result: AiServiceResult) => {
    // If it's a video result, use the comparison image (input image) as the thumbnail.
    if (result.videoUrl && comparisonImage) {
        try {
            const thumbnailUrl = await createThumbnail(comparisonImage);
            const newItem: HistoryItem = {
              id: new Date().toISOString(),
              prompt,
              thumbnail: thumbnailUrl,
              fullImage: comparisonImage,
              imageCount: 0, // Indicates it's not a multi-image result
              timestamp: Date.now(),
              category: tabKey,
              batchResults: result.batchResults
            };
            setHistory(prev => [newItem, ...prev].slice(0, 10));
        } catch (error) {
             console.error("Failed to create thumbnail for video history:", error);
        }
        return;
    }

    if (result.imageUrls && result.imageUrls.length > 0) {
      try {
        // Create a small thumbnail before saving to history
        const thumbnailUrl = await createThumbnail(result.imageUrls[0]);
        
        const newItem: HistoryItem = {
          id: new Date().toISOString(),
          prompt,
          thumbnail: thumbnailUrl, // Use the optimized thumbnail
          fullImage: result.imageUrls[0],
          imageUrls: result.imageUrls, // Save all images
          imageCount: result.imageUrls.length,
          timestamp: Date.now(),
          category: tabKey,
          batchResults: result.batchResults // Save batch info
        };

        // Limit history to 10 items for session storage
        setHistory(prev => [newItem, ...prev].slice(0, 10));
      } catch (error) {
          console.error("Failed to create thumbnail for history:", error);
          // Fallback: To prevent crashes, we'll avoid saving to history if thumbnail creation fails.
      }
    }
  }, [setHistory, comparisonImage, tabKey]);
  
  const handleHistorySelect = useCallback((item: HistoryItem) => {
    setLoading(false);
    setResult({
        imageUrls: item.imageUrls || (item.fullImage ? [item.fullImage] : [item.thumbnail]),
        batchResults: item.batchResults
    });
  }, []);

  const handleTopDownRequest = async (image: ImageFile) => {
      if (onGenerateTopDownRequest) {
          setLoading(true);
          setResult(null);
          try {
              const res = await onGenerateTopDownRequest(image);
              setResult(res);
              if(!res.error) {
                  addHistoryItem("3D Top-down View", res);
              }
          } catch (e) {
              console.error(e);
              setResult({ error: "Error generating top-down view" });
          }
          setLoading(false);
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        {children({ isLoading, setLoading, setResult, addHistoryItem, setLoadingMessage, result })}
      </div>
      <div>
        <ResultDisplay 
          result={result} 
          isLoading={isLoading} 
          onEditRequest={onEditRequest}
          onVideoRequest={onVideoRequest}
          onStyleChangeRequest={onStyleChangeRequest}
          onMaterialChangeRequest={onMaterialChangeRequest}
          onGenerateTopDownRequest={onGenerateTopDownRequest ? handleTopDownRequest : undefined}
          onImageChange={onImageChange}
          styleChangeType={styleChangeType}
          comparisonImage={comparisonImage} 
          showAngleActions={showAngleActions}
          angleOptions={angleOptions}
          loadingMessage={loadingMessage}
          isPanorama={isPanorama && !!result?.imageUrls?.length}
          middleContent={resultMiddleContent}
        />
        <HistoryList history={history} onItemSelect={handleHistorySelect} />
      </div>
    </div>
  );
};
