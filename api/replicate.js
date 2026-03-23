import Replicate from "replicate";

export default async function handler(req, res) {
  // Cấu hình CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) return res.status(500).json({ error: 'Chưa tìm thấy API Token.' });

    const replicate = new Replicate({ auth: apiKey });
    const { action, prompt, imageBase64 } = req.body;

    // Xử lý ảnh đầu vào
    let finalImage = imageBase64;
    if (finalImage && !finalImage.startsWith('data:')) {
      finalImage = `data:image/jpeg;base64,${finalImage}`;
    }

    // --- CHẠY BYTEDANCE SEEDREAM-4 THEO ĐÚNG LỆNH CURL CỦA ANH ---
    if (action === 'generateImage' || action === 'imageToImage') {
      const inputPayload = {
        prompt: prompt,
        size: "2K",
        max_images: 1,
        enhance_prompt: true,
        sequential_image_generation: "disabled"
      };

      // Nếu có ảnh tải lên (chạy Image-to-Image / Đắp vật liệu)
      if (finalImage) {
        inputPayload.image_input = finalImage; // Replicate SDK sẽ tự bóc tách Base64 thành file
        inputPayload.aspect_ratio = "match_input_image"; // Lấy tỉ lệ theo ảnh gốc như lệnh curl
      } else {
        // Nếu chỉ có Text (chạy Text-to-Image)
        inputPayload.aspect_ratio = "1:1";
        inputPayload.width = 2048;
        inputPayload.height = 2048;
      }

      const output = await replicate.run(
        "bytedance/seedream-4", // Gọi đúng model Bytedance
        { input: inputPayload }
      );
      
      // Lọc URL ảnh từ kết quả trả về
      const imageUrl = Array.isArray(output) ? output[0] : (output.url || output);
      return res.status(200).json({ imageUrls: [imageUrl] });
    }

    // --- GIỮ LẠI GEMINI 2.0 FLASH ĐỂ CHẠY TAB CHATBOT ---
    if (action === 'generateText') {
      const output = await replicate.run(
        "google/gemini-2.0-flash-exp:8b557340",
        { 
          input: { 
            prompt: prompt, 
            image: finalImage ? finalImage : undefined
          } 
        }
      );
      const cleanText = Array.isArray(output) ? output.join("") : (output.text || String(output));
      return res.status(200).json({ text: cleanText });
    }

    return res.status(400).json({ error: 'Hành động không được hỗ trợ' });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
