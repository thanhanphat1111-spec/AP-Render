
export enum ActiveTab {
  Exterior = 'exterior',
  Interior = 'interior',
  Floorplan = 'floorplan',
  Editing = 'editing',
  Video = 'video',
  MultiVideo = 'multi_video',
  Movie = 'movie',
  Renovation = 'renovation', // New merged tab
  CanvaMix = 'canva_mix', // Deprecated, kept for type safety if needed temporarily
  ReMake = 'remake',
  ReUp = 'reup', // Deprecated
  BV2D = 'bv2d',
  MoodboardMain = 'moodboard_main',
  Utilities = 'utilities',
  Storage = 'storage',
}

export interface ImageFile {
  file: File;
  base64: string;
  url: string;
  width?: number;
  height?: number;
}

// Type used in new InsertBuilding and CanvaMixInterior code
export interface SourceImage {
    base64: string;
    mimeType: string;
    file?: File; // Optional link back to original file if needed
}

export interface ObjectTransform {
  x: number; // position x in %
  y: number; // position y in %
  scale: number; // width percentage
  rotation: number; // degrees (0-360)
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export interface AiServiceResult {
  imageUrls?: string[];
  text?: string;
  error?: string;
  isSimulation?: boolean;
  videoUrl?: string;
  batchResults?: { sourceUrl: string; resultUrl: string; label?: string }[];
}

export interface HistoryItem {
  id: string;
  prompt: string;
  thumbnail: string;
  fullImage: string;
  imageCount: number;
  timestamp: number;
  category?: string; 
  imageUrls?: string[];
  batchResults?: { sourceUrl: string; resultUrl: string; label?: string }[];
}

// Type for InsertBuildingTab history
export interface RenderHistoryItem {
    id: string;
    prompt: string;
    images: string[];
    timestamp: string;
}

export interface VideoScene {
  id: string;
  image: ImageFile;
  emptyRoomImage?: ImageFile;
  prompt: string;
  generatedVideoUrl?: string;
  isLoading: boolean;
  error?: string;
  isExtended?: boolean;
}

export interface TimelineClip {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string; 
  duration: number; 
  transitionEffect?: string;
}

export interface AudioTrack {
  file: File;
  url: string;
  name: string;
  offset: number; 
  volume: number;
  duration?: number;
}
