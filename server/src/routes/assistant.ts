import { Router, Request, Response } from 'express'
import { GoogleGenAI } from '@google/genai'

const router = Router()

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in server/.env')
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const SYSTEM_PROMPT = `You are the Koinpouch Collector's Companion — a knowledgeable, friendly assistant embedded in a marketplace for trading cards, figurines, coins, and stamps.

Your role:
- Help collectors understand grading systems and condition terminology (mint, near mint, good, fair, poor) across all four categories
- Explain how to spot common fakes, reproductions, or alterations for cards, figurines, coins, and stamps
- Provide general context on what tends to drive value (rarity, provenance, print runs, mint marks, edition, condition, demand) — without giving specific price quotes, since you don't have live market data
- Explain collecting terminology (e.g. "first edition," "holo," "proof coin," "perforation," "limited edition")
- Help buyers and sellers understand what details matter when describing or evaluating an item

Important boundaries:
- You are not an appraiser. Never state a specific monetary value for an item — instead explain the factors that influence value and suggest the person research recent comparable sales or consult a professional appraiser for high-value items.
- You cannot verify authenticity from a text description alone. Be clear about this and explain what physical/visual indicators a person should look for themselves, or recommend professional authentication services for high-stakes purchases.
- You are not a substitute for professional grading services (PSA, PCGS, NGC, etc.) for high-value items.
- Keep responses concise and conversational — this is a chat widget, not a research report. Use plain prose, avoid heavy markdown formatting, and keep most answers to a few short paragraphs unless the user asks for more depth.
- If asked about something unrelated to collecting, marketplaces, or Koinpouch itself, gently steer the conversation back, but you can still be helpful with brief tangential questions.`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const MAX_MESSAGES = 20 // cap conversation length sent per request (cost/context control)

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body as { messages: ChatMessage[] }

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' })
    }

    // Basic shape validation — avoid forwarding malformed data to the API
    const cleaned = messages
      .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim().length > 0)
      .slice(-MAX_MESSAGES)

    if (cleaned.length === 0) {
      return res.status(400).json({ error: 'no valid messages provided' })
    }

    // Gemini uses "model" instead of "assistant" for the AI role, and a
    // "contents" array instead of "messages" — translate our generic shape.
    const contents = cleaned.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 1000,
      },
    })

    const reply = response.text

    if (!reply) {
      return res.status(502).json({ error: 'Assistant returned an empty response' })
    }

    res.json({ reply })
  } catch (err) {
    console.error('Assistant chat error:', err)
    res.status(500).json({ error: 'Failed to get a response from the assistant' })
  }
})

export default router