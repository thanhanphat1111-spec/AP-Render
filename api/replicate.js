import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { action, prompt, imageBase64 } = req.body;

  try {
    if (action === 'generateImage') {
      const output = await replicate.run(
        "black-forest-labs/flux-schnell",
        {
          input: {
            prompt: prompt,
            go_fast: true,
            megapixels: "1",
            num_outputs: 1
          }
        }
      );
      return res.status(200).json({ imageUrls: output });
    }

    if (action === 'imageToImage' || action === 'editImage') {
      const output = await replicate.run(
        "stability-ai/sdxl",
        {
          input: {
            prompt: prompt,
            image: imageBase64,
            prompt_strength: 0.7
          }
        }
      );
      return res.status(200).json({ imageUrls: output });
    }

    if (action === 'generateText') {
      const output = await replicate.run(
        "meta/meta-llama-3-8b-instruct",
        {
          input: {
            prompt: prompt,
            max_tokens: 512
          }
        }
      );
      return res.status(200).json({ text: (output as string[]).join("") });
    }

    return res.status(400).json({ error: 'Action not supported' });
  } catch (error: any) {
    console.error("Replicate API Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
