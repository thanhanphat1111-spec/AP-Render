
import { LayoutTemplate, LayoutTheme } from "../types/archLayout";

export const LAYOUT_THEMES: LayoutTheme[] = [
    {
        id: 'dark_gold',
        name: 'Dark Gold',
        background: '#1a1a1d',
        frameStroke: '#d4af37',
        frameStrokeWidth: 2,
        labelColor: '#d4af37',
        labelBg: 'transparent',
        fontFamily: 'Inter, sans-serif'
    },
    {
        id: 'blueprint',
        name: 'Blueprint',
        background: '#0a3d62',
        frameStroke: '#ecf0f1',
        frameStrokeWidth: 2,
        labelColor: '#ecf0f1',
        labelBg: 'rgba(0,0,0,0.2)',
        fontFamily: 'Monospace'
    },
    {
        id: 'white_minimal',
        name: 'White Minimal',
        background: '#ffffff',
        frameStroke: '#333333',
        frameStrokeWidth: 1,
        labelColor: '#333333',
        labelBg: 'transparent',
        fontFamily: 'sans-serif'
    }
];

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
    {
        id: 'DarkGold_01',
        name: 'Layout 01: Hero Left + Grid Right',
        page: { size: 'A1', orientation: 'landscape', marginMM: 10, widthMM: 841, heightMM: 594 },
        defaultThemeId: 'dark_gold',
        frames: [
            { id: 'f1', x: 0.02, y: 0.02, w: 0.48, h: 0.96, label: 'Ý TƯỞNG / PHỐI CẢNH CHÍNH', accepts: ['phoi_canh', 'y_tuong'], fit: 'cover', role: 'hero' },
            { id: 'f2', x: 0.52, y: 0.02, w: 0.22, h: 0.30, label: 'MẶT BẰNG', accepts: ['mat_bang'], fit: 'contain', role: 'normal' },
            { id: 'f3', x: 0.76, y: 0.02, w: 0.22, h: 0.30, label: 'MẶT CẮT', accepts: ['mat_cat', 'mat_dung'], fit: 'contain', role: 'normal' },
            { id: 'f4', x: 0.52, y: 0.34, w: 0.46, h: 0.30, label: 'DIAGRAM / PHÂN TÍCH', accepts: ['diagram', 'phan_tich'], fit: 'contain', role: 'normal' },
            { id: 'f5', x: 0.52, y: 0.66, w: 0.46, h: 0.32, label: 'PHỐI CẢNH PHỤ', accepts: ['phoi_canh', 'tieu_canh'], fit: 'cover', role: 'normal' }
        ]
    },
    {
        id: 'DarkGold_02',
        name: 'Layout 02: Twin Heroes + Tech Column',
        page: { size: 'A1', orientation: 'landscape', marginMM: 10, widthMM: 841, heightMM: 594 },
        defaultThemeId: 'dark_gold',
        frames: [
            { id: 'f1', x: 0.02, y: 0.02, w: 0.35, h: 0.96, label: 'PHỐI CẢNH NGÀY', accepts: ['phoi_canh'], fit: 'cover', role: 'hero' },
            { id: 'f2', x: 0.39, y: 0.02, w: 0.35, h: 0.96, label: 'PHỐI CẢNH ĐÊM/NỘI THẤT', accepts: ['phoi_canh', 'tieu_canh'], fit: 'cover', role: 'hero' },
            { id: 'f3', x: 0.76, y: 0.02, w: 0.22, h: 0.22, label: 'MẶT BẰNG TỔNG THỂ', accepts: ['mat_bang'], fit: 'contain', role: 'normal' },
            { id: 'f4', x: 0.76, y: 0.26, w: 0.22, h: 0.22, label: 'MẶT CẮT AA', accepts: ['mat_cat'], fit: 'contain', role: 'normal' },
            { id: 'f5', x: 0.76, y: 0.50, w: 0.22, h: 0.22, label: 'MẶT ĐỨNG CHÍNH', accepts: ['mat_dung'], fit: 'contain', role: 'normal' },
            { id: 'f6', x: 0.76, y: 0.74, w: 0.22, h: 0.24, label: 'CHI TIẾT', accepts: ['bo_ky_thuat', 'diagram'], fit: 'contain', role: 'normal' }
        ]
    },
    {
        id: 'DarkGold_03',
        name: 'Layout 03: Small House Balance',
        page: { size: 'A1', orientation: 'landscape', marginMM: 10, widthMM: 841, heightMM: 594 },
        defaultThemeId: 'dark_gold',
        frames: [
            { id: 'f1', x: 0.02, y: 0.02, w: 0.30, h: 0.30, label: 'MẶT BẰNG 1', accepts: ['mat_bang'], fit: 'contain', role: 'normal' },
            { id: 'f2', x: 0.02, y: 0.34, w: 0.30, h: 0.30, label: 'MẶT BẰNG 2', accepts: ['mat_bang'], fit: 'contain', role: 'normal' },
            { id: 'f3', x: 0.02, y: 0.66, w: 0.30, h: 0.32, label: 'MẶT CẮT/ĐỨNG', accepts: ['mat_cat', 'mat_dung'], fit: 'contain', role: 'normal' },
            { id: 'f4', x: 0.34, y: 0.02, w: 0.64, h: 0.60, label: 'PHỐI CẢNH TỔNG THỂ', accepts: ['phoi_canh'], fit: 'cover', role: 'hero' },
            { id: 'f5', x: 0.34, y: 0.64, w: 0.31, h: 0.34, label: 'NỘI THẤT 1', accepts: ['phoi_canh', 'tieu_canh'], fit: 'cover', role: 'normal' },
            { id: 'f6', x: 0.67, y: 0.64, w: 0.31, h: 0.34, label: 'NỘI THẤT 2', accepts: ['phoi_canh', 'tieu_canh'], fit: 'cover', role: 'normal' }
        ]
    },
    {
        id: 'DarkGold_04',
        name: 'Layout 04: Technical Focus',
        page: { size: 'A1', orientation: 'landscape', marginMM: 10, widthMM: 841, heightMM: 594 },
        defaultThemeId: 'blueprint',
        frames: [
            { id: 'f1', x: 0.02, y: 0.02, w: 0.30, h: 0.30, label: 'MẶT BẰNG MÓNG', accepts: ['mat_bang', 'bo_ky_thuat'], fit: 'contain', role: 'normal' },
            { id: 'f2', x: 0.34, y: 0.02, w: 0.30, h: 0.30, label: 'MẶT BẰNG T1', accepts: ['mat_bang'], fit: 'contain', role: 'normal' },
            { id: 'f3', x: 0.66, y: 0.02, w: 0.32, h: 0.30, label: 'MẶT BẰNG T2', accepts: ['mat_bang'], fit: 'contain', role: 'normal' },
            { id: 'f4', x: 0.02, y: 0.34, w: 0.47, h: 0.30, label: 'MẶT CẮT A-A', accepts: ['mat_cat'], fit: 'contain', role: 'normal' },
            { id: 'f5', x: 0.51, y: 0.34, w: 0.47, h: 0.30, label: 'MẶT ĐỨNG', accepts: ['mat_dung'], fit: 'contain', role: 'normal' },
            { id: 'f6', x: 0.02, y: 0.66, w: 0.22, h: 0.32, label: 'CHI TIẾT 1', accepts: ['bo_ky_thuat'], fit: 'contain', role: 'normal' },
            { id: 'f7', x: 0.26, y: 0.66, w: 0.22, h: 0.32, label: 'CHI TIẾT 2', accepts: ['bo_ky_thuat'], fit: 'contain', role: 'normal' },
            { id: 'f8', x: 0.50, y: 0.66, w: 0.48, h: 0.32, label: 'PHỐI CẢNH GÓC', accepts: ['phoi_canh'], fit: 'cover', role: 'normal' }
        ]
    },
    {
        id: 'Blueprint_01',
        name: 'Layout 05: Blueprint Grid',
        page: { size: 'A1', orientation: 'landscape', marginMM: 10, widthMM: 841, heightMM: 594 },
        defaultThemeId: 'blueprint',
        frames: [
            { id: 'f1', x: 0.05, y: 0.05, w: 0.42, h: 0.42, label: 'TOP VIEW', accepts: ['mat_bang', 'phoi_canh'], fit: 'contain', role: 'hero' },
            { id: 'f2', x: 0.53, y: 0.05, w: 0.42, h: 0.42, label: 'FRONT VIEW', accepts: ['mat_dung'], fit: 'contain', role: 'normal' },
            { id: 'f3', x: 0.05, y: 0.53, w: 0.42, h: 0.42, label: 'SIDE VIEW', accepts: ['mat_cat', 'mat_dung'], fit: 'contain', role: 'normal' },
            { id: 'f4', x: 0.53, y: 0.53, w: 0.42, h: 0.42, label: 'ISOMETRIC', accepts: ['phoi_canh', 'diagram'], fit: 'contain', role: 'hero' }
        ]
    },
    {
        id: 'WhiteMinimal_01',
        name: 'Layout 06: Clean Gallery',
        page: { size: 'A1', orientation: 'landscape', marginMM: 20, widthMM: 841, heightMM: 594 },
        defaultThemeId: 'white_minimal',
        frames: [
            { id: 'f1', x: 0.05, y: 0.05, w: 0.55, h: 0.90, label: '', accepts: ['phoi_canh'], fit: 'cover', role: 'hero' },
            { id: 'f2', x: 0.65, y: 0.05, w: 0.30, h: 0.28, label: 'CONCEPT', accepts: ['y_tuong', 'diagram'], fit: 'contain', role: 'normal' },
            { id: 'f3', x: 0.65, y: 0.36, w: 0.30, h: 0.28, label: 'PLAN', accepts: ['mat_bang'], fit: 'contain', role: 'normal' },
            { id: 'f4', x: 0.65, y: 0.67, w: 0.30, h: 0.28, label: 'SECTION', accepts: ['mat_cat'], fit: 'contain', role: 'normal' }
        ]
    }
];
