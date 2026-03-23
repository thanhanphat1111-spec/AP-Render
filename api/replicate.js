import Replicate from "replicate";

export default async function handler(req, res) {
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

    let finalImage = imageBase64;
    if (finalImage && !finalImage.startsWith('data:')) {
      finalImage = `data:image/jpeg;base64,${finalImage}`;
    }

    if (action === 'generateImage') {
      const output = await replicate.run(
        "black-forest-labs/flux-schnell",
        { input: { prompt: prompt, go_fast: true, megapixels: "1", num_outputs: 1 } }
      );
      return res.status(200).json({ imageUrls: output });
    }

    // --- ĐÂY LÀ ĐOẠN CODE SỬA LỖI ---
    if (action === 'imageToImage' || action === 'editImage') {
      // BƯỚC 1: DÙNG MODEL CANNY ĐỂ KHÓA CHUẨN HÌNH KHỐI 100%
      // Model này sẽ vẽ lại nét mực cái nhà của anh trước, đảm bảo ban công, cửa sổ không bị méo.
      const output = await replicate.run(
        "lucataco/sdxl-controlnet:db25176b976b328114f2762a5b6748f325983652875b287957242c94a9747805",
        {
          input: {
            // BƯỚC 2: ÉP VẬT LIỆU SIÊU THỰC NHƯ ẢNH ANH MUỐN
            prompt: prompt + ", photorealistic architectural photography, ultra realistic, highly detailed, real concrete walls, glass windows, smooth materials, natural daylight, 8k resolution, ray tracing",
            negative_prompt: "clay, 3d model, render, toy, sketch, cartoon, ugly, low quality, plastic, messy lines, abstract, deformed architecture, distorted, noisy",
            image: finalImage,
            // Sử dụng Canny để khóa nét
            controlnet_name: "canny",
            // Giữ lại 80% nét của ảnh gốc (khóa form rất chặt)
            controlnet_conditioning_scale: 0.8,
            // Lực vẽ vật liệu vừa phải để không phá nét
            prompt_strength: 0.7,
            num_outputs: 1
          }
        }
      );
      return res.status(200).json({ imageUrls: output });
    }
    // ---------------------------------

    if (action === 'generateText') {
      const output = await replicate.run(
        "meta/meta-llama-3-8b-instruct",
        { input: { prompt: prompt, max_tokens: 512 } }
      );
      return res.status(200).json({ text: Array.isArray(output) ? output.join("") : String(output) });
    }

    return res.status(400).json({ error: 'Hành động không được hỗ trợ' });

  } catch (error) {
    console.error("Lỗi máy chủ Replicate:", error);
    return res.status(500).json({ error: error.message || "Lỗi máy chủ nội bộ." });
  }
}
