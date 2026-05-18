import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const base64Match = image.match(/^data:image\/([^;]+);base64,(.+)$/);
  if (!base64Match) {
    return res.status(400).json({ error: 'Invalid image format' });
  }

  let mediaType = `image/${base64Match[1]}`;
  const base64Data = base64Match[2];

  if (mediaType === 'image/jpg') mediaType = 'image/jpeg';
  if (!ALLOWED_TYPES.includes(mediaType)) {
    return res.status(400).json({ error: `Unsupported image type: ${mediaType}` });
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Data },
          },
          {
            type: 'text',
            text: `This is a receipt image. Parse it and return ONLY a JSON object with this exact format, no other text:
{
  "title": "store/restaurant name",
  "items": [{"name": "item name", "price": 1234}],
  "total": 12345,
  "currency": "KRW" or "USD"
}

Rules:
- "price" and "total" are numbers (no commas, no currency symbols)
- If currency looks like Korean Won, use "KRW". If dollars, use "USD"
- "title" should be the store/restaurant name from the receipt
- Include all line items with individual prices
- "total" is the final total amount paid
- If you cannot parse the receipt, return {"error": "Unable to parse receipt"}`
          }
        ]
      }]
    });

    const text = response.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(422).json({ error: 'Failed to parse receipt' });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Parse receipt error:', err.message, err.status, JSON.stringify(err.error || {}));
    return res.status(500).json({ error: `Failed: ${err.message}` });
  }
}
