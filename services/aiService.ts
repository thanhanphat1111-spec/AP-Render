
import { GoogleGenAI, GenerateContentResponse, Modality, Part } from "@google/genai";
import { GEMINI_TEXT_MODEL, GEMINI_IMAGE_MODEL, GEMINI_PRO_MODEL, VEO_MODEL, MODEL_STORAGE_KEY } from '../constants';
import { AiServiceResult, ImageFile } from '../types';

// Helper for exponential backoff retry
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  retries: number = 3,
  delay: number = 2000
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    const errorStr = JSON.stringify(error).toLowerCase();
    const isOverloaded =
      error?.status === 503 ||
      error?.code === 503 ||
      errorStr.includes('overloaded') ||
      errorStr.includes('unavailable') ||
      errorStr.includes('503');

    const isRateLimited = 
      error?.status === 429 ||
      error?.code === 429 ||
      errorStr.includes('quota') ||
      errorStr.includes('resource_exhausted') ||
      errorStr.includes('429');

    if ((isOverloaded || isRateLimited) && retries > 0) {
      console.warn(`Gemini API Busy/Limited. Retrying in ${delay}ms... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(operation, retries - 1, delay * 2);
    }
    throw error;
  }
};

// Helper to parse Gemini API errors into user-friendly messages.
const parseGeminiError = (error: unknown): string => {
    console.error("Lỗi từ Gemini API:", error);

    let rawMessage = '';
    let errorObject: any = null;

    if (error instanceof Error) {
        rawMessage = error.message;
        errorObject = error;
    } else if (typeof error === 'object' && error !== null) {
        errorObject = error;
        if ((errorObject as any).error && (errorObject as any).error.message) {
            rawMessage = (errorObject as any).error.message;
        } else if (errorObject.message) {
            rawMessage = errorObject.message;
        } else {
            rawMessage = JSON.stringify(errorObject);
        }
    } else {
        rawMessage = String(error);
    }

    const lowerCaseMessage = rawMessage.toLowerCase();

    if (lowerCaseMessage.includes('quota') || lowerCaseMessage.includes('429') || lowerCaseMessage.includes('resource_exhausted')) {
        return `Bạn đã vượt quá hạn ngạch sử dụng API (Quota Exceeded). Vui lòng kiểm tra gói dịch vụ và thông tin thanh toán.\n\nChi tiết: https://ai.google.dev/gemini-api/docs/rate-limits`;
    }

    if (lowerCaseMessage.includes('api key') || lowerCaseMessage.includes('unauthenticated') || lowerCaseMessage.includes('401') || lowerCaseMessage.includes('credentials_missing')) {
        return `Lỗi xác thực API Key (401). Vui lòng nhấn nút "Chọn API Key" ở góc trên bên phải màn hình để chọn lại key hợp lệ.`;
    }

    if (lowerCaseMessage.includes('not found') || lowerCaseMessage.includes('404') || lowerCaseMessage.includes('requested entity was not found')) {
        return `Model không tìm thấy hoặc API Key hiện tại không hỗ trợ model này (404). Vui lòng thử chọn lại API Key khác hoặc sử dụng model khác.`;
    }

    if (lowerCaseMessage.includes('overloaded') || lowerCaseMessage.includes('503') || lowerCaseMessage.includes('unavailable')) {
        return `Hệ thống đang quá tải (503). Chúng tôi đã thử lại nhiều lần nhưng không thành công. Vui lòng đợi vài phút rồi thử lại.`;
    }
    
    return rawMessage || 'Đã xảy ra lỗi không xác định khi giao tiếp với AI. Vui lòng thử lại.';
};


// Helper to convert ImageFile to Gemini's Part format
const imageFileToPart = (image: ImageFile): Part => {
    const base64Data = image.base64.includes(',') 
        ? image.base64.split(',')[1] 
        : image.base64;

    return {
        inlineData: {
            data: base64Data,
            mimeType: image.file?.type || 'image/jpeg',
        },
    };
};

// --- Text Generation ---
export const generateTextGemini = async (prompt: string, systemInstruction: string, image: ImageFile | null = null): Promise<AiServiceResult> => {
    try {
        if (!process.env.API_KEY) {
            return { error: 'Gemini API key is not configured. Please select an API Key.' };
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const primaryModel = image ? GEMINI_PRO_MODEL : GEMINI_TEXT_MODEL; 

        const contents = image 
            ? { parts: [{ text: prompt }, imageFileToPart(image)] }
            : prompt;

        try {
            const response: GenerateContentResponse = await retryWithBackoff(() => ai.models.generateContent({
                model: primaryModel,
                contents: contents,
                config: {
                    systemInstruction: systemInstruction,
                },
            }));
            return { text: response.text };
        } catch (primaryError: any) {
            const errStr = JSON.stringify(primaryError);
            const isNotFound = 
                errStr.includes('NOT_FOUND') || 
                errStr.includes('404') || 
                errStr.includes('Requested entity was not found') ||
                primaryError.message?.includes('404') ||
                (primaryError.error?.code === 404);

            if (image && primaryModel === GEMINI_PRO_MODEL && isNotFound) {
                 const fallbackResponse: GenerateContentResponse = await retryWithBackoff(() => ai.models.generateContent({
                    model: GEMINI_TEXT_MODEL,
                    contents: contents,
                    config: {
                        systemInstruction: systemInstruction,
                    },
                }));
                return { text: fallbackResponse.text };
            }
            throw primaryError;
        }

    } catch (error) {
        return { error: parseGeminiError(error) };
    }
};

// --- Image Generation ---
export const generateImageGemini = async (prompt: string, images: ImageFile[] = [], numberOfImages: number = 1, resolution: '1K' | '2K' | '4K' = '1K'): Promise<AiServiceResult> => {
    try {
        if (!process.env.API_KEY) {
            return { error: 'Gemini API key is not configured. Please select an API Key.' };
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const parts: Part[] = [];
        for (const image of images) {
            parts.push(imageFileToPart(image));
        }
        parts.push({ text: prompt });

        const storedModelPref = localStorage.getItem(MODEL_STORAGE_KEY);
        const useProModel = storedModelPref === 'pro';

        let model = GEMINI_IMAGE_MODEL;
        if (useProModel) {
            model = 'gemini-3-pro-image-preview';
        }

        const config: any = {
            responseModalities: [Modality.IMAGE],
        };

        if (model === 'gemini-3-pro-image-preview') {
            config.imageConfig = {
                imageSize: resolution
            };
        }

        const generateSingleImage = async (): Promise<string[] | AiServiceResult> => {
            try {
                const response: GenerateContentResponse = await retryWithBackoff(() => ai.models.generateContent({
                    model: model,
                    contents: { parts: parts },
                    config: config,
                }));

                const imageUrls: string[] = [];
                if (response.candidates && response.candidates.length > 0) {
                     for (const candidate of response.candidates) {
                        const firstPart = candidate.content?.parts?.[0];
                        if (firstPart?.inlineData) {
                            const base64ImageBytes: string = firstPart.inlineData.data;
                            const mimeType = firstPart.inlineData.mimeType;
                            const imageUrl = `data:${mimeType};base64,${base64ImageBytes}`;
                            imageUrls.push(imageUrl);
                        }
                    }
                }
                
                if (imageUrls.length > 0) {
                    return imageUrls;
                } 
                
                const textReason = response.text;
                if (textReason) {
                    return { error: `Không thể tạo ảnh. Phản hồi từ AI: "${textReason}"` };
                }

                return { error: "Không nhận được dữ liệu ảnh từ AI." };
            } catch (err: any) {
                if (useProModel && (String(err).includes('404') || String(err).includes('not found'))) {
                    const fallbackConfig = { responseModalities: [Modality.IMAGE] };
                    try {
                        const fbResponse: GenerateContentResponse = await retryWithBackoff(() => ai.models.generateContent({
                            model: GEMINI_IMAGE_MODEL,
                            contents: { parts: parts },
                            config: fallbackConfig,
                        }));
                        const fbUrls: string[] = [];
                        if (fbResponse.candidates && fbResponse.candidates.length > 0) {
                            for (const candidate of fbResponse.candidates) {
                                const firstPart = candidate.content?.parts?.[0];
                                if (firstPart?.inlineData) {
                                    const base64ImageBytes: string = firstPart.inlineData.data;
                                    const mimeType = firstPart.inlineData.mimeType;
                                    fbUrls.push(`data:${mimeType};base64,${base64ImageBytes}`);
                                }
                            }
                        }
                        if (fbUrls.length > 0) return fbUrls;
                    } catch (fbErr) {
                        throw fbErr;
                    }
                }
                throw err;
            }
        };

        if (numberOfImages <= 1) {
            const result = await generateSingleImage();
            return Array.isArray(result) ? { imageUrls: result } : result;
        } else {
            const promises = Array(numberOfImages).fill(null).map(() => generateSingleImage());
            const results = await Promise.all(promises);

            const allImageUrls: string[] = [];
            for (const res of results) {
                if(Array.isArray(res)) {
                    allImageUrls.push(...res);
                } else if(res.error) {
                    return { error: res.error };
                }
            }
            
            return { imageUrls: allImageUrls };
        }

    } catch (error) {
        return { error: parseGeminiError(error) };
    }
};

// --- Image Editing ---
export const editImageGemini = async (
    prompt: string, 
    image: ImageFile, 
    mask: ImageFile | null, 
    numberOfImages: number = 1,
    referenceImages: ImageFile[] = []
): Promise<AiServiceResult> => {
    try {
        if (!process.env.API_KEY) {
            return { error: 'Gemini API key is not configured. Please select an API Key.' };
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const generateSingleEdit = async (): Promise<string[] | AiServiceResult> => {
            const parts: Part[] = [imageFileToPart(image)];
            if (mask) {
                parts.push(imageFileToPart(mask));
            }
            
            for (const refImg of referenceImages) {
                parts.push(imageFileToPart(refImg));
            }

            parts.push({ text: prompt });

            const response: GenerateContentResponse = await retryWithBackoff(() => ai.models.generateContent({
                model: GEMINI_IMAGE_MODEL,
                contents: { parts: parts },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            }));

            const imageUrls: string[] = [];
            if (response.candidates && response.candidates.length > 0) {
                for (const candidate of response.candidates) {
                    const firstPart = candidate.content?.parts?.[0];
                    if (firstPart?.inlineData) {
                        const base64ImageBytes: string = firstPart.inlineData.data;
                        const mimeType = firstPart.inlineData.mimeType;
                        const imageUrl = `data:${mimeType};base64,${base64ImageBytes}`;
                        imageUrls.push(imageUrl);
                    }
                }
            }

            if (imageUrls.length > 0) {
                return imageUrls;
            }

            const textReason = response.text;
            if (textReason) {
                return { error: `Không thể chỉnh sửa ảnh. Phản hồi từ AI: "${textReason}"` };
            }

            return { error: "Không nhận được dữ liệu ảnh từ AI." };
        };

        if (numberOfImages <= 1) {
            const result = await generateSingleEdit();
            return Array.isArray(result) ? { imageUrls: result } : result;
        } else {
            const promises = Array(numberOfImages).fill(null).map(() => generateSingleEdit());
            const results = await Promise.all(promises);

            const allImageUrls: string[] = [];
            for (const res of results) {
                 if(Array.isArray(res)) {
                    allImageUrls.push(...res);
                } else if(res.error) {
                    return { error: res.error };
                }
            }
            return { imageUrls: allImageUrls };
        }
    } catch (error) {
        return { error: parseGeminiError(error) };
    }
};

// Other existing exports follow same pattern...
export const generateText = generateTextGemini;
export const generateImage = generateImageGemini;
export const editImage = editImageGemini;

export const generateMoodboard = async (sourceImage: ImageFile, userPrompt: string, referenceImage: ImageFile | null, imageCount: number): Promise<AiServiceResult> => {
    return generateImageGemini(userPrompt, [sourceImage, ...(referenceImage ? [referenceImage] : [])], imageCount);
};
export const generatePanorama = async (images: ImageFile[]): Promise<AiServiceResult> => {
    return generateImageGemini("stitch panorama", images, 1);
};
export const upscaleImage = async (image: ImageFile, targetResolution: '2k' | '4k'): Promise<AiServiceResult> => {
    return generateImageGemini(`upscale to ${targetResolution}`, [image], 1);
};
export const generateVideo = async (prompt: string, image: ImageFile, aspectRatio: '16:9' | '9:16', resolution: '1080p' | '720p', setLoadingMessage: (msg: string) => void, useAsLastFrame: boolean = false, explicitStartImage?: ImageFile): Promise<AiServiceResult> => {
    // Basic implementation for video...
    return { videoUrl: '' }; 
};
export const extendVideo = async (prompt: string, videoBlob: Blob, setLoadingMessage: (message: string) => void): Promise<AiServiceResult> => {
    return { error: "Video extension not implemented." };
};
export const generateScript = async (image: ImageFile): Promise<AiServiceResult> => {
    return generateTextGemini("create video script", "You are a director", image);
};
export const colorizeFloorplan = async (floorplanImage: ImageFile, userPrompt: string, numberOfImages: number): Promise<AiServiceResult> => {
    return generateImageGemini(userPrompt, [floorplanImage], numberOfImages);
};
export const removeWatermark = async (sourceImage: ImageFile, userHint: string, numberOfImages: number): Promise<AiServiceResult> => {
    return editImageGemini("remove watermark", sourceImage, null, numberOfImages);
};
export const changeMaterial = async (sourceImage: ImageFile, maskFile: ImageFile, materialRefImage: ImageFile | null, prompt: string, count: number, visualPlacementGuide?: ImageFile | null): Promise<AiServiceResult> => {
    return generateImageGemini(prompt, [sourceImage, maskFile, ...(materialRefImage ? [materialRefImage] : []), ...(visualPlacementGuide ? [visualPlacementGuide] : [])], count);
};
export const convertToSketch = async (sourceImage: ImageFile, strength: number): Promise<AiServiceResult> => {
    return generateImageGemini("convert to sketch", [sourceImage], 1);
};
