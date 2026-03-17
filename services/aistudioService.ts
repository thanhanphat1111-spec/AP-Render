import { AiServiceResult, ImageFile } from '../types';

// Augment the Window interface for Google AI Studio
declare global {
  // This interface will be merged with any existing AIStudio interface definitions.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    ai?: {
      canCreateTextSession: () => Promise<'readily' | 'after-prompt'>;
      createTextSession: (options?: { systemInstruction?: string }) => Promise<{
        prompt: (text: string) => Promise<string>;
      }>;
      canCreateImageSession: () => Promise<'readily' | 'after-prompt'>;
      createImageSession: () => Promise<{
          process: (prompt: string | { prompt: string, startingImage?: Blob }) => Promise<Blob>;
      }>;
    };
    aistudio?: AIStudio;
  }
}

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const isLiveApiAvailable = (): boolean => {
    return !!(window.ai && window.ai.canCreateTextSession && window.ai.canCreateImageSession);
}

export const generateTextLive = async (prompt: string, systemInstruction: string): Promise<AiServiceResult> => {
    if (!isLiveApiAvailable() || !window.ai) {
        return { error: "Google AI Studio Live API is not available." };
    }
    try {
        const session = await window.ai.createTextSession({ systemInstruction });
        const result = await session.prompt(prompt);
        return { text: result };
    } catch (error) {
        console.error("Live API text generation error:", error);
        return { error: `Live API Error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
};


export const generateImageLive = async (prompt: string, images: ImageFile[] = []): Promise<AiServiceResult> => {
     if (!isLiveApiAvailable() || !window.ai?.createImageSession) {
        return { error: "Google AI Studio Live API for images is not available." };
    }
    try {
        const session = await window.ai.createImageSession();
        const imageBlob = await session.process(
            images.length > 0
                ? { prompt, startingImage: images[0].file }
                : prompt
        );
        const imageUrl = await blobToBase64(imageBlob);
        return { imageUrls: [imageUrl] };
    } catch (error) {
        console.error("Live API image generation error:", error);
        return { error: `Live API Error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
};