'use client'

import { useState, useRef, useEffect } from 'react'
import { useApp } from './store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Send, Loader2, Bot } from 'lucide-react'

const SUGGESTIONS = [
  'Where can I get the best price for tomatoes?',
  'Should I sell my crop today?',
  'Which nearby buyers need tomatoes?',
  'Compare tomato prices across markets.',
]

export default function AiChat() {
  const { language } = useApp()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: 'Namaste! I am AgriLink AI. Ask me about market prices, nearby buyers, or the best time to sell your crop.' }])
    }
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  const ask = async (text) => {
    const q = (text ?? input).trim()
    if (!q || busy) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: q }])
    setBusy(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: q, language }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'AI error')
      setSessionId(data.sessionId)
      setMessages((m) => [...m, { role: 'assistant', content: data.answer }])
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, I could not answer right now. Please try again in a moment.' }])
    } finally { setBusy(false) }
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center"
        aria-label="Ask AgriLink AI"
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-24 right-5 z-50 w-[min(92vw,380px)] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col"
            style={{ height: 'min(70vh, 560px)' }}
          >
            <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center"><Bot className="h-4 w-4" /></div>
              <div>
                <p className="font-semibold text-sm leading-tight">Ask AgriLink AI</p>
                <p className="text-[11px] opacity-80">Powered by Claude · {language}</p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3 bg-muted/30">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border rounded-bl-sm'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
              {messages.length <= 1 && (
                <div className="space-y-2 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => ask(s)} className="block w-full text-left text-xs bg-card border border-border rounded-xl px-3 py-2 hover:border-primary/50 transition">{s}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t bg-card flex items-center gap-2">
              <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ask()} placeholder="Ask about crops, prices, buyers..." className="h-10" />
              <Button size="icon" onClick={() => ask()} disabled={busy} className="h-10 w-10 shrink-0"><Send className="h-4 w-4" /></Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
