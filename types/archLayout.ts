
export type AssetType = 
  | "mat_bang" | "mat_cat" | "mat_dung" | "phoi_canh" | "tieu_canh" 
  | "diagram" | "phan_tich" | "bo_ky_thuat" | "y_tuong" | "khac";

export type AssetPriority = "main" | "sub" | "unknown";

export interface LayoutAsset {
  id: string;
  sourceType: "image" | "pdfPage";
  fileName: string;
  pageIndex?: number;
  previewUrl: string; // base64 or blob url
  width: number;
  height: number;
  detectedText?: string;
  type: AssetType;
  priority: AssetPriority;
  floor?: string | null;
  confidence: number;
  keywordsFound: string[];
  warnings: string[];
}

export interface LayoutFrame {
  id: string;
  x: number; // 0..1 relative to page width
  y: number; // 0..1 relative to page height
  w: number; // 0..1 relative to page width
  h: number; // 0..1 relative to page height
  label: string;
  accepts: AssetType[];
  fit: "cover" | "contain";
  role: "hero" | "normal";
}

export interface LayoutTheme {
  id: string;
  name: string;
  background: string; // hex or css var
  frameStroke: string;
  frameStrokeWidth: number;
  labelColor: string;
  labelBg: string;
  fontFamily: string;
}

export interface PageSpec {
  size: "A0" | "A1" | "A2" | "A3";
  orientation: "landscape" | "portrait";
  marginMM: number;
  widthMM: number;
  heightMM: number;
}

export interface LayoutTemplate {
  id: string;
  name: string;
  page: PageSpec;
  frames: LayoutFrame[];
  defaultThemeId?: string;
}

export interface AssetPlacement {
  assetId: string | null;
  fit: "cover" | "contain";
  zoom: number; // 1.0 = default
  panX: number; // pixel offset
  panY: number; // pixel offset
  labelOverride?: string;
  labelVisible: boolean;
}

export interface LayoutProject {
  templateId: string;
  themeId: string;
  pageSize: "A0" | "A1" | "A2" | "A3"; // User override
  placements: Record<string, AssetPlacement>; // frameId -> placement
}
