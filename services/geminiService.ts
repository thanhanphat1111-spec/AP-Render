import { GoogleGenAI, GenerateContentResponse, Modality, Part } from "@google/genai";
import { GEMINI_TEXT_MODEL, GEMINI_IMAGE_MODEL, GEMINI_PRO_MODEL, VEO_MODEL } from '../constants';
import { AiServiceResult, ImageFile } from '../types';

// Helper for exponential backoff retry
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    const isOverloaded =
      error?.status === 503 ||
      error?.code === 503 ||
      (error?.message && error.message.includes('overloaded')) ||
      (error?.error?.code === 503) ||
      (error?.error?.status === 'UNAVAILABLE');

    if (isOverloaded && retries > 0) {
      console.warn(`Model overloaded (503). Retrying in ${delay}ms... (${retries} retries left)`);
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
        // Handle the specific error structure: { error: { code, message, status } }
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

    // Handle Quota Errors
    if (lowerCaseMessage.includes('quota') || lowerCaseMessage.includes('429') || lowerCaseMessage.includes('resource_exhausted')) {
        return `Bạn đã vượt quá hạn ngạch sử dụng API (Quota Exceeded). Vui lòng kiểm tra gói dịch vụ và thông tin thanh toán.\n\nChi tiết: https://ai.google.dev/gemini-api/docs/rate-limits`;
    }

    // Handle Auth Errors (401)
    if (lowerCaseMessage.includes('api key') || lowerCaseMessage.includes('unauthenticated') || lowerCaseMessage.includes('401') || lowerCaseMessage.includes('credentials_missing')) {
        return `Lỗi xác thực API Key (401). Vui lòng nhấn nút "Chọn API Key" ở góc trên bên phải màn hình để chọn lại key hợp lệ.`;
    }

    // Handle Not Found Errors (404) - Model missing or Key not allowlisted
    if (lowerCaseMessage.includes('not found') || lowerCaseMessage.includes('404') || lowerCaseMessage.includes('requested entity was not found')) {
        return `Model không tìm thấy hoặc API Key hiện tại không hỗ trợ model này (404). Vui lòng thử chọn lại API Key khác hoặc sử dụng model khác.`;
    }

    // Handle Overloaded Errors (503)
    if (lowerCaseMessage.includes('overloaded') || lowerCaseMessage.includes('503') || lowerCaseMessage.includes('unavailable')) {
        return `Hệ thống đang quá tải (503). Chúng tôi đã thử lại nhiều lần nhưng không thành công. Vui lòng đợi vài phút rồi thử lại.`;
    }
    
    return rawMessage || 'Đã xảy ra lỗi không xác định khi giao tiếp với AI. Vui lòng thử lại.';
};


// Helper to convert ImageFile to Gemini's Part format
const imageFileToPart = (image: ImageFile): Part => {
    // Handle both Data URI (with prefix) and raw base64 strings
    const base64Data = image.base64.includes(',') 
        ? image.base64.split(',')[1] 
        : image.base64;

    return {
        inlineData: {
            data: base64Data,
            mimeType: image.file.type || 'image/jpeg', // Fallback mime type if file.type is missing
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
        
        // Try Pro model first for images, but allow fallback to Flash
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
            // Fallback logic: If Pro model fails with 404 (Not Found), try Flash model
            const errStr = JSON.stringify(primaryError);
            const isNotFound = 
                errStr.includes('NOT_FOUND') || 
                errStr.includes('404') || 
                errStr.includes('Requested entity was not found') ||
                primaryError.message?.includes('404') ||
                (primaryError.error?.code === 404);

            if (image && primaryModel === GEMINI_PRO_MODEL && isNotFound) {
                 console.warn(`Model ${GEMINI_PRO_MODEL} failed (404). Falling back to ${GEMINI_TEXT_MODEL}.`);
                 const fallbackResponse: GenerateContentResponse = await retryWithBackoff(() => ai.models.generateContent({
                    model: GEMINI_TEXT_MODEL,
                    contents: contents,
                    config: {
                        systemInstruction: systemInstruction,
                    },
                }));
                return { text: fallbackResponse.text };
            }
            throw primaryError; // Re-throw if not a handled fallback case
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
        // Add images first
        for (const image of images) {
            parts.push(imageFileToPart(image));
        }
        // Add text prompt last
        parts.push({ text: prompt });

        // Determine model based on resolution
        const isHighRes = resolution === '2K' || resolution === '4K';
        const model = isHighRes ? 'gemini-3-pro-image-preview' : GEMINI_IMAGE_MODEL;

        const config: any = {
            responseModalities: [Modality.IMAGE],
        };

        if (isHighRes) {
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
                
                // If no image, check for a text response which is likely an error/rejection message.
                const textReason = response.text;
                if (textReason) {
                    return { error: `Không thể tạo ảnh (${resolution}). Phản hồi từ AI: "${textReason}"` };
                }

                return { error: "Không nhận được dữ liệu ảnh từ AI. Vui lòng thử lại hoặc thay đổi mô tả." };
            } catch (err: any) {
                // Fallback to Flash if Pro/HighRes fails with 404/Not Found
                if (isHighRes && (String(err).includes('404') || String(err).includes('not found'))) {
                    console.warn(`Model ${model} failed. Falling back to ${GEMINI_IMAGE_MODEL} (1K).`);
                    // Recursive call with 1K to fallback
                    return generateImageGemini(prompt, images, 1, '1K');
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
                    // If any of the parallel requests fail, return the first error message.
                    return { error: res.error };
                }
            }
            
            return { imageUrls: allImageUrls };
        }

    } catch (error) {
        return { error: parseGeminiError(error) };
    }
};

// --- Panorama Generation ---
export const generatePanoramaGemini = async (images: ImageFile[]): Promise<AiServiceResult> => {
    const engineeredPrompt = `You are an expert in computational photography, specializing in creating 360-degree virtual tours. Your task is to generate a single, seamless, high-quality 360-degree equirectangular panorama from an ordered sequence of overlapping photographs.

**CRITICAL INSTRUCTIONS:**

1.  **Output Format:** The final output MUST be a single 360° equirectangular panoramic image. This is the standard format used for VR and 360 viewers. Do NOT output a simple wide 2D photo.
2.  **Input Analysis:** You will receive a series of images provided in a specific order. These images represent a camera panning around a fixed central point, capturing a full circle of the environment. Image 1 is the start, Image 2 is next, and so on, until the last image which should connect back to the first.
3.  **Seamless Stitching:** Your primary goal is to stitch these images together flawlessly. The seams between images must be completely invisible.
4.  **Geometric Correction:** You must correct for all lens distortion and perspective shifts. All straight lines in the real world (walls, ceilings, floors) must appear straight in the final panorama. Ensure a perfect spherical projection.
5.  **Photometric Correction:** Adjust and blend the exposure, brightness, contrast, and color balance across all images to create a single, consistent lighting environment. There should be no visible bands or patches of different brightness or color.
6.  **High Fidelity:** DO NOT add, remove, or alter any objects, furniture, or architectural details present in the source images. This is a technical stitching task, not a creative generation one.
7.  **Final Quality:** The resulting panorama must be high-resolution, sharp, and photorealistic, suitable for an immersive virtual tour experience.`;
    
    return generateImageGemini(engineeredPrompt, images, 1);
};


// --- Image Editing ---
export const editImageGemini = async (
    prompt: string, 
    image: ImageFile, 
    mask: ImageFile | null, 
    numberOfImages: number = 1,
    referenceImages: ImageFile[] = [] // New optional parameter for Reference Images
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
            
            // Add reference images if provided (e.g., for Style Transfer or Material Change)
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

            return { error: "Không nhận được dữ liệu ảnh từ AI sau khi chỉnh sửa." };
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

// --- Upscaling ---
export const upscaleImageGemini = async (image: ImageFile, targetResolution: '2k' | '4k'): Promise<AiServiceResult> => {
    const prompt = `Upscale this image to ${targetResolution} resolution. Enhance the details, sharpness, and clarity while maintaining photorealism. The final output should be a high-quality, crisp image suitable for professional use.`;
    return generateImageGemini(prompt, [image], 1);
};

// --- Video Generation ---
export const generateVideoGemini = async (
    prompt: string, 
    image: ImageFile, 
    aspectRatio: '16:9' | '9:16', 
    resolution: '1080p' | '720p',
    setLoadingMessage: (message: string) => void,
    useAsLastFrame: boolean = false, // PARAMETER: Treat input image as LAST frame (legacy auto-gen mode)
    explicitStartImage?: ImageFile // NEW PARAMETER: Explicit Start Frame
): Promise<AiServiceResult> => {
    try {
        if (!process.env.API_KEY) {
            return { error: 'Gemini API key is not configured. Please select an API Key.' };
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const videoParams: any = {
            model: VEO_MODEL,
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: resolution,
                aspectRatio: aspectRatio
            }
        };

        if (explicitStartImage) {
             // MODE 3: Explicit Start Frame (Empty) -> End Frame (Original)
             // This is the most robust method for construction videos
             setLoadingMessage("Đang tạo video từ cặp ảnh (Phòng thô -> Hoàn thiện)...");
             
             videoParams.image = {
                imageBytes: explicitStartImage.base64.split(',')[1],
                mimeType: explicitStartImage.file.type,
             };
             
             videoParams.config.lastFrame = {
                imageBytes: image.base64.split(',')[1],
                mimeType: image.file.type,
             };

        } else if (useAsLastFrame) {
             // MODE 2: Legacy CONSTRUCTION MODE (Auto-generate Empty)
             // Start Frame = Empty Room (Generated internally)
             // End Frame = Furnished (Original Uploaded Image)
             setLoadingMessage("Đang tạo ảnh hiện trạng thô (Empty Room)...");

             const emptyRoomPrompt = "Generate a photorealistic image of this EXACT room but completely empty. Remove all furniture, cabinets, decorations, and appliances. Show only the raw architectural structure: concrete/tiled floor, plastered walls, windows, and ceiling. Keep the camera angle, perspective, and lighting EXACTLY the same as reference image. High quality, 8k.";
             
             const emptyRoomResult = await generateImageGemini(emptyRoomPrompt, [image], 1);

             if (emptyRoomResult.error || !emptyRoomResult.imageUrls?.[0]) {
                 return { error: "Không thể tạo ảnh phòng thô để làm dữ liệu đầu vào cho video: " + (emptyRoomResult.error || "Lỗi không xác định") };
             }

             const emptyRoomDataUrl = emptyRoomResult.imageUrls[0];
             const emptyRoomBase64 = emptyRoomDataUrl.split(',')[1];
             let emptyMime = 'image/jpeg'; 
             const mimeMatch = emptyRoomDataUrl.match(/:(.*?);/);
             if (mimeMatch) emptyMime = mimeMatch[1];

             videoParams.image = {
                imageBytes: emptyRoomBase64,
                mimeType: emptyMime,
             };
             
             videoParams.config.lastFrame = {
                imageBytes: image.base64.split(',')[1],
                mimeType: image.file.type,
             };
             
             setLoadingMessage("Đang tạo video lắp đặt nội thất (Empty -> Original)...");

        } else {
             // MODE 1: DEFAULT (Start from image -> Generate forward)
             setLoadingMessage("Bắt đầu yêu cầu tạo video...");
             videoParams.image = {
                imageBytes: image.base64.split(',')[1],
                mimeType: image.file.type,
             };
        }

        let operation: any = await retryWithBackoff(() => ai.models.generateVideos(videoParams));
        
        setLoadingMessage("Đang xử lý video, quá trình này có thể mất vài phút...");
        let attempts = 0;
        while (!operation.done && attempts < 30) { // 30 attempts * 10s = 5 minutes timeout
            await new Promise(resolve => setTimeout(resolve, 10000));
            setLoadingMessage(`Đang kiểm tra tiến độ... (thử lần ${attempts + 1})`);
            // Wrap getVideosOperation as well in case of transient API issues during polling
            operation = await retryWithBackoff(() => ai.operations.getVideosOperation({ operation: operation }));
            attempts++;
        }

        if (!operation.done) {
            return { error: "Quá trình tạo video mất quá nhiều thời gian và đã hết hạn." };
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

        if (!downloadLink) {
            return { error: "Không thể lấy được link tải video từ AI." };
        }
        
        setLoadingMessage("Đang tải video đã tạo...");
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            return { error: `Không thể tải video từ link được cung cấp. Status: ${response.statusText}` };
        }
        const videoBlob = await response.blob();
        const videoUrl = URL.createObjectURL(videoBlob);

        return { videoUrl };
    } catch (error) {
        return { error: parseGeminiError(error) };
    }
};

// --- Video Extension ---
export const extendVideoGemini = async (
    prompt: string,
    videoBlob: Blob,
    setLoadingMessage: (message: string) => void
): Promise<AiServiceResult> => {
    try {
         if (!process.env.API_KEY) {
             return { error: 'Gemini API key is not configured. Please select an API Key.' };
        }
        // const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
       return { error: "Tính năng nối dài video yêu cầu Video ID từ phiên làm việc trước đó (chưa được lưu trữ). Vui lòng sử dụng tính năng 'Tạo video' từ ảnh frame cuối." };

    } catch (error) {
        return { error: parseGeminiError(error) };
    }
}

// --- Script Generation for Multi-Video ---
export const generateScriptGemini = async (image: ImageFile): Promise<AiServiceResult> => {
     const prompt = "Analyze this image and create a detailed 8-second architectural video prompt. Describe camera movement (pan, zoom, orbit), subject focus, and lighting. Keep it concise (under 50 words). Vietnamese language.";
     return await generateTextGemini(prompt, "You are an expert video director AI.", image);
}

// --- Floorplan Coloring ---
export const colorizeFloorplanGemini = async (floorplanImage: ImageFile, userPrompt: string, numberOfImages: number): Promise<AiServiceResult> => {
    const prompt = `Colorize this 2D black and white floorplan. Apply realistic materials, textures, and shadows to create a visually appealing, presentation-ready top-down view. The background outside the floorplan should be white. Follow the user's request for materials and style: "${userPrompt}"`;
    return generateImageGemini(prompt, [floorplanImage], numberOfImages);
};

// --- Watermark Removal ---
export const removeWatermarkGemini = async (sourceImage: ImageFile, userHint: string, numberOfImages: number): Promise<AiServiceResult> => {
    const prompt = `Carefully remove any and all watermarks, text, logos, or other overlays from this image. Reconstruct the underlying area to look completely natural and seamless, matching the original image's texture, lighting, and color. ${userHint ? `User hint: "${userHint}"` : ''}`;
    // Using editImageGemini, as it's conceptually an edit, even though generateImageGemini could also work.
    return editImageGemini(prompt, sourceImage, null, numberOfImages);
};

// --- Material Change ---
export const changeMaterialGemini = async (
    sourceImage: ImageFile,
    maskFile: ImageFile,
    materialRefImage: ImageFile | null,
    prompt: string,
    count: number,
    visualPlacementGuide?: ImageFile | null
): Promise<AiServiceResult> => {
    const imagesToSend: ImageFile[] = [sourceImage, maskFile];
    let engineeredPrompt = `
        IMAGE 1: Source image.
        IMAGE 2: Mask indicating the area to change (white area).
    `;

    if (materialRefImage) {
        imagesToSend.push(materialRefImage);
        engineeredPrompt += `IMAGE 3: This is the reference image for the new material's style, texture, and color.\n`;
    }
    if (visualPlacementGuide) {
        imagesToSend.push(visualPlacementGuide);
        engineeredPrompt += `IMAGE 4: This is a visual guide showing the approximate placement, scale, and orientation for the new material.\n`;
    }

    engineeredPrompt += `
        TASK: In IMAGE 1, replace the material ONLY within the white area of the mask (IMAGE 2).
        The new material should be: "${prompt}".
        ${materialRefImage ? 'Strongly adhere to the style, texture, and color palette from IMAGE 3.' : ''}
        ${visualPlacementGuide ? 'Use IMAGE 4 as a guide for the scale, rotation, and placement of the material texture.' : ''}
        The result must be photorealistic and seamlessly integrated, preserving the original lighting, shadows, and perspective of IMAGE 1.
    `;

    return generateImageGemini(engineeredPrompt, imagesToSend, count);
};

// --- Convert to Sketch ---
export const convertToSketchGemini = async (sourceImage: ImageFile, strength: number): Promise<AiServiceResult> => {
    // Updated prompt for Watercolor Hand-Drawn Sketch
    const prompt = `Convert this architectural/interior image into a artistic watercolor hand-drawn sketch. 
    Style: Soft watercolor wash with distinct pencil or ink outlines. 
    Technique: Architectural sketching style, looser strokes but maintaining perspective accuracy.
    Details: The level of "sketchiness" should be around ${strength}%. 
    Color: Use soft, muted watercolor tones based on the original image's palette. 
    Goal: It should look like a high-quality concept sketch created by an architect before the final render.`;
    
    return generateImageGemini(prompt, [sourceImage], 1);
};

// --- Virtual Tour ---
export type TourMoveType = 'pan-up' | 'pan-down' | 'pan-left' | 'pan-right' | 'orbit-left' | 'orbit-right' | 'zoom-in' | 'zoom-out';

export const generateVirtualTourImage = async (image: { base64: string, mimeType: string }, moveType: TourMoveType, magnitude: number): Promise<string | null> => {
    const promptMap: Record<TourMoveType, string> = {
        'pan-up': `Pan camera upwards by ${magnitude} degrees. Keep the exact same location and perspective, just tilt the view up.`,
        'pan-down': `Pan camera downwards by ${magnitude} degrees. Keep the exact same location and perspective, just tilt the view down.`,
        'pan-left': `Pan camera to the left by ${magnitude} degrees. Reveal what is to the left of the current frame. Maintain consistency.`,
        'pan-right': `Pan camera to the right by ${magnitude} degrees. Reveal what is to the right of the current frame. Maintain consistency.`,
        'orbit-left': `Orbit the camera ${magnitude} degrees to the left around the central subject. Show the subject from a slightly different angle.`,
        'orbit-right': `Orbit the camera ${magnitude} degrees to the right around the central subject. Show the subject from a slightly different angle.`,
        'zoom-in': `Zoom in by ${magnitude}%. Move the camera closer to the center subject. Keep details sharp.`,
        'zoom-out': `Zoom out by ${magnitude}%. Move the camera backwards to reveal more of the surroundings.`
    };

    const prompt = `Virtual Tour Navigation Task:
    Input is the current view.
    Action: ${promptMap[moveType]}
    Constraint: The output must look like the NEXT FRAME in a continuous video or 360 tour. Maintain photorealism, lighting, and architectural consistency perfectly.`;

    const imageFile: ImageFile = {
        file: new File([], 'tour_src', { type: image.mimeType }),
        base64: `data:${image.mimeType};base64,${image.base64}`,
        url: ''
    };

    const res = await generateImageGemini(prompt, [imageFile], 1);
    return res.imageUrls?.[0] || null;
};

// Export aliases to maintain compatibility with existing imports
export const generateText = generateTextGemini;
export const generateImage = generateImageGemini;
export const generatePanorama = generatePanoramaGemini;
export const editImage = editImageGemini;
export const upscaleImage = upscaleImageGemini;
export const generateVideo = generateVideoGemini;
export const extendVideo = extendVideoGemini;
export const generateScript = generateScriptGemini;
export const colorizeFloorplan = colorizeFloorplanGemini;
export const removeWatermark = removeWatermarkGemini;
export const changeMaterial = changeMaterialGemini;
export const convertToSketch = convertToSketchGemini;