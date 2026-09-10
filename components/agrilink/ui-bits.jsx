'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { BadgeCheck, Star, Loader2, Sprout } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function SectionTitle({ eyebrow, title, sub, center }) {
  return (
    <div className={center ? 'text-center max-w-2xl mx-auto' : ''}>
      {eyebrow && (
        <span className="inline-block text-xs font-semibold tracking-wider uppercase text-primary bg-secondary px-3 py-1 rounded-full mb-3">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl md:text-4xl font-extrabold text-foreground">{title}</h2>
      {sub && <p className="mt-3 text-muted-foreground text-base md:text-lg">{sub}</p>}
    </div>
  )
}

export function StatCounter({ value, suffix = '', prefix = '', decimals = 0 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true
        const dur = 1400
        const start = performance.now()
        const step = (now) => {
          const p = Math.min((now - start) / dur, 1)
          const eased = 1 - Math.pow(1 - p, 3)
          setDisplay(value * eased)
          if (p < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [value])
  return (
    <span ref={ref}>{prefix}{display.toLocaleString('en-IN', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}{suffix}</span>
  )
}

export function VerifiedBadge({ show, label = 'Verified' }) {
  if (!show) return null
  return (
    <Badge className="bg-primary/10 text-primary hover:bg-primary/10 gap-1 border-0">
      <BadgeCheck className="h-3.5 w-3.5" /> {label}
    </Badge>
  )
}

export function Rating({ value = 0 }) {
  return (
    <span className="inline-flex items-center gap-1 text-amber-500 text-sm font-medium">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {Number(value || 0).toFixed(1)}
    </span>
  )
}

export function Loading({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Loader2 className="h-7 w-7 animate-spin text-primary mb-3" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function EmptyState({ icon: Icon = Sprout, title, sub, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      {sub && <p className="text-muted-foreground text-sm mt-1 max-w-sm">{sub}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.06, ease: 'easeOut' } }),
}

export function Reveal({ children, i = 0, className = '' }) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      custom={i}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

export const DEMAND_COLORS = {
  High: 'bg-primary text-primary-foreground',
  Medium: 'bg-accent text-accent-foreground',
  Low: 'bg-muted text-muted-foreground',
}
