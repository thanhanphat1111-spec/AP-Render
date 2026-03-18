// File: api/replicate.ts

// Mở rộng băng thông cho ảnh kiến trúc nặng lên tới 10MB
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  const token = process.env.VITE_REPLICATE_API_TOKEN;

  if (!token) {
    return res.status(500).json({ error: 'Lỗi: Chưa cài token VITE_REPLICATE_API_TOKEN trên Vercel' });
  }

  try {
    if (req.method === 'POST') {
      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    if (req.method === 'GET') {
      const { id } = req.query;
      const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json",
        }
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
