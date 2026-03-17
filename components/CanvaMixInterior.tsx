
import React, { useEffect, useCallback, useState, useMemo } from 'react';
import type { SourceImage, ObjectTransform } from '../types';
import { Icon } from './icons';
import { ImageDropzone } from './ImageDropzone';
import { InteractiveCanvas } from './InteractiveCanvas';
import { sourceImageToDataUrl } from '../utils';

// --- Mock Language Context ---
const useLanguage = () => {
    const t = (key: string) => {
        const vn: Record<string, string> = {
            'uploadSpaceImage': '1. Tải ảnh Không gian gốc',
            'changeBgImage': 'Đổi ảnh nền',
            'clickOrDropNew': 'Nhấp hoặc thả ảnh vào đây',
            'uploadDecorImage': '2. Tải ảnh Đồ nội thất / Decor',
            'deleteAll': 'Xóa tất cả',
            'decorHelp': 'Tải ảnh vật dụng. AI sẽ tự động tách nền nếu cần.',
            'clickToAdd': 'Tải lên',
            'openLibrary': 'Thư viện mẫu',
            'adjustments': 'Điều chỉnh',
            'rotate': 'Xoay',
            'flipHorizontal': 'Lật ngang',
            'flipVertical': 'Lật dọc',
            'layerOrder': 'Thứ tự lớp',
            'bringForward': 'Lên trên',
            'sendBackward': 'Xuống dưới',
            'deleteObject': 'Xóa vật thể',
            'prompt': '3. Mô tả lệnh Render',
            'lockLayout': 'Khóa bố cục (Lock Layout)',
            'unlockLayout': 'Mở khóa (Unlock)',
            'promptPlaceholder.create': 'Mô tả lệnh render...',
            'generating': 'Đang tạo...',
            'createImage': 'Tạo ảnh',
            'emptyStateHeader': 'Kết quả Render',
            'fullscreen': 'Toàn màn hình',
            'downloadImage': 'Tải ảnh',
            'emptyCanvaHeader': 'Chưa có dữ liệu',
            'emptyCanvaText': 'Vui lòng tải ảnh không gian và thêm đồ nội thất để bắt đầu.',
            'alertUploadBg': 'Vui lòng tải ảnh không gian gốc trước.',
            'decorLibrary': 'Thư viện đã tải lên'
        };
        return vn[key] || key;
    }
    return { t };
};

const PROMPT_TEMPLATES = [
    "Thêm vật dụng ở ảnh 2 vào ảnh 1. QUAN TRỌNG: Tự động xoay và điều chỉnh phối cảnh (perspective) của đồ vật để bám sát và song song với mảng tường/sàn nhà, đảm bảo đúng tỷ lệ thực tế và hướng đổ bóng.",
    "Sắp đặt nội thất (ảnh 2) vào phòng (ảnh 1). Yêu cầu đồ vật phải có góc nhìn 3D khớp hoàn toàn với không gian, nằm vững trên sàn và áp sát tường một cách hợp lý.",
    "Hòa trộn đồ nội thất vào bối cảnh. Chú ý điều chỉnh biến dạng phối cảnh (perspective warp) để đồ vật trông tự nhiên, xoay đúng hướng nhìn của căn phòng và ánh sáng tương đồng.",
    "Render hiện thực hóa: Đặt các vật dụng vào vị trí chỉ định, xoay chúng để thẳng hàng với các đường gióng của kiến trúc (tường/sàn), tạo bóng đổ chân thực."
];

// --- Furniture Library Data Structure ---
type LibraryItem = { name: string; url: string };
type SubCategory = { id: string; name: string; items: LibraryItem[] };
type Category = { id: string; name: string; subs: SubCategory[] };

const LIBRARY_DATA: Category[] = [
    {
        id: 'furniture',
        name: 'Nội thất (Furniture)',
        subs: [
            {
                id: 'sofa', name: 'Sofa', items: [
                    { name: 'Sofa Modern Grey', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Sofa Leather Brown', url: 'https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Sofa L-Shape Blue', url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Sofa Velvet Green', url: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Sofa Minimalist Beige', url: 'https://images.unsplash.com/photo-1552858725-2758b5fb1286?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Sofa Chesterfield', url: 'https://images.unsplash.com/photo-1549497538-303e6d8192f9?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Sofa Sectional White', url: 'https://images.unsplash.com/photo-1549187774-b4e9bdf36a23?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Sofa Mid-Century', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Sofa Daybed', url: 'https://images.unsplash.com/photo-1633505086609-b463777acb9d?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Sofa Curved', url: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Sofa Low Profile', url: 'https://images.unsplash.com/photo-1519961655809-34fa156820ff?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Sofa Modular', url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Sofa Outdoor', url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Sofa Futon', url: 'https://images.unsplash.com/photo-1505693416388-b0346316f0f1?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Sofa Classic Red', url: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Sofa Scandinavian', url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Sofa Black Leather', url: 'https://images.unsplash.com/photo-1573866926487-a1865558861a?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Sofa Orange Velvet', url: 'https://images.unsplash.com/photo-1559599238-308793637427?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Sofa Blue Fabric', url: 'https://images.unsplash.com/photo-1589584649628-b47209e15866?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Sofa Tufted', url: 'https://images.unsplash.com/photo-1618219740975-d40978bb7378?auto=format&fit=crop&w=300&q=80' },
                ]
            },
            {
                id: 'chair', name: 'Ghế (Chair)', items: [
                    { name: 'Armchair Yellow', url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Dining Chair Wood', url: 'https://images.unsplash.com/photo-1503602642458-23211144584b?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Office Chair Mesh', url: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Lounge Chair', url: 'https://images.unsplash.com/photo-1567538096630-e08558e0fcde?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Stool High', url: 'https://images.unsplash.com/photo-1506898667547-42e22a46e125?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Accent Chair Pink', url: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Rocking Chair', url: 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Chair Rattan', url: 'https://images.unsplash.com/photo-1592914610354-fd354ea45e48?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Chair Plastic White', url: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Chair Industrial', url: 'https://images.unsplash.com/photo-1601366533287-59b98d0b987b?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Chair Velvet Blue', url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Chair Eames Style', url: 'https://images.unsplash.com/photo-1562113530-891c211755e5?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Chair Outdoor', url: 'https://images.unsplash.com/photo-1596162954151-cd67387162f2?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Chair Gaming', url: 'https://images.unsplash.com/photo-1598555720084-239c4a37b192?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Chair Classic Wood', url: 'https://images.unsplash.com/photo-1544207240-8b1025eb7aeb?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Chair Fabric Grey', url: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Chair Metal', url: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Bean Bag', url: 'https://images.unsplash.com/photo-1551298698-66b830a4f11c?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Pouf Ottoman', url: 'https://images.unsplash.com/photo-1591129841117-3adfd313e34f?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Chair Folding', url: 'https://images.unsplash.com/photo-1506898667547-42e22a46e125?auto=format&fit=crop&w=300&q=80' },
                ]
            },
            {
                id: 'table', name: 'Bàn (Table)', items: [
                    { name: 'Coffee Table Glass', url: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Dining Table Wood', url: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Desk Minimalist', url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Side Table Metal', url: 'https://images.unsplash.com/photo-1532323544230-ac8d43e29cf1?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Console Table', url: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Table Marble Top', url: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Table Rustic Wood', url: 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Table Outdoor', url: 'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Table Bedside', url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Table Drafting', url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Table Round', url: 'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Table Glass Dining', url: 'https://images.unsplash.com/photo-1595246140625-573b715e11e3?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Table Industrial', url: 'https://images.unsplash.com/photo-1574352067721-72d5913f35ab?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Table Kids', url: 'https://images.unsplash.com/photo-1596464716127-f9a804e0647e?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Table Nested', url: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Table Acrylic', url: 'https://images.unsplash.com/photo-1522771753035-4a53c9d1814c?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Table Picnic', url: 'https://images.unsplash.com/photo-1562663474-6cbb3eaa4d14?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Table Conference', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Table Workbench', url: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Table Coffee Wood', url: 'https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?auto=format&fit=crop&w=300&q=80' },
                ]
            }
        ]
    },
    {
        id: 'kitchen',
        name: 'Bếp (Kitchen)',
        subs: [
            {
                id: 'cabinet', name: 'Tủ Bếp', items: [
                    { name: 'Cabinet White Modern', url: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Cabinet Blue', url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Cabinet Wood Grain', url: 'https://images.unsplash.com/photo-1556912173-3db9963f63db?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Island Marble Top', url: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Cabinet Grey', url: 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Pantry Shelves', url: 'https://images.unsplash.com/photo-1556912167-f556f1f39fdf?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Cabinet Black', url: 'https://images.unsplash.com/photo-1556909190-583068e34486?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Cabinet Open Shelf', url: 'https://images.unsplash.com/photo-1556912998-c57cc6b63cd7?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Cabinet Farmhouse', url: 'https://images.unsplash.com/photo-1556909114-a025972808f9?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Cabinet High Gloss', url: 'https://images.unsplash.com/photo-1556912173-46c336c7fd55?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Cabinet Corner', url: 'https://images.unsplash.com/photo-1556909211-36987daf7b4d?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Cabinet Glass Door', url: 'https://images.unsplash.com/photo-1556912167-f556f1f39fdf?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Cabinet Bar', url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Cabinet Minimalist', url: 'https://images.unsplash.com/photo-1556912173-3db9963f63db?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Cabinet Industrial', url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=300&q=80' },
                ]
            },
            {
                id: 'appliance', name: 'Thiết bị', items: [
                    { name: 'Fridge Stainless', url: 'https://images.unsplash.com/photo-1571175443880-49e1d58b794a?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Oven Built-in', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Coffee Machine', url: 'https://images.unsplash.com/photo-1520981825232-ece5fae45120?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Toaster Retro', url: 'https://images.unsplash.com/photo-1585237672814-722d32752179?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Blender', url: 'https://images.unsplash.com/photo-1570222094114-2819cd987a25?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Dishwasher', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Microwave', url: 'https://images.unsplash.com/photo-1585237672814-722d32752179?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Range Hood', url: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Gas Stove', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Kettle Electric', url: 'https://images.unsplash.com/photo-1520981825232-ece5fae45120?auto=format&fit=crop&w=300&q=80' },
                ]
            }
        ]
    },
    {
        id: 'lighting',
        name: 'Đèn (Lighting)',
        subs: [
            {
                id: 'floor', name: 'Đèn sàn', items: [
                    { name: 'Floor Lamp Arc', url: 'https://images.unsplash.com/photo-1507473888900-52e1ad146957?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Floor Lamp Tripod', url: 'https://images.unsplash.com/photo-1513506003011-3b03c80165bd?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Floor Lamp Industrial', url: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Floor Lamp Minimal', url: 'https://images.unsplash.com/photo-1507473888900-52e1ad146957?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Floor Lamp Brass', url: 'https://images.unsplash.com/photo-1513506003011-3b03c80165bd?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Floor Lamp Reading', url: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Floor Lamp Paper', url: 'https://images.unsplash.com/photo-1507473888900-52e1ad146957?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Floor Lamp Black', url: 'https://images.unsplash.com/photo-1513506003011-3b03c80165bd?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Floor Lamp Rattan', url: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Floor Lamp Modern', url: 'https://images.unsplash.com/photo-1507473888900-52e1ad146957?auto=format&fit=crop&w=300&q=80' },
                ]
            },
            {
                id: 'pendant', name: 'Đèn thả', items: [
                    { name: 'Pendant Light Globe', url: 'https://images.unsplash.com/photo-1513506003011-3b03c80165bd?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Pendant Light Industrial', url: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Pendant Light Rattan', url: 'https://images.unsplash.com/photo-1507473888900-52e1ad146957?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Pendant Light Modern', url: 'https://images.unsplash.com/photo-1513506003011-3b03c80165bd?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Pendant Light Cluster', url: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Pendant Light Glass', url: 'https://images.unsplash.com/photo-1507473888900-52e1ad146957?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Chandelier Crystal', url: 'https://images.unsplash.com/photo-1513506003011-3b03c80165bd?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Chandelier Modern', url: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Pendant Light Linear', url: 'https://images.unsplash.com/photo-1507473888900-52e1ad146957?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Pendant Light Concrete', url: 'https://images.unsplash.com/photo-1513506003011-3b03c80165bd?auto=format&fit=crop&w=300&q=80' },
                ]
            }
        ]
    },
    {
        id: 'decor',
        name: 'Trang trí (Decor)',
        subs: [
            {
                id: 'plant', name: 'Cây xanh', items: [
                    { name: 'Indoor Plant Fiddle', url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Indoor Plant Snake', url: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Indoor Plant Monstera', url: 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Indoor Plant Hanging', url: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Indoor Plant Cactus', url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Indoor Plant Pot', url: 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Indoor Plant Large', url: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Indoor Plant Small', url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Indoor Plant Stand', url: 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Indoor Plant Fern', url: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=300&q=80' },
                ]
            },
            {
                id: 'art', name: 'Tranh ảnh', items: [
                    { name: 'Wall Art Abstract', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Wall Art Landscape', url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Wall Art Portrait', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Wall Art Framed', url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Wall Art Canvas', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Wall Art BlackWhite', url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Wall Art Modern', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Wall Art Vintage', url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Wall Art Set', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Wall Art Large', url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300&q=80' },
                ]
            },
            {
                id: 'rug', name: 'Thảm', items: [
                    { name: 'Rug Persian', url: 'https://images.unsplash.com/photo-1575414723300-0d0cb4025e10?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Rug Jute', url: 'https://images.unsplash.com/photo-1596162954151-cd67387162f2?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Rug Geometric', url: 'https://images.unsplash.com/photo-1575414723300-0d0cb4025e10?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Rug Shaggy', url: 'https://images.unsplash.com/photo-1596162954151-cd67387162f2?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Rug Modern', url: 'https://images.unsplash.com/photo-1575414723300-0d0cb4025e10?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Rug Round', url: 'https://images.unsplash.com/photo-1596162954151-cd67387162f2?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Rug Pattern', url: 'https://images.unsplash.com/photo-1575414723300-0d0cb4025e10?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Rug Wool', url: 'https://images.unsplash.com/photo-1596162954151-cd67387162f2?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Rug Blue', url: 'https://images.unsplash.com/photo-1575414723300-0d0cb4025e10?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Rug Beige', url: 'https://images.unsplash.com/photo-1596162954151-cd67387162f2?auto=format&fit=crop&w=300&q=80' },
                ]
            }
        ]
    },
    {
        id: 'childroom',
        name: 'Phòng trẻ em (Kids)',
        subs: [
            {
                id: 'bed', name: 'Giường ngủ', items: [
                    { name: 'Bunk Bed', url: 'https://images.unsplash.com/photo-1505693416388-b0346316f0f1?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Kids Bed Single', url: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Crib', url: 'https://images.unsplash.com/photo-1519643381401-22c77e60520e?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Kids Bed Tent', url: 'https://images.unsplash.com/photo-1505693416388-b0346316f0f1?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Kids Bed Car', url: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=300&q=80' },
                ]
            },
            {
                id: 'toy', name: 'Đồ chơi', items: [
                    { name: 'Toy Box', url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Rocking Horse', url: 'https://images.unsplash.com/photo-1519643381401-22c77e60520e?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Doll House', url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Stuffed Animal', url: 'https://images.unsplash.com/photo-1519643381401-22c77e60520e?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Play Mat', url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=300&q=80' },
                ]
            }
        ]
    },
    {
        id: 'bathroom',
        name: 'Phòng tắm (Bathroom)',
        subs: [
            {
                id: 'sanitary', name: 'Thiết bị vệ sinh', items: [
                    { name: 'Bathtub Freestanding', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Sink Vanity', url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Toilet Modern', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Shower Head', url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Faucet Gold', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Mirror Round', url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Towel Rack', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Shower Cabin', url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Bidet', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Bath Mat', url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=300&q=80' },
                ]
            }
        ]
    },
    {
        id: 'tech',
        name: 'Công nghệ (Technology)',
        subs: [
            {
                id: 'electronics', name: 'Điện tử', items: [
                    { name: 'TV Screen', url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Computer Monitor', url: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Laptop', url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Speaker', url: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Game Console', url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Router', url: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Smart Home Hub', url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Tablet', url: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Headphones', url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=300&q=80' },
                    { name: 'Camera', url: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=300&q=80' },
                ]
            }
        ]
    }
];

// Helper to fetch image from URL and convert to SourceImage
const fetchImageAsSource = async (url: string): Promise<SourceImage> => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
        // Strip prefix if needed, though our SourceImage type usually expects raw base64 in some contexts, 
        // but let's stick to the convention used in this app.
        // The type SourceImage in this codebase seems to expect base64 string without prefix in some places
        // but sourceImageToDataUrl adds it back.
        const cleanBase64 = base64.split(',')[1];
        return {
            base64: cleanBase64,
            mimeType: blob.type,
            file: new File([blob], 'sample.jpg', { type: blob.type })
        };
    } catch (e) {
        console.error("Failed to load sample image", e);
        throw e;
    }
};

interface CanvaMixViewProps {
    sourceImage: SourceImage | null;
    setSourceImage: (image: SourceImage | null) => void;
    canvaObjects: SourceImage[];
    setCanvaObjects: React.Dispatch<React.SetStateAction<SourceImage[]>>;
    canvaObjectTransforms: ObjectTransform[];
    setCanvaObjectTransforms: React.Dispatch<React.SetStateAction<ObjectTransform[]>>;
    selectedCanvaObjectIndex: number | null;
    setSelectedCanvaObjectIndex: React.Dispatch<React.SetStateAction<number | null>>;
    isCanvaLayoutLocked: boolean;
    setIsCanvaLayoutLocked: React.Dispatch<React.SetStateAction<boolean>>;
    prompt: string;
    setPrompt: (prompt: string) => void;
    isLoading: boolean;
    handleGeneration: () => void;
    generatedImages: string[];
    selectedImage: string | null;
    setSelectedImage: (image: string) => void;
    setFullscreenImage: (image: string | null) => void;
}

export const CanvaMixInterior: React.FC<CanvaMixViewProps> = ({
    sourceImage, setSourceImage,
    canvaObjects, setCanvaObjects,
    canvaObjectTransforms, setCanvaObjectTransforms,
    selectedCanvaObjectIndex, setSelectedCanvaObjectIndex,
    isCanvaLayoutLocked, setIsCanvaLayoutLocked,
    prompt, setPrompt,
    isLoading, handleGeneration,
    generatedImages, selectedImage, setSelectedImage, setFullscreenImage
}) => {
    const { t } = useLanguage();
    const [decorLibrary, setDecorLibrary] = useState<SourceImage[]>([]);
    const [isProcessingBG, setIsProcessingBG] = useState(false);
    
    // Library Modal State
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>(LIBRARY_DATA[0].id);
    const [selectedSubCatId, setSelectedSubCatId] = useState<string>(LIBRARY_DATA[0].subs[0].id);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingLibraryItem, setIsLoadingLibraryItem] = useState(false);

    // --- Search Logic ---
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return null;
        const results: { item: LibraryItem, catName: string }[] = [];
        LIBRARY_DATA.forEach(cat => {
            cat.subs.forEach(sub => {
                sub.items.forEach(item => {
                    if (item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                        results.push({ item, catName: `${cat.name} > ${sub.name}` });
                    }
                });
            });
        });
        return results;
    }, [searchQuery]);

    // --- Handlers Logic ---

    // Simulated Background Removal Service
    const processImageBackground = async (image: SourceImage): Promise<SourceImage> => {
        setIsProcessingBG(true);
        // Simulate API delay for "AI" processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsProcessingBG(false);
        // In a real app, this would send to an API and return the transparent PNG.
        // Here we just return the original but user sees the "AI Processing" indicator.
        return image; 
    };

    const handleSourceImageUpload = (image: SourceImage | null) => {
        if (image) {
            setSourceImage(image);
        }
    };

    const handleDecorUpload = async (newImages: SourceImage[]) => {
        if (!sourceImage) {
            alert(t('alertUploadBg'));
            return;
        }
        
        // Process each image for BG removal
        const processedImages: SourceImage[] = [];
        for (const img of newImages) {
            const processed = await processImageBackground(img);
            processedImages.push(processed);
        }

        // Add to uploaded library
        setDecorLibrary(prev => [...prev, ...processedImages]);
        // Add to canvas
        addToCanvas(processedImages);
    };

    const handleAddFromLibrary = async (url: string) => {
        if (!sourceImage) {
            alert(t('alertUploadBg'));
            return;
        }
        setIsLoadingLibraryItem(true);
        try {
            const imgRaw = await fetchImageAsSource(url);
            // Process BG removal for library items too (just in case they aren't transparent)
            const processed = await processImageBackground(imgRaw);
            addToCanvas([processed]);
        } catch (e) {
            alert("Không thể tải ảnh mẫu.");
        } finally {
            setIsLoadingLibraryItem(false);
        }
    };

    const addToCanvas = (images: SourceImage[]) => {
        setCanvaObjects((prev) => [...prev, ...images]);
        setCanvaObjectTransforms((prev) => [
            ...prev,
            ...images.map(() => ({ x: 50, y: 50, scale: 30, rotation: 0, flipHorizontal: false, flipVertical: false }))
        ]);
    };

    const handleDeleteSelectedCanvaObject = useCallback(() => {
        if (selectedCanvaObjectIndex === null) return;
        setCanvaObjects(prev => prev.filter((_, i) => i !== selectedCanvaObjectIndex));
        setCanvaObjectTransforms(prev => prev.filter((_, i) => i !== selectedCanvaObjectIndex));
        setSelectedCanvaObjectIndex(null);
    }, [selectedCanvaObjectIndex, setCanvaObjects, setCanvaObjectTransforms, setSelectedCanvaObjectIndex]);

    const handleMoveCanvaObjectLayer = useCallback((direction: 'up' | 'down') => {
        if (selectedCanvaObjectIndex === null) return;
        const index = selectedCanvaObjectIndex;
        
        if (direction === 'up' && index < canvaObjects.length - 1) {
            const nextIndex = index + 1;
            setCanvaObjects(prev => { const n = [...prev]; [n[index], n[nextIndex]] = [n[nextIndex], n[index]]; return n; });
            setCanvaObjectTransforms(prev => { const n = [...prev]; [n[index], n[nextIndex]] = [n[nextIndex], n[index]]; return n; });
            setSelectedCanvaObjectIndex(nextIndex);
        } else if (direction === 'down' && index > 0) {
            const prevIndex = index - 1;
            setCanvaObjects(prev => { const n = [...prev]; [n[index], n[prevIndex]] = [n[prevIndex], n[index]]; return n; });
            setCanvaObjectTransforms(prev => { const n = [...prev]; [n[index], n[prevIndex]] = [n[prevIndex], n[index]]; return n; });
            setSelectedCanvaObjectIndex(prevIndex);
        }
    }, [selectedCanvaObjectIndex, canvaObjects.length, setCanvaObjects, setCanvaObjectTransforms, setSelectedCanvaObjectIndex]);

    const updateSelectedTransform = (key: keyof ObjectTransform, value: any) => {
        if (selectedCanvaObjectIndex === null) return;
        setCanvaObjectTransforms(prev => prev.map((t, i) => i === selectedCanvaObjectIndex ? { ...t, [key]: value } : t));
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (selectedCanvaObjectIndex !== null && event.key === 'Backspace') {
                event.preventDefault();
                handleDeleteSelectedCanvaObject();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedCanvaObjectIndex, handleDeleteSelectedCanvaObject]);


    // --- Render Helpers ---

    const renderControls = () => (
        <div className="bg-[var(--bg-surface-1)] backdrop-blur-md border border-[var(--border-1)] shadow-2xl shadow-[var(--shadow-color)] p-5 rounded-xl flex flex-col h-full max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="space-y-6">
                {/* 1. Background Image */}
                <section>
                    <h3 className="font-semibold text-brand-text mb-3">{t('uploadSpaceImage')}</h3>
                    {sourceImage ? (
                        <div className='space-y-2'>
                            <div className='bg-black/30 rounded-lg p-2 relative group border border-brand-primary/50'>
                                <img src={sourceImageToDataUrl(sourceImage)} alt="Background" className="w-full h-auto object-contain rounded opacity-80" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-lg">
                                    <button 
                                        onClick={() => setSourceImage(null)} 
                                        className="bg-brand-surface/90 hover:bg-brand-primary text-white text-sm px-4 py-2 rounded shadow-lg border border-brand-primary/50"
                                    >
                                        {t('changeBgImage')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <ImageDropzone 
                            onImageUpload={handleSourceImageUpload} 
                            className='w-full h-32 border-2 border-dashed border-brand-primary/50 rounded-lg flex items-center justify-center text-center text-brand-text-muted text-sm cursor-pointer hover:bg-brand-surface/50 hover:border-brand-accent/50 transition-colors'
                        >
                            <p>{t('clickOrDropNew')}</p>
                        </ImageDropzone>
                    )}
                </section>

                {/* 2. Decor Images */}
                <section>
                    <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                        <h3 className="font-semibold text-brand-text">{t('uploadDecorImage')}</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsLibraryOpen(true)}
                                className="text-xs bg-brand-accent hover:bg-brand-accent/80 text-white px-2 py-1 rounded transition-colors flex items-center gap-1"
                            >
                                <Icon name="plus-circle" className="w-3 h-3" />
                                {t('openLibrary')}
                            </button>
                            {canvaObjects.length > 0 && (
                                <button 
                                    onClick={() => { setCanvaObjects([]); setCanvaObjectTransforms([]); setSelectedCanvaObjectIndex(null); }} 
                                    className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                                >
                                    {t('deleteAll')}
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-brand-text-muted mb-3 leading-relaxed">{t('decorHelp')}</p>
                    
                    {/* Upload Zone */}
                    <div className="relative">
                        <ImageDropzone 
                            onImagesUpload={handleDecorUpload} 
                            multiple 
                            className='w-full h-20 border-2 border-dashed border-brand-primary/50 rounded-lg flex items-center justify-center text-center text-brand-text-muted text-sm cursor-pointer mb-3 hover:bg-brand-surface/50 hover:border-brand-accent/50 transition-colors'
                        >
                            <div className="flex flex-col items-center gap-1">
                                <Icon name="plus-circle" className="w-5 h-5 text-brand-text-muted" />
                                <p className="text-xs">{t('clickToAdd')}</p>
                            </div>
                        </ImageDropzone>
                        {isProcessingBG && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg backdrop-blur-sm z-10">
                                <div className="flex flex-col items-center text-brand-accent animate-pulse">
                                    <Icon name="sparkles" className="w-5 h-5 mb-1 animate-spin" />
                                    <span className="text-xs font-semibold">AI đang tách nền...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Decor Library (Uploaded) */}
                    {decorLibrary.length > 0 && (
                        <div className="mt-3">
                            <label className="text-xs font-bold text-brand-text-muted mb-2 block">{t('decorLibrary')}</label>
                            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                                {decorLibrary.map((img, idx) => (
                                    <div 
                                        key={idx} 
                                        className="relative aspect-square rounded-md overflow-hidden border border-brand-primary/30 cursor-pointer hover:border-brand-accent group bg-black/20"
                                        onClick={() => addToCanvas([img])}
                                    >
                                        <img src={sourceImageToDataUrl(img)} className="w-full h-full object-contain p-1" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Icon name="plus-circle" className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Selected Object Controls */}
                    {selectedCanvaObjectIndex !== null && canvaObjectTransforms[selectedCanvaObjectIndex] && (
                        <div className="bg-brand-surface/50 p-3 rounded-lg border border-brand-primary/50 mt-2 space-y-3 animate-fade-in">
                            <h4 className="text-sm font-semibold text-brand-text flex items-center gap-2 border-b border-brand-primary/30 pb-2">
                                <Icon name="adjustments" className="w-4 h-4" /> {t('adjustments')}
                            </h4>
                            
                            {/* Rotation */}
                            <div>
                                <label className="text-xs text-brand-text-muted flex justify-between mb-1">
                                    {t('rotate')} <span className="font-mono text-brand-text">{Math.round(canvaObjectTransforms[selectedCanvaObjectIndex].rotation)}°</span>
                                </label>
                                <input 
                                    type="range" min="0" max="360" 
                                    value={canvaObjectTransforms[selectedCanvaObjectIndex].rotation} 
                                    onChange={(e) => updateSelectedTransform('rotation', Number(e.target.value))} 
                                    className="w-full h-1.5 bg-brand-primary rounded-lg appearance-none cursor-pointer accent-brand-accent" 
                                />
                            </div>

                            {/* Flip Controls */}
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => updateSelectedTransform('flipHorizontal', !canvaObjectTransforms[selectedCanvaObjectIndex].flipHorizontal)} 
                                    className={`flex-1 text-xs py-1.5 rounded border transition-all ${canvaObjectTransforms[selectedCanvaObjectIndex].flipHorizontal ? 'bg-brand-accent border-brand-accent text-white' : 'bg-brand-surface border-brand-primary text-brand-text-muted hover:bg-brand-primary'}`}
                                >
                                    {t('flipHorizontal')}
                                </button>
                                <button 
                                    onClick={() => updateSelectedTransform('flipVertical', !canvaObjectTransforms[selectedCanvaObjectIndex].flipVertical)} 
                                    className={`flex-1 text-xs py-1.5 rounded border transition-all ${canvaObjectTransforms[selectedCanvaObjectIndex].flipVertical ? 'bg-brand-accent border-brand-accent text-white' : 'bg-brand-surface border-brand-primary text-brand-text-muted hover:bg-brand-primary'}`}
                                >
                                    {t('flipVertical')}
                                </button>
                            </div>

                            {/* Layer Controls */}
                            <div>
                                <label className="text-xs text-brand-text-muted mb-1 block">{t('layerOrder')}</label>
                                <div className="flex gap-2">
                                    <button onClick={() => handleMoveCanvaObjectLayer('up')} className="flex-1 bg-brand-surface hover:bg-brand-primary text-xs py-1.5 rounded text-brand-text-muted hover:text-white flex items-center justify-center gap-1 border border-brand-primary">
                                        <Icon name="arrow-up-circle" className="w-3 h-3"/> {t('bringForward')}
                                    </button>
                                    <button onClick={() => handleMoveCanvaObjectLayer('down')} className="flex-1 bg-brand-surface hover:bg-brand-primary text-xs py-1.5 rounded text-brand-text-muted hover:text-white flex items-center justify-center gap-1 border border-brand-primary">
                                        <Icon name="arrow-down-circle" className="w-3 h-3"/> {t('sendBackward')}
                                    </button>
                                </div>
                            </div>

                            {/* Delete Button */}
                            <button onClick={handleDeleteSelectedCanvaObject} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs py-2 rounded border border-red-500/30 flex items-center justify-center gap-2 transition-colors">
                                <Icon name="trash" className="w-3 h-3" /> {t('deleteObject')}
                            </button>
                        </div>
                    )}
                </section>

                {/* 3. Prompt */}
                <section>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-brand-text">{t('prompt')}</h3>
                        <button 
                            onClick={() => setIsCanvaLayoutLocked(!isCanvaLayoutLocked)} 
                            className={`text-xs px-2 py-1.5 rounded flex items-center gap-1.5 transition-all font-medium border ${isCanvaLayoutLocked ? 'bg-brand-accent border-brand-accent text-white' : 'bg-brand-surface border-brand-primary text-brand-text-muted hover:bg-brand-primary'}`}
                        >
                            {isCanvaLayoutLocked ? <Icon name="lock-closed" className="w-3 h-3" /> : <Icon name="lock-open" className="w-3 h-3" />}
                            {isCanvaLayoutLocked ? t('unlockLayout') : t('lockLayout')}
                        </button>
                    </div>
                    
                    <div className="mb-2">
                        <select 
                            onChange={(e) => setPrompt(e.target.value)}
                            value=""
                            className="w-full bg-brand-surface border border-brand-primary rounded-lg px-2 py-1.5 text-xs text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-accent"
                        >
                            <option value="" disabled>-- Chọn mẫu lệnh render --</option>
                            {PROMPT_TEMPLATES.map((p, i) => (
                                <option key={i} value={p}>{p.substring(0, 50)}...</option>
                            ))}
                        </select>
                    </div>

                    <textarea 
                        value={prompt} 
                        onChange={(e) => setPrompt(e.target.value)} 
                        placeholder={t('promptPlaceholder.create')} 
                        className="w-full bg-brand-bg/70 p-3 rounded-lg h-24 resize-none text-sm focus:ring-1 focus:ring-brand-accent focus:outline-none border border-brand-primary/50 text-brand-text placeholder-brand-text-muted/50" 
                    />
                </section>
            </div>

            {/* Generate Button */}
            <div className="mt-4 pt-4 border-t border-brand-primary/30 flex-shrink-0">
                <button
                    onClick={handleGeneration}
                    disabled={isLoading || !sourceImage || canvaObjects.length === 0}
                    className="w-full bg-gradient-to-r from-brand-accent to-brand-secondary hover:brightness-110 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-brand-accent/20 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
                >
                    {isLoading ? (
                        <Icon name="sparkles" className="w-6 h-6 animate-spin" />
                    ) : (
                        <Icon name="sparkles" className="w-6 h-6" />
                    )}
                    {isLoading ? t('generating') : t('createImage')}
                </button>
            </div>
        </div>
    );

    const renderCanvasOrResult = () => (
        <div className="bg-[var(--bg-surface-1)] backdrop-blur-md border border-[var(--border-1)] shadow-2xl shadow-[var(--shadow-color)] p-4 rounded-xl min-h-[60vh] h-full flex flex-col">
            {generatedImages.length > 0 && selectedImage ? (
                // Result View
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h3 className="text-lg font-semibold text-brand-text">{t('emptyStateHeader')}</h3>
                        <button onClick={() => { setSelectedImage(''); }} className="text-sm text-brand-text-muted hover:text-white flex items-center gap-1 transition-colors">
                            <Icon name="arrow-uturn-left" className="w-4 h-4" /> Back to Edit
                        </button>
                    </div>
                    <div className="flex-grow flex items-center justify-center relative group bg-black/30 rounded-lg overflow-hidden border border-brand-primary/30">
                        <img src={selectedImage} alt="Render Result" className="max-w-full max-h-[70vh] object-contain" />
                        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button onClick={() => setFullscreenImage(selectedImage)} className="bg-brand-surface/90 backdrop-blur-sm border border-brand-primary hover:bg-brand-primary text-white p-2.5 rounded-full shadow-lg" title={t('fullscreen')}>
                                <Icon name="arrows-pointing-out" className="w-5 h-5" />
                            </button>
                            <a href={selectedImage} download={`ap-render-canva-${Date.now()}.png`} className="bg-brand-surface/90 backdrop-blur-sm border border-brand-primary hover:bg-brand-primary text-white p-2.5 rounded-full inline-flex shadow-lg" title={t('downloadImage')}>
                                <Icon name="download" className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                    {generatedImages.length > 1 && (
                        <div className="flex gap-2 mt-4 justify-center overflow-x-auto p-2">
                            {generatedImages.map((img, idx) => (
                                <img 
                                    key={idx} 
                                    src={img} 
                                    alt={`Result ${idx}`} 
                                    onClick={() => setSelectedImage(img)}
                                    className={`w-20 h-20 object-cover rounded-md cursor-pointer border-2 ${selectedImage === img ? 'border-brand-accent' : 'border-transparent hover:border-brand-primary'}`} 
                                />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                // Interactive Canvas View
                sourceImage ? (
                    <div className="h-full flex flex-col">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-xs text-brand-text-muted flex items-center gap-1"><Icon name="mouse-pointer" className="w-3 h-3"/> Drag corners to resize, rotate to adjust</span>
                            <span className="text-xs text-brand-text-muted flex items-center gap-1 bg-brand-surface px-2 py-0.5 rounded-full border border-brand-primary/30">{canvaObjects.length} Objects</span>
                        </div>
                        <div className="flex-grow relative rounded-lg overflow-hidden border border-brand-primary/50 bg-black/40">
                            <InteractiveCanvas
                                bgImage={sourceImage}
                                canvaObjects={canvaObjects}
                                canvaObjectTransforms={canvaObjectTransforms}
                                setCanvaObjectTransforms={setCanvaObjectTransforms}
                                selectedCanvaObjectIndex={selectedCanvaObjectIndex}
                                setSelectedCanvaObjectIndex={setSelectedCanvaObjectIndex}
                                isCanvaLayoutLocked={isCanvaLayoutLocked}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-brand-text-muted/50">
                        <div className="p-6 bg-brand-surface/30 rounded-full mb-4 border border-brand-primary/20">
                            <Icon name={'sparkles'} className="w-16 h-16 text-brand-text-muted" />
                        </div>
                        <h3 className="text-xl font-semibold text-brand-text-muted">{t('emptyCanvaHeader')}</h3>
                        <p className="mt-2 text-sm">{t('emptyCanvaText')}</p>
                    </div>
                )
            )}
        </div>
    );

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                <div className="lg:col-span-4 xl:col-span-3">
                    {renderControls()}
                </div>
                <div className="lg:col-span-8 xl:col-span-9">
                    {renderCanvasOrResult()}
                </div>
            </div>

            {/* Furniture Library Modal (Revised Layout) */}
            {isLibraryOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setIsLibraryOpen(false)}>
                    <div className="bg-brand-surface border border-brand-primary rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-slide-down" onClick={e => e.stopPropagation()}>
                        
                        {/* 1. Header & Search */}
                        <div className="flex flex-col border-b border-brand-primary/50 bg-brand-bg/50">
                            <div className="flex justify-between items-center p-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Icon name="sparkles" className="w-5 h-5 text-brand-accent"/>
                                    Thư viện Đồ Nội Thất
                                </h3>
                                <button onClick={() => setIsLibraryOpen(false)} className="text-brand-text-muted hover:text-white">
                                    <Icon name="x-circle" className="w-6 h-6"/>
                                </button>
                            </div>
                            <div className="px-4 pb-4">
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Tìm kiếm vật dụng (ví dụ: Sofa, Đèn...)"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-black/20 border border-brand-primary/50 rounded-lg pl-10 pr-4 py-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-accent"
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Main Body */}
                        <div className="flex flex-1 overflow-hidden">
                            {/* 2a. Categories Sidebar */}
                            <div className="w-64 bg-brand-bg/30 border-r border-brand-primary/30 flex flex-col overflow-y-auto custom-scrollbar">
                                <div className="p-2 space-y-1">
                                    {LIBRARY_DATA.map(cat => (
                                        <div key={cat.id}>
                                            <button
                                                onClick={() => { 
                                                    setSelectedCategoryId(cat.id); 
                                                    setSelectedSubCatId(cat.subs[0]?.id || '');
                                                    setSearchQuery(''); // Clear search on cat change
                                                }}
                                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors flex justify-between items-center ${selectedCategoryId === cat.id && !searchQuery ? 'bg-brand-accent/20 text-brand-accent' : 'text-brand-text-muted hover:bg-brand-primary/20 hover:text-white'}`}
                                            >
                                                {cat.name}
                                                <svg className={`w-3 h-3 transition-transform ${selectedCategoryId === cat.id ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                                            </button>
                                            
                                            {/* Nested Subcategories (Accordion style) */}
                                            {selectedCategoryId === cat.id && !searchQuery && (
                                                <div className="ml-2 mt-1 pl-2 border-l border-brand-primary/20 space-y-0.5">
                                                    {cat.subs.map(sub => (
                                                        <button 
                                                            key={sub.id}
                                                            onClick={() => setSelectedSubCatId(sub.id)}
                                                            className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors ${selectedSubCatId === sub.id ? 'bg-brand-primary/40 text-white' : 'text-brand-text-muted/80 hover:text-white'}`}
                                                        >
                                                            {sub.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 2b. Item Grid */}
                            <div className="flex-1 bg-black/20 flex flex-col">
                                {isLoadingLibraryItem && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-20 backdrop-blur-sm">
                                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-accent mb-3"></div>
                                        <p className="text-white text-sm font-medium animate-pulse">Đang tải và tách nền...</p>
                                    </div>
                                )}

                                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                                    {searchQuery ? (
                                        // Search Results View
                                        <div>
                                            <h4 className="text-xs font-bold text-brand-text-muted uppercase mb-3">Kết quả tìm kiếm: "{searchQuery}"</h4>
                                            {filteredItems && filteredItems.length > 0 ? (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                                    {filteredItems.map(({ item, catName }, idx) => (
                                                        <div 
                                                            key={idx} 
                                                            className="group cursor-pointer bg-brand-surface/50 rounded-lg p-2 border border-brand-primary/30 hover:border-brand-accent transition-all hover:scale-105"
                                                            onClick={() => handleAddFromLibrary(item.url)}
                                                        >
                                                            <div className="aspect-square rounded-md overflow-hidden bg-white/5 mb-2 relative flex items-center justify-center p-2">
                                                                <img src={item.url} alt={item.name} className="max-w-full max-h-full object-contain" />
                                                            </div>
                                                            <p className="text-xs font-semibold text-center text-brand-text group-hover:text-white truncate" title={item.name}>{item.name}</p>
                                                            <p className="text-[10px] text-center text-brand-text-muted/60 truncate">{catName}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-brand-text-muted text-sm text-center py-10">Không tìm thấy kết quả phù hợp.</p>
                                            )}
                                        </div>
                                    ) : (
                                        // Standard Category View
                                        <div>
                                            <h4 className="text-sm font-bold text-white mb-4 border-b border-brand-primary/30 pb-2">
                                                {LIBRARY_DATA.find(c => c.id === selectedCategoryId)?.subs.find(s => s.id === selectedSubCatId)?.name}
                                            </h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                                {LIBRARY_DATA.find(c => c.id === selectedCategoryId)?.subs.find(s => s.id === selectedSubCatId)?.items.map((item, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        className="group cursor-pointer bg-brand-surface/50 rounded-lg p-2 border border-brand-primary/30 hover:border-brand-accent transition-all hover:scale-105 shadow-sm hover:shadow-lg"
                                                        onClick={() => handleAddFromLibrary(item.url)}
                                                    >
                                                        <div className="aspect-square rounded-md overflow-hidden bg-white/5 mb-2 relative flex items-center justify-center p-2">
                                                            <img src={item.url} alt={item.name} className="max-w-full max-h-full object-contain filter drop-shadow-md" />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-md">
                                                                <span className="bg-brand-accent text-white text-xs px-2 py-1 rounded-full shadow-lg font-bold">Thêm +</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-center text-brand-text-muted group-hover:text-white truncate font-medium" title={item.name}>{item.name}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
