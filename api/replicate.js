import Replicate from "replicate";

export default async function handler(req: any, res: any) {
  // 1. Cấp quyền CORS để tránh bị trình duyệt chặn
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 2. Kiểm tra biến môi trường AN TOÀN từ bên trong hàm
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) {
      return res.status(500).json({ error: 'Chưa tìm thấy chìa khóa REPLICATE_API_TOKEN trên Vercel. Anh kiểm tra lại Settings nhé.' });
    }

    // Khởi tạo Replicate
    const replicate = new Replicate({
      auth: apiKey,
    });

    const { action, prompt, imageBase64 } = req.body;

    // 3. Xử lý các lệnh gọi
    if (action === 'generateImage') {
      const output = await replicate.run(
        "black-forest-labs/flux-schnell",
        {
          input: { prompt: prompt, go_fast: true, megapixels: "1", num_outputs: 1 }
        }
      );
      return res.status(200).json({ imageUrls: output });
    }

    if (action === 'imageToImage' || action === 'editImage') {
      const output = await replicate.run(
        "stability-ai/sdxl",
        {
          input: { prompt: prompt, image: imageBase64, prompt_strength: 0.7 }
        }
      );
      return res.status(200).json({ imageUrls: output });
    }

    if (action === 'generateText') {
      const output = await replicate.run(
        "meta/meta-llama-3-8b-instruct",
        {
          input: { prompt: prompt, max_tokens: 512 }
        }
      );
      return res.status(200).json({ text: (output as string[]).join("") });
    }

    return res.status(400).json({ error: 'Hành động không được hỗ trợ' });

  } catch (error: any) {
    console.error("Lỗi máy chủ Replicate:", error);
    // Trả về lỗi định dạng chuẩn JSON để frontend đọc được
    return res.status(500).json({ error: error.message || "Lỗi máy chủ nội bộ. Vui lòng thử lại." });
  }
}
