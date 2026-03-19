import { AiServiceResult, ImageFile } from '../types';

const callVercelBackend = async (action: string, payload: any): Promise<AiServiceResult> => {
    try {
        const response = await fetch('/api/replicate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...payload }),
        });
        const data = await response.json();
        if (!response.ok) return { error: data.error || 'Lỗi kết nối API.' };
        return data;
    } catch (error: any) {
        console.error(`Lỗi API:`, error);
        return { error: 'Không thể kết nối máy chủ.' };
    }
};

export const generateText = async (prompt: string, systemInstruction: string, image: ImageFile | null = null): Promise<AiServiceResult> => {
    const fullPrompt = `${systemInstruction}\n\n${prompt}`;
    return callVercelBackend('generateText', { prompt: fullPrompt });
};

export const generateImage = async (prompt: string, images: ImageFile[] = [], numberOfImages: number = 1, resolution: '1K' | '2K' | '4K' = '1K'): Promise<AiServiceResult> => {
    if (images.length > 0) {
        return callVercelBackend('imageToImage', { prompt, imageBase64: images[0].base64 });
    }
    return callVercelBackend('generateImage', { prompt });
};

export const editImage = async (prompt: string, image: ImageFile, mask: ImageFile | null, numberOfImages: number = 1): Promise<AiServiceResult> => {
    return callVercelBackend('editImage', { prompt, imageBase64: image.base64 });
};

export const generateMoodboard = async (sourceImage: ImageFile, userPrompt: string, referenceImage: ImageFile | null, imageCount: number): Promise<AiServiceResult> => {
    return generateImage(userPrompt, [sourceImage], imageCount);
};

// Các tính năng phụ đang được vô hiệu hóa tạm thời để tránh lỗi sập app khi đổi model
export const upscaleImage = async (image: ImageFile, targetResolution: '2k' | '4k'): Promise<AiServiceResult> => ({ error: "Tính năng Upscale đang cập nhật qua Replicate." });
export const generateVideo = async (): Promise<AiServiceResult> => ({ error: "Tính năng Video đang cập nhật." });
export const extendVideo = async (): Promise<AiServiceResult> => ({ error: "Chưa hỗ trợ." });
export const generateScript = async (): Promise<AiServiceResult> => ({ error: "Chưa hỗ trợ." });
export const colorizeFloorplan = async (): Promise<AiServiceResult> => ({ error: "Chưa hỗ trợ." });
export const removeWatermark = async (): Promise<AiServiceResult> => ({ error: "Chưa hỗ trợ." });
export const changeMaterial = async (): Promise<AiServiceResult> => ({ error: "Chưa hỗ trợ." });
export const convertToSketch = async (): Promise<AiServiceResult> => ({ error: "Chưa hỗ trợ." });
export const generatePanorama = async (): Promise<AiServiceResult> => ({ error: "Chưa hỗ trợ." });
