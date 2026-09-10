// Claude (via Emergent OpenAI-compatible gateway) helper
const BASE_URL = process.env.LLM_BASE_URL || 'https://integrations.emergentagent.com/llm'
const KEY = process.env.EMERGENT_LLM_KEY
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5'
const FAST_MODEL = process.env.CLAUDE_FAST_MODEL || 'claude-haiku-4-5-20251001'

export async function llmChat({ messages, model, maxTokens = 900, temperature = 0.6 }) {
  if (!KEY) throw new Error('Missing EMERGENT_LLM_KEY')
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || MODEL,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`LLM error ${res.status}: ${txt.slice(0, 300)}`)
  }
  const data = await res.json()
  return data?.choices?.[0]?.message?.content || ''
}

export const MODELS = { MODEL, FAST_MODEL }

export const AGRI_SYSTEM = `You are "Ask AgriLink AI", a friendly, practical assistant for Indian farmers and agricultural buyers on the Kisanbazarr / AgriLink 360 platform.
Help with: choosing the best market to sell, understanding price trends, finding nearby buyers, crop demand, negotiation tips, harvest & storage, and general crop guidance.
Be concise, warm and actionable. Use simple language. Use rupee (INR) values where relevant.
When you show market data, note it may be sample/demo data on this platform.
Never invent exact pesticide dosages or government scheme eligibility; suggest consulting a local agri officer for chemical advice.
Always answer in the user's requested language.`
