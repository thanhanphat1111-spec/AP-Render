
import React, { useState, useCallback, useEffect } from 'react';
import { BaseTab } from './BaseTab';
import { Card } from '../components/Card';
import { ImageUploader } from '../components/ImageUploader';
import { generateImage, generateText } from '../services/aiService';
import { ImageFile } from '../types';
import { NumberSelector } from '../components/NumberSelector';

// Fix: Rename incorrectly named ThreeDToTwoDTabProps and add missing fields
interface StyleTransferTabProps {
  onEditRequest: (image: ImageFile) => void;
  onVideoRequest: (image: ImageFile) => void;
  initialImage?: ImageFile | null;
  onClearInitialImage?: () => void;
}

const STYLE_PROMPT_SAMPLES = [
    { label: "--- HIỆN ĐẠI & THAM SỐ (MODERN/PARAMETRIC) ---", value: "" },
    {
        label: "1) ZAHA HADID – HỮU CƠ THAM SỐ",
        value: "Áp dụng phong cách Zaha Hadid (organic parametric): mặt đứng và hình khối được tạo bởi các đường cong hữu cơ uốn lượn như dải lụa, bề mặt liền mạch (seamless/monolithic) với chuyển tiếp mượt giữa tường–trần–ban công, tạo cảm giác chuyển động liên tục. Ưu tiên kính cong khổ lớn, loggia cong sâu, khe sáng LED tuyến tính chạy theo đường cong; hạn chế mạch ghép lộ, chi tiết tối giản nhưng cao cấp. Vật liệu gợi ý: UHPC/GRC trắng mịn + nhôm sơn satin + kính low-iron. Ánh sáng tự nhiên chân thực, phản xạ vật lý đúng. Kết quả siêu thực như ảnh chụp từ máy ảnh kỹ thuật số, sắc nét, HDR, DOF nhẹ, 4K. Không chữ, không watermark, không người."
    },
    {
        label: "2) HIỆN ĐẠI NHIỆT ĐỚI TỐI GIẢN",
        value: "Mặt tiền nhà phố hiện đại nhiệt đới tối giản: các khối hộp xếp lớp, ban công/hiên đua sâu tạo bóng đổ, cửa trượt kính lớn, khung nhôm kính đen, lam che nắng (lam đứng/lam ngang/pergola), bồn cây âm lan can và cây rủ xanh mát. Bảng màu trắng–xám nhạt + nhấn gỗ tự nhiên/giả gỗ; vật liệu sơn bả mịn, đá/xi măng tầng trệt. Ánh sáng nắng nhiệt đới, bóng đổ rõ. Kết quả như ảnh chụp từ máy ảnh kỹ thuật số, HDR, sắc nét, 4K. Không chữ, không watermark, không người."
    },
    {
        label: "3) SOFT MINIMAL – BO CONG/MIỀN MỀM",
        value: "Mặt tiền nhà phố phong cách tối giản mềm (soft minimal): bo góc lớn ở ban công và khung cửa, các đường cong/vòm nhẹ tạo cảm giác dịu, mảng tường trắng kem/beige, trần ban công ốp lam gỗ + đèn downlight âm, lan can tối giản, bồn cây tích hợp với cây rủ. Bố cục thoáng, sang kiểu “resort đô thị”. Ánh sáng ban ngày mềm. Kết quả siêu thực như ảnh chụp từ máy ảnh kỹ thuật số, HDR, sắc nét, 4K. Không chữ, không watermark, không người."
    },
    {
        label: "4) BRUTALIST NHIỆT ĐỚI / CÔNG NGHIỆP HIỆN ĐẠI",
        value: "Mặt tiền nhà phố phong cách brutalist nhiệt đới: mảng đặc mạnh, bê tông/xi măng xám hoặc sơn hiệu ứng khoáng, các khoảng lõm sâu, cửa kính đặt lùi, lam/cánh chớp che nắng dạng bản lớn (có thể mở gập), chi tiết kim loại tối màu. Tạo tương phản ấm/lạnh bằng ánh sáng nội thất vàng ấm và mặt đứng xám lạnh. Bề mặt có vi chi tiết vật liệu thật. Kết quả như ảnh chụp từ máy ảnh kỹ thuật số, HDR, sắc nét, 4K. Không chữ, không watermark, không người."
    },
    {
        label: "5) HIỆN ĐẠI TỐI GIẢN – KHỐI HỘP + KHE CỬA",
        value: "Mặt tiền nhà phố hiện đại tối giản: mặt phẳng lớn sạch, ít chi tiết, tỷ lệ đặc–rỗng rõ ràng, nhấn bằng 1 mảng ốp gỗ lớn, cửa sổ khe ngang dài (horizontal slit window), khung nhôm đen, ban công kín đáo, cảm giác mạnh và gọn. Ánh sáng tự nhiên, bóng đổ rõ, vật liệu chân thực. Kết quả như ảnh chụp từ máy ảnh kỹ thuật số, HDR, sắc nét, 4K. Không chữ, không watermark, không người."
    },
    {
        label: "6) HIỆN ĐẠI BẢN ĐỊA – GẠCH + VÒM + HOA GIÓ",
        value: "Mặt tiền nhà phố phong cách hiện đại bản địa (new vernacular): kết hợp gạch đỏ lộ thiên + tường hoa gió/đục lỗ tạo hoa văn và bóng đổ, một vòm lớn làm điểm nhấn, ô cửa oval/bo tròn, nhấn terracotta (bồn cây/ống tròn), cây xanh rủ nhiều lớp. Cảm giác ấm và thủ công nhưng vẫn hiện đại. Ánh nắng tạo pattern shadow rõ. Kết quả siêu thực như ảnh chụp từ máy ảnh kỹ thuật số, HDR, sắc nét, 4K. Không chữ, không watermark, không người."
    },
    {
        label: "7) KHUNG LỚI TỐI GIẢN – QUIET LUXURY",
        value: "Mặt tiền nhà phố tối giản “quiet luxury”: một khung bao lớn (frame) ôm toàn bộ mặt đứng, bên trong là loggia lõm sâu trồng cây, vật liệu tấm lớn (đá/xi măng/porcelain slab) mạch ghép mịn, cổng kim loại tối giản, mảng gạch thông gió/khối đục lỗ tăng riêng tư và thông thoáng. Bố cục rất sạch và sang. Ánh sáng mềm, phản xạ thật. Kết quả như ảnh chụp từ máy ảnh kỹ thuật số, HDR, sắc nét, 4K. Không chữ, không watermark, không người."
    },
    {
        label: "8) HIỆN ĐẠI ĐEN CAO CẤP",
        value: "Mặt tiền biệt thự/nhà phố phong cách hiện đại cao cấp tông tối (đen/than): khối lớn mạnh, kính cao sát trần, hệ nan đứng (vertical fins), đường LED hắt tuyến tính tinh tế, vật liệu cao cấp (đá tối + kim loại + kính), cảnh quan uplight, không khí hoàng hôn/chiều tối sang trọng. Kết quả như ảnh chụp từ máy ảnh kỹ thuật số, HDR, sắc nét, 4K. Không chữ, không watermark, không người."
    },
    { label: "--- TÂN CỔ ĐIỂN & ĐÔNG DƯƠNG ---", value: "" },
    {
        label: "9) TÂN CỔ ĐIỂN ĐÔ THỊ",
        value: "Mặt tiền nhà phong cách tân cổ điển đô thị: bố cục đối xứng, cột và phào chỉ tiết chế (mảnh, tinh), cửa kính chia ô kiểu Pháp, lan can sắt, đèn tường ánh vàng 2700–3000K, màu kem/ivory sang, bề mặt sơn/đá giả đá tinh. Chụp lúc chiều tối/blue hour để lên đèn đẹp. Kết quả như ảnh chụp từ máy ảnh kỹ thuật số, HDR, sắc nét, 4K. Không chữ, không watermark, không người."
    },
    {
        label: "10) ĐÔNG DƯƠNG ĐƯƠNG ĐẠI",
        value: "Mặt tiền nhà phong cách Đông Dương đương đại: cửa vòm mềm, lan can sắt đen, tường sáng có texture nhẹ, điểm gỗ ấm, có thể nhấn mái/diềm mái nhẹ, mảng thoáng (hoa gió) tạo gió và bóng, cây xanh nhiệt đới. Ánh sáng ấm, cảm giác sang và hoài cổ vừa đủ. Kết quả như ảnh chụp từ máy ảnh kỹ thuật số, HDR, sắc nét, 4K. Không chữ, không watermark, không người."
    },
    { label: "--- CONTEMPORARY (MỚI) ---", value: "" },
    {
        label: "C1) Ngoại thất Contemporary mềm (Soft Contemporary)",
        value: "Ngoại thất nhà ở phong cách Contemporary mềm, hình khối hiện đại đơn giản, bo cong nhẹ các góc, màu trung tính sáng (xám nhạt, be, trắng ngà), điểm nhấn gỗ ấm, chi tiết tối giản, ánh sáng ban ngày dịu, bóng đổ mềm, ảnh kiến trúc chân thực, HDR, 4K, không người, không chữ, không logo"
    },
    {
        label: "C2) Ngoại thất Contemporary Nhiệt đới",
        value: "Ngoại thất nhà phong cách Contemporary nhiệt đới, kiến trúc hiện đại thích nghi khí hậu nóng ẩm, mái đua rộng, lam che nắng đứng, vật liệu tự nhiên: gỗ, đá, bê tông hoàn thiện mịn, nhiều cây xanh tích hợp mặt đứng, ánh sáng tự nhiên mạnh, bóng đổ rõ, ảnh chụp kiến trúc siêu thực, 4K"
    },
    {
        label: "C3) Ngoại thất Contemporary khối hộp",
        value: "Ngoại thất nhà phong cách Contemporary khối hộp, hình khối vuông vức, mái bằng, đường nét ngang dọc rõ ràng, bảng màu đơn sắc trung tính, mặt đứng gọn gàng, ít chi tiết, ảnh kiến trúc chuyên nghiệp, sắc nét, 4K"
    },
    {
        label: "C4) Ngoại thất Biệt thự Contemporary cao cấp",
        value: "Ngoại thất biệt thự phong cách Contemporary cao cấp, hiện đại sang trọng tiết chế, mảng kính lớn, đá ốp và gỗ tự nhiên, tỷ lệ khối cân đối, ánh sáng tinh tế, không khí cao cấp nhưng nhẹ nhàng, ảnh kiến trúc cao cấp, HDR, 4K"
    },
    {
        label: "C5) Ngoại thất Contemporary Đông Dương (bản hiện đại)",
        value: "Ngoại thất nhà phong cách Contemporary Đông Dương, tái hiện tinh thần Indochine theo hướng hiện đại, tường màu kem, lam gỗ, vòm cong nhẹ, tỷ lệ nhiệt đới, chi tiết tinh giản, ánh sáng ban ngày mềm, ảnh kiến trúc chân thực, 4K"
    },
    {
        label: "C6) Ngoại thất Contemporary tối giản",
        value: "Ngoại thất nhà phong cách Contemporary tối giản, hình khối thuần khiết, cực kỳ gọn gàng, bề mặt phẳng, ít cửa mở, màu trắng and xám nhạt, không khí tĩnh, tinh tế, ảnh kiến trúc tối giản, 4K"
    },
    {
        label: "C7) Ngoại thất Nhà phố Contemporary",
        value: "Ngoại thất nhà phố phong cách Contemporary, mặt tiền hẹp, tổ chức không gian theo chiều cao, ban công âm, mảng đặc rỗng rõ ràng, vật liệu hiện đại, mặt đứng sạch, ánh sáng tự nhiên, bối cảnh đô thị thực, ảnh kiến trúc chân thực, 4K"
    },
    {
        label: "C8) Ngoại thất Contemporary bê tông & gỗ",
        value: "Ngoại thất nhà Contemporary kết hợp bê tông and gỗ, bê tông trần hoàn thiện mịn, nan gỗ đứng tạo điểm nhấn ấm, tương phản vật liệu thô and ấm, ánh sáng ban ngày dịu, ảnh kiến trúc chi tiết cao, 4K"
    },
    {
        label: "C9) Ngoại thất Contemporary bo cong",
        value: "Ngoại thất nhà Contemporary hình khối bo cong, đường cong mềm mại, liền mạch, bề mặt tường trát mịn, màu trung tính sáng, ánh sáng tự nhiên, bóng đổ mềm, ảnh kiến trúc siêu thực, 4K"
    },
    {
        label: "C10) Ngoại thất Villa Contemporary nhiệt đới tối giản",
        value: "Ngoại thất villa phong cách Contemporary nhiệt đới tối giản, hình khối đơn giản, không gian mở, sân hiên lớn, cây xanh bao quanh, vật liệu gỗ and đá tự nhiên, ánh sáng nhiệt đới mạnh, render kiến trúc chân thực, 4K"
    },
    { label: "--- HIỆN ĐẠI NHIỆT ĐỚI / MINIMAL ---", value: "" },
    {
        label: "11) NEW VERNACULAR TERRACOTTA + VÒM + HOA GIÓ",
        value: "Thiết kế mặt tiền nhà phố theo phong cách New Vernacular nhiệt đới với bảng màu ấm (kem–beige–terracotta), nhấn mảng ốp gạch/terracotta lớn, cửa vòm cao làm điểm nhấn, thêm ô cửa tròn nhỏ, lan can sắt đen mảnh, kết hợp mảng bông gió (gạch thông gió) để tạo riêng tư and thông thoáng, tích hợp bồn cây âm lan can and cây rủ xanh mát, ánh sáng nội thất vàng ấm hắt nhẹ. Vật liệu chân thực: stucco mịn + gạch terracotta + kim loại sơn đen + kính trong. Bóng đổ rõ, không khí nhiệt đới. Kết quả siêu thực như ảnh chụp từ máy ảnh kỹ thuật số, HDR, sắc nét, 4K, không chữ, không watermark, không người."
    },
    {
        label: "12) TROPICAL BRUTALISM – THÁP VÒM + MÀNG GẠCH",
        value: "Thiết kế nhà phố Tropical Brutalism: bố cục khối đặc–rỗng rõ ràng, một “tháp” đứng bo góc mềm chạy suốt mặt tiền, tích hợp mảng brick screen/terracotta perforated screen dạng lưới dày tạo bóng đổ, nhấn cửa vòm ở tầng trệt and vòm lớn ở tầng trên, ban công kính mảnh, loggia sâu, trần ốp gỗ tối, cây xanh leo/rủ theo tầng. Vật liệu: bê tông/xi măng xám mịn + gạch terracotta đục lỗ + gỗ tối + kính low-iron. Ánh sáng hoàng hôn/blue hour với đèn hắt ấm, tương phản ấm–lạnh. Kết quả siêu thực như ảnh chụp máy ảnh kỹ thuật số, HDR, DOF nhẹ, 4K, không chữ, không watermark, không người."
    },
    {
        label: "13) WARM MINIMAL – ỐP KIM LOẠI/ĐỒNG + KHỐI HỘP",
        value: "Thiết kế mặt tiền nhà phố phong cách Warm Minimal sang trọng: hình khối tối giản, mặt phẳng lớn sạch, nhấn các mảng ốp kim loại tông đồng (copper/corten) hoặc gạch/đá màu đồng, tạo cảm giác ấm and cao cấp; khe cửa kính đặt lùi, đường chỉ âm tinh tế, ban công kín đáo, chi tiết tối giản tuyệt đối. Vật liệu chân thực: đá/xi măng mịn + kim loại tông đồng + kính đen nhẹ + cửa gara phẳng. Ánh sáng chiều muộn, bóng đổ dài, không gian yên tĩnh. Kết quả siêu thực như ảnh chụp máy ảnh kỹ thuật số, HDR, sắc nét, 4K, không chữ, không watermark, không người."
    },
    {
        label: "14) NARROW HOUSE MINIMAL – MÀNG LAM GỖ DỌC",
        value: "Thiết kế nhà phố hẹp phong cách Minimal Tropical: mặt tiền tạo bởi hệ lam gỗ dọc (vertical timber fins) che nắng toàn tầng, phía sau là kính lớn đặt lùi để tăng bóng đổ and riêng tư; ban công mảnh, lan can tối giản, mảng tường trắng/xám nhạt sạch, điểm cây xanh trong hốc ban công. Vật liệu: sơn bả mịn + gỗ/lam giả gỗ + nhôm kính đen + đèn downlight âm trần. Ánh sáng hoàng hôn nhẹ, bóng đổ mịn. Kết quả siêu thực như ảnh chụp máy ảnh kỹ thuật số, HDR, sắc nét, 4K, không chữ, không watermark, không người."
    },
    {
        label: "15) CLIMATE-RESPONSIVE MINIMAL – MÀN BÔNG GIÓ",
        value: "Thiết kế nhà phố hướng nắng gắt theo phong cách Climate-Responsive Minimal: mặt tiền có màn che nắng lớn dạng bông gió/lưới perforated screen (họa tiết lặp) như một lớp “da thứ hai”, tạo riêng tư and thông gió; cửa kính đặt lùi phía sau, các hốc trồng cây xen kẽ, mái/pergola mảnh trên sân thượng, khối trắng tinh gọn. Vật liệu: bê tông/sơn mịn trắng + màn bông gió màu sáng + khung nhôm đen + cây xanh nhiệt đới. Ánh sáng ban ngày rõ, bóng đổ pattern đẹp. Kết quả siêu thực như ảnh chụp máy ảnh kỹ thuật số, HDR, sắc nét, 4K, không chữ, không watermark, không người."
    },
    {
        label: "16) CONTEMPORARY TROPICAL LUXURY – KHỐI XẾP LỚP",
        value: "Thiết kế mặt tiền nhà phố/biệt thự phố phong cách Contemporary Tropical Luxury: khối hộp xếp lớp, ban công sâu tạo bóng đổ, tích hợp bồn cây lớn theo từng tầng (cây bụi + cây thân nhỏ), mảng ốp đá/tấm xám (stone/porcelain slab) chia module tinh tế, nhấn một khối trắng lớn tối giản ở tầng trên, kính lớn khung đen, trần ban công ốp gỗ tối and đèn âm trần. Tổng thể sang, xanh, hiện đại. Kết quả siêu thực như ảnh chụp máy ảnh kỹ thuật số, HDR, DOF nhẹ, sắc nét, 4K, không chữ, không watermark, không người."
    },
    {
        label: "17) INDUSTRIAL TROPICAL – KHUNG MÁI SÂU + MÀU ĐỒNG",
        value: "Thiết kế nhà phố Industrial Tropical hiện đại: khung mái đua sâu tạo bóng, cấu trúc mạnh mẽ, tường xám bê tông/xi măng mịn, nhấn các “hộp” ban công ốp tông đồng/bronze nhô ra, kính lớn đặt lùi, cây xanh dày ở ban công and sân thượng, ánh sáng đèn vàng ấm bên trong tạo tương phản. Vật liệu PBR chân thực: bê tông mịn + kim loại bronze + gỗ tối + nhôm kính đen. Kết quả siêu thực như ảnh chụp máy ảnh kỹ thuật số, HDR, sắc nét, 4K, không chữ, không watermark, không người."
    },
    {
        label: "18) SOFT MINIMAL CURVED – NHÀ GÓC LÔ + BO CONG",
        value: "Thiết kế nhà phố/biệt thự góc lô phong cách Soft Minimal Curved: hình khối bo cong lớn ở tầng trên, khung bao trắng mịn, loggia lõm sâu, trần ốp gỗ ấm, cửa kính lớn khung đen, ban công tích hợp bồn cây dài with cây rủ, chi tiết tối giản sạch sẽ; điểm nhấn vòm/bo tròn nhẹ ở cửa/cổng tạo cảm giác mềm and sang. Ánh sáng ban ngày trong trẻo, bóng đổ mềm. Kết quả siêu thực như ảnh chụp máy ảnh kỹ thuật số, HDR, sắc nét, 4K, không chữ, không watermark, không người."
    },
    {
        label: "19) SOFT MINIMAL LUXURY – “NEO ARCH” + VIỀN KIM LOẠI",
        value: "Áp dụng phong cách Soft Minimal Luxury (Neo-Arch) with hình khối tối giản bo cong, một cửa sổ vòm lớn trung tâm, các lớp viền cong lồng nhau có nẹp kim loại màu champagne/gold, ban công/loggia lõm sâu có đèn hắt ấm, bề mặt stucco trắng mịn liền mạch, kính xanh nhạt/low-iron and rèm voan, cảnh quan nhiệt đới gọn gàng; phối cảnh chính diện như chụp kiến trúc, ánh sáng ban ngày trong trẻo, bóng đổ sạch. Kết quả phải siêu thực như ảnh chụp từ máy ảnh kỹ thuật số, HDR, sắc nét, 4K, không chữ, không logo, không watermark, không người."
    },
    {
        label: "20) MODERN ART-DECO MINIMAL – VÒM LỚN + HỌA TIẾT ROSETTE",
        value: "Áp dụng phong cách Modern Art-Deco Minimal with mặt tiền trắng sạch, mái đua phẳng bo tròn góc, một cửa sổ vòm lớn có họa tiết rosette hình nan quạt ở tâm kính, thêm các chi tiết hình tròn/ô tròn trang trí, dải ốp đá tối theo trục đứng làm khung, cửa kính khung nhôm đen and bậc tam cấp tối giản; sân vườn xanh mượt, ánh sáng dịu, tỷ lệ sang and cân đối. Kết quả phải siêu thực như ảnh chụp từ máy ảnh kỹ thuật số, HDR, sắc nét, 4K, không chữ, không logo, không watermark, không người."
    },
    {
        label: "21) TROPICAL MEDITERRANEAN MODERN – NHỊP VÒM ĐÔI + PERGOLA GỖ",
        value: "Áp dụng phong cách Tropical Mediterranean Modern with nhà ống 2 tầng/gác lửng, nhịp cửa vòm tầng trệt and vòm tầng lầu, loggia có bồn cây dài and cây rủ, mảng nhấn đứng dạng niche cao ốp gỗ/đá ấm, mái/pergola gỗ nan ngang tạo bóng sọc đẹp, lan can sắt đen mảnh, tường stucco trắng + điểm be ấm; bối cảnh nhiệt đới, trời xanh, bóng đổ rõ. Kết quả phải siêu thực như ảnh chụp từ máy ảnh kỹ thuật số, HDR, sắc nét, 4K, không chữ, không logo, không watermark, không người."
    },
    {
        label: "22) SOFT MODERN TROPICAL – KHỐI HỘP BO GÓC + GỖ SỌC + “PORTHOLE”",
        value: "Áp dụng phong cách Soft Modern Tropical with khối hộp tối giản bo cong ở tầng trên, một mảng tường xám đậm làm nền tương phản, cửa mở vòm nhẹ and lan can âm tạo chiều sâu, mảng gỗ sọc dọc (vertical slats) cho điểm nhấn ấm, cổng gara nan đứng kín đáo and một ô cửa tròn (porthole) trang trí trên mảng gỗ, bồn cây dày tầng tầng; ánh sáng ban ngày sạch, bóng đổ mềm. Kết quả phải siêu thực như ảnh chụp từ máy ảnh kỹ thuật số, HDR, sắc nét, 4K, không chữ, không logo, không watermark, không người."
    },
    {
        label: "23) URBAN RESORT “NEO-ARCH” – NHIỀU KHUNG VÒM + MẢNG BE ẤM",
        value: "Áp dụng phong cách Urban Resort Neo-Arch with bố cục 2 tầng tối giản nhưng giàu nhịp vòm: cổng/mặt tiền tầng trệt là cụm vòm liên hoàn, tầng trên có khung vòm lớn and các hốc cong bo tròn, viền be/champagne làm đường gờ mảnh tạo chiều sâu, loggia có cây xanh, trần ban công ốp gỗ tối and đèn downlight, tường stucco trắng mịn; phối cảnh chính diện, cảnh quan xanh gọn, cảm giác “resort” hiện đại. Kết quả phải siêu thực như ảnh chụp từ máy ảnh kỹ thuật số, HDR, sắc nét, 4K, không chữ, không logo, không watermark, không người."
    },
    { label: "--- PHONG CÁCH NHẬT BẢN (JAPANESE) ---", value: "" },
    {
        label: "24) Nhà pavilion Nhật – đen, ngang, giữa rừng",
        value: "Modern Japanese forest pavilion, low horizontal massing, layered deep overhanging eaves, black charred wood cladding (shou sugi ban), floor-to-ceiling glass walls, warm amber interior lighting glowing at dusk, wet stone landscaping with moss, dense green forest background with light mist, cinematic moody atmosphere, photoreal, ultra-detailed materials, soft overcast sky, 24-28mm wide angle, eye-level, centered composition. Negative: change building shape, change openings, add floors, distort proportions, extra columns, crooked roof, cartoon, lowres, blurry"
    },
    {
        label: "25) Nhà Nhật truyền thống nhiều mái + hồ koi + cầu gỗ",
        value: "Traditional Japanese house, multi-tiered hip roofs with dark tiles, timber frame and light plaster walls, wooden veranda railings, koi pond with natural rocks, small curved wooden bridge, manicured Japanese garden (pines, shrubs, moss), calm daylight, soft overcast, highly realistic, crisp textures, 35mm, slightly elevated viewpoint. Negative: modern facade, glass curtain wall, neon, change roof form, change proportions, oversaturated, CGI look"
    },
    {
        label: "26) Villa 1 tầng hiện đại mái ngói tối + sân vườn stepping-stone",
        value: "Contemporary single-storey villa with dark tiled roof, beige plaster walls, black aluminum window frames, large glass sliding doors, warm interior lights at golden hour, minimalist landscape with large stepping stone path, trimmed hedges and groundcover, reflecting pool, clean modern Japanese-inspired detailing, photoreal, 28-35mm, eye-level, slightly off-center angle. Negative: add second floor, change roof pitch, alter window sizes, add ornaments, fisheye distortion"
    },
    {
        label: "27) Villa resort nhiệt đới – mái ngói đỏ + hồ nước/tiểu cảnh",
        value: "Tropical resort villa with terracotta roof tiles, deep shaded veranda, expansive glass openings, warm cozy interior lighting at dusk, reflecting pond water feature beside the deck, palm trees framing, lush garden, serene luxury atmosphere, photorealistic, cinematic lighting, 24-28mm wide, eye-level. Negative: change architecture style, add high-rise, change roof color drastically, unrealistic reflections, plastic materials"
    },
    {
        label: "28) Nhà sân trong (compound) – tường đá + mái ngói xám + vườn hoa",
        value: "Courtyard compound house, dark grey tiled roofs, stone walls and timber doors, inner courtyard with planters and colorful flowers, warm exterior sconces at late afternoon, village-like calm, aerial drone view, high detail, realistic textures, soft natural light. Negative: modern glass tower, change layout, remove courtyard, extreme blur, oversharpen"
    },
    {
        label: "29) Sân Zen hiện đại – sàn gỗ + sỏi cào + đá tảng",
        value: "Modern Japanese zen courtyard, timber deck engawa, sliding glass doors, raked white gravel garden, stepping stones, large natural boulders, sculpted shrubs, warm late-afternoon sunlight with soft shadows, minimalist luxury, photoreal, ultra-clean details, 28-35mm, low-to-eye-level perspective. Negative: add clutter, add bright colors, change deck geometry, wet rain look, cartoon render"
    },
    {
        label: "30) View sân trong – shoji + gỗ + ánh sáng ấm",
        value: "Japanese courtyard view, timber beams and columns, shoji screen panels on upper level, open living room facing a zen garden with bonsai pine, warm soft sunlight, gentle ambient glow, minimalist Japanese interior-exterior continuity, natural wood tones, photoreal, 35mm, eye-level. Negative: change facade lines, add modern ornaments, neon, messy furniture, warped perspective"
    }
];

const CONTEXT_OPTIONS = [
  '-- Chọn bối cảnh --',
  'Ảnh chụp tả thực công trình tại một con hẻm nhỏ ở Hà Nội, với kiến trúc cổ and dây điện chằng chịt, như chụp bằng máy ảnh kỹ thuật số.',
  'Ảnh chụp siêu thực công trình trên một sườn đồi ở Đà Lạt, bao quanh bởi rừng thông and sương mù buổi sáng.',
  'Công trình tại khu villa sang trọng ở quận 2, TP.HCM, nhiều cây xanh and không gian mở, ánh sáng tự nhiên.',
  'Ảnh tả thực công trình đặt giữa khu phố cổ Hội An, với tường vàng and mái ngói rêu phong đặc trưng.',
  'Công trình hiện đại ven biển Mỹ Khê, Đà Nẵng, với bãi cát trắng and biển xanh, như một bức ảnh du lịch.',
  'Biệt thự nghỉ dưỡng nhìn ra những dãy núi đá vôi ở Ninh Bình, xung quanh là sông nước and đồng lúa, chụp như ảnh thực tế.',
  'Ảnh chụp công trình trên một đường phố sầm uất ở quận Shibuya, Tokyo, Nhật Bản, với biển hiệu neon and người qua lại tấp nập, chất lượng ảnh như chụp thực tế.',
  'Công trình đặt tại một khu ngoại ô ở California, Mỹ, với những cây cọ and bầu trời trong xanh, ánh sáng chói chang.',
  'Tái hiện cảnh công trình nằm trên một con phố cổ kính ở Paris, Pháp, với kiến trúc Haussmann đặc trưng, như ảnh chụp từ máy ảnh film.',
  'Biệt thự sang trọng ven hồ Como, Ý, with những ngọn núi hùng vĩ làm nền, ảnh chụp siêu thực.',
  'Ngôi nhà gỗ ấm cúng giữa một khu rừng tuyết phủ ở Canada, có khói bốc lên từ ống khói, tả thực đến từng chi tiết.',
];

const ASPECT_RATIO_OPTIONS = ['Tự động (Giữ nguyên gốc)', '16:9 (Landscape)', '9:16 (Portrait)', '1:1 (Square)', '4:3 (Standard)', '3:4 (Portrait)', '3:2 (DSLR)', '21:9 (Cinematic)'];

const SelectInput: React.FC<{ label: string, options: string[], value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }> = ({ label, options, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-brand-text-muted mb-1">{label}</label>
        <select value={value} onChange={onChange} className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);


const PromptSampleList: React.FC<{ samples: {label: string, value: string}[], onSelect: (prompt: string) => void }> = ({ samples, onSelect }) => (
    <div className="max-h-64 overflow-y-auto space-y-2 p-2 bg-brand-bg/50 rounded-lg border border-brand-primary/50 custom-scrollbar">
        {samples.map((sample, index) => {
            const isHeader = sample.label.startsWith('---');
            if (isHeader) {
                return (
                    <div key={index} className="px-2 py-2 text-[10px] font-bold text-brand-accent uppercase tracking-wider border-b border-brand-primary/30 mb-1 mt-2 first:mt-0">
                        {sample.label.replace(/---/g, '').trim()}
                    </div>
                );
            }
            return (
                <button key={index} onClick={() => onSelect(sample.value)} className="w-full text-left text-xs p-2 rounded-md bg-brand-primary/50 hover:bg-brand-accent transition-colors border border-transparent hover:border-brand-primary/50">
                    <span className="font-semibold block mb-0.5 text-brand-text">{sample.label}</span>
                </button>
            );
        })}
    </div>
);


export const StyleTransferTab: React.FC<StyleTransferTabProps> = ({ onEditRequest, onVideoRequest, initialImage, onClearInitialImage }) => {
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [styleImage, setStyleImage] = useState<ImageFile | null>(null);
  const [prompt, setPrompt] = useState('');
  const [contextPrompt, setContextPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIO_OPTIONS[0]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [imageForComparison, setImageForComparison] = useState<string | undefined>();
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [lastPrompt, setLastPrompt] = useState('');

  useEffect(() => {
    if (initialImage) {
      setOriginalImage(initialImage);
      setImageForComparison(initialImage.base64);
      onClearInitialImage?.(); 
    }
  }, [initialImage, onClearInitialImage]);

  return (
    <BaseTab 
      tabKey="style_transfer" 
      onEditRequest={onEditRequest}
      onVideoRequest={onVideoRequest}
      comparisonImage={imageForComparison}
      showAngleActions={true}
    >
      {({ setLoading, setResult, addHistoryItem }) => {

        const handleRegenerate = useCallback(async (modifier: string) => {
            if (!lastPrompt) {
                alert("Vui lòng tạo một ảnh trước khi đổi góc chụp.");
                return;
            };
            setLoading(true);
            setResult(null);
            
            const newPrompt = `${lastPrompt}. Yêu cầu bổ sung: ${modifier}`;
            const imagesToSend: ImageFile[] = [];
            if (originalImage) imagesToSend.push(originalImage);
            if (styleImage) imagesToSend.push(styleImage);

            const response = await generateImage(newPrompt, imagesToSend, numberOfImages);
            
            setLastPrompt(newPrompt); // Update last prompt for subsequent changes
            setResult(response);
            if (!response.error) {
                addHistoryItem(newPrompt, response);
            }
            setLoading(false);
        }, [lastPrompt, originalImage, styleImage, numberOfImages, setLoading, setResult, addHistoryItem]);

        useEffect(() => {
            const handleEvent = (event: Event) => {
                const customEvent = event as CustomEvent<{ modifier: string }>;
                if (customEvent.detail?.modifier) {
                    handleRegenerate(customEvent.detail.modifier);
                }
            };
            document.addEventListener('regenerateRequest', handleEvent);
            return () => {
                document.removeEventListener('regenerateRequest', handleEvent);
            };
        }, [handleRegenerate]);


        const handleGenerate = async () => {
          if (!originalImage) {
            alert('Vui lòng tải ảnh gốc.');
            return;
          }
          if (!styleImage && !prompt.trim()) {
            alert('Vui lòng tải ảnh style mới hoặc nhập mô tả phong cách.');
            return;
          }

          setLoading(true);
          setResult(null);
          setImageForComparison(originalImage.base64);
          
          let aspectRatioPrompt = '';
          if (aspectRatio === ASPECT_RATIO_OPTIONS[0]) { // "Automatic"
              if (originalImage?.width && originalImage?.height) {
                  aspectRatioPrompt = `Ảnh kết quả phải có tỷ lệ khung hình giống hệt ảnh gốc, là ${originalImage.width} pixel rộng and ${originalImage.height} pixel cao.`;
              } else {
                  aspectRatioPrompt = `Giữ nguyên tuyệt đối tỉ lệ khung hình của ảnh gốc.`;
              }
          } else {
              aspectRatioPrompt = `Tỷ lệ khung hình là ${aspectRatio.split(' ')[0]}.`;
          }
          
          const styleSourcePrompt = styleImage 
              ? `Áp dụng phong cách từ ảnh tham chiếu style (ảnh thứ hai). Tái tạo vật liệu, bảng màu and không khí ánh sáng.`
              : `Áp dụng phong cách được mô tả trong yêu cầu của người dùng.`;

          const promptElements = [
            `Nhiệm vụ: Biến đổi phong cách kiến trúc (Style Transfer) cho công trình trong ảnh gốc (ảnh 1).`,
            `QUY TẮC HÌNH KHỐI (MASSING RULES):`,
            `- GIỮ NGUYÊN: Các khối chính (main volumes), số tầng, and vị trí các mảng tường chính của công trình. Tôn trọng cấu trúc không gian của ảnh gốc.`,
            `- ĐƯỢC PHÉP THAY ĐỔI: Hình dáng mái, hệ cột, chi tiết ban công, cửa sổ, vật liệu ốp lát and các chi tiết trang trí mặt tiền để phù hợp hoàn toàn with phong cách mới.`,
            `- NGHIÊM CẤM (STRICTLY FORBIDDEN): Không được tự ý vẽ thêm các khối nhà mới bên cạnh, không thêm tầng, không thay đổi bối cảnh xung quanh quá mức làm mất tính chân thực.`,
            styleSourcePrompt,
            prompt ? `Yêu cầu bổ sung: "${prompt}".` : '',
            contextPrompt ? `Bối cảnh: "${contextPrompt}".` : `Giữ nguyên bối cảnh nền.`,
            aspectRatioPrompt,
            `Kết quả: Ảnh render kiến trúc siêu thực (Photorealistic), sắc nét 8K.`
          ];

          const fullPrompt = promptElements.filter(Boolean).join(' ');
          setLastPrompt(fullPrompt);
          
          const imagesToSend: ImageFile[] = [];
          if (originalImage) imagesToSend.push(originalImage);
          if (styleImage) imagesToSend.push(styleImage);

          const response = await generateImage(fullPrompt, imagesToSend, numberOfImages);
          
          setResult(response);
          addHistoryItem(fullPrompt, response);
          setLoading(false);
        };
        
        const handleSuggestPrompt = async () => {
            if (!styleImage) {
                alert('Vui lòng tải ảnh style mới để AI có thể phân tích and đưa ra gợi ý.');
                return;
            }
            setIsSuggesting(true);
            setResult(null);

            const systemInstruction = "Bạn là một AI kiến trúc sư chuyên phân tích and mô tả phong cách kiến trúc bằng tiếng Việt. Nhiệm vụ của bạn là tạo ra một mô tả chi tiết, mạch lạc để một AI khác có thể dựa vào đó tái tạo lại phong cách này. Chỉ trả về nội dung mô tả, không thêm lời chào hay giải thích.";
            const userPrompt = `Phân tích kỹ lưỡng ảnh phong cách kiến trúc được cung cấp. Dựa vào đó, tạo ra một mô tả chi tiết các yếu tố thẩm mỹ để áp dụng cho một công trình khác. Mô tả cần bao gồm:
- Hình khối tổng thể (ví dụ: khối trắng tối giản, có các hốc âm lớn dạng vòm, các mảng tường đặc/rỗng).
- Vật liệu hoàn thiện chính (ví dụ: hoàn thiện stucco trắng mịn, tầng trệt ốp đá xám, lan can kính cong).
- Các chi tiết kiến trúc đặc trưng (ví dụ: các ô cửa đứng bo góc, tường rào có khoét cong, đèn LED hắt khe).
- Không khí ánh sáng and bối cảnh (ví dụ: ánh sáng ban ngày chân thực, cây xanh gọn gàng, vỉa hè sạch).
- Yêu cầu chất lượng (ví dụ: ảnh chân thực, 35mm, chi tiết sắc nét).
Hãy viết mô tả dưới dạng một đoạn văn liền mạch, giống như một chỉ dẫn cho chuyên gia render.`;

            const response = await generateText(userPrompt, systemInstruction, styleImage);

            if (response.text) {
                setPrompt(response.text);
            } else {
                alert(`Lỗi khi tạo gợi ý: ${response.error || 'Lỗi không xác định'}`);
            }
            setIsSuggesting(false);
        };


        return (
          <Card title="Input">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-brand-text-muted mb-1">1. Ảnh gốc</label>
                    {originalImage ? (
                      <div className="relative group h-96 bg-brand-bg/50 border-2 border-dashed border-brand-primary/80 rounded-xl p-2">
                        <img src={originalImage.base64} alt="Ảnh gốc" className="w-full h-full object-contain rounded-lg"/>
                        <button 
                            onClick={() => setOriginalImage(null)} 
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600/80 text-white hover:bg-red-500 transition-colors z-10"
                            title="Xóa ảnh gốc"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                        </button>
                      </div>
                    ) : (
                      <ImageUploader onFileSelect={setOriginalImage} label="1. Tải ảnh gốc" />
                    )}
                </div>
                <ImageUploader onFileSelect={setStyleImage} label="2. Tải ảnh style mới (Tuỳ chọn)" />
              </div>
              
              <SelectInput 
                label="3. Lựa chọn bối cảnh (tuỳ chọn)"
                options={CONTEXT_OPTIONS}
                value={contextPrompt || CONTEXT_OPTIONS[0]}
                onChange={e => setContextPrompt(e.target.value === CONTEXT_OPTIONS[0] ? '' : e.target.value)}
              />

              <div>
                <div className="flex justify-between items-center mb-1">
                    <label htmlFor="style-prompt" className="block text-sm font-medium text-brand-text-muted">
                      4. Yêu cầu bổ sung
                    </label>
                     <button
                        onClick={handleSuggestPrompt}
                        disabled={isSuggesting || !styleImage}
                        className="text-xs bg-brand-primary hover:bg-brand-accent px-2 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSuggesting ? 'Đang phân tích...' : '✨ Gợi ý từ AI'}
                    </button>
                </div>
                <textarea
                  id="style-prompt"
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent transition"
                  placeholder="Chọn phong cách từ danh sách bên dưới hoặc nhập mô tả..."
                />
              </div>
               <div>
                  <label className="block text-sm font-medium text-brand-text-muted mb-2">Hoặc chọn một phong cách có sẵn</label>
                  <PromptSampleList samples={STYLE_PROMPT_SAMPLES} onSelect={setPrompt} />
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                   <NumberSelector label="5. Số lượng kết quả" value={numberOfImages} onChange={setNumberOfImages} min={1} max={4} />
                   <SelectInput label="6. Tỷ lệ khung hình" options={ASPECT_RATIO_OPTIONS} value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} />
                </div>

              <button
                onClick={handleGenerate}
                disabled={!originalImage}
                className="w-full bg-brand-accent hover:bg-opacity-80 text-white font-semibold px-4 py-3 rounded-lg text-sm transition-colors disabled:bg-brand-surface disabled:cursor-not-allowed"
              >
                Thực Hiện Đổi Style
              </button>
            </div>
          </Card>
        );
      }}
    </BaseTab>
  );
};
