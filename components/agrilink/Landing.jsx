'use client'

import { useApp, RUPEE } from './store'
import { SectionTitle, StatCounter, Reveal } from './ui-bits'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ArrowRight, TrendingUp, MapPin, Sparkles, Calculator, ShieldCheck, Leaf, Truck, LineChart, BadgeCheck } from 'lucide-react'

const HERO_IMG = 'https://images.pexels.com/photos/29858623/pexels-photo-29858623.jpeg'
const IMG_VEG = 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2'
const IMG_FARM = 'https://images.unsplash.com/photo-1594760910270-8720de623883'

const STATS = [
  { key: 'stat_farmers', value: 12480, suffix: '+' },
  { key: 'stat_buyers', value: 3260, suffix: '+' },
  { key: 'stat_listings', value: 1890, suffix: '+' },
  { key: 'stat_markets', value: 150, suffix: '+' },
  { key: 'stat_improve', value: 18, suffix: '%' },
]

export default function Landing() {
  const { t, setView, openAuth, user } = useApp()

  const features = [
    { icon: TrendingUp, title: t('f_prices'), desc: t('f_prices_d'), view: 'prices' },
    { icon: MapPin, title: t('f_buyers'), desc: t('f_buyers_d'), view: 'nearby' },
    { icon: Calculator, title: t('f_best'), desc: t('f_best_d'), view: 'bestmarket' },
    { icon: Sparkles, title: t('f_ai'), desc: t('f_ai_d'), view: 'insights' },
  ]

  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative bg-hero-mesh">
        <div className="container grid lg:grid-cols-2 gap-10 items-center py-14 md:py-20">
          <div>
            <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 text-xs font-semibold text-primary bg-secondary px-3 py-1.5 rounded-full mb-5">
              <Leaf className="h-3.5 w-3.5" /> {t('brand')} · {t('brandSub')}
            </motion.span>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="font-display text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight">
              {t('hero_title')}
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl">
              {t('hero_desc')}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="h-12 px-6 text-base shadow-lg" onClick={() => setView('nearby')}>
                {t('cta_find')} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-6 text-base bg-background/70" onClick={() => setView('prices')}>
                {t('cta_explore')}
              </Button>
            </motion.div>
            <div className="mt-8 flex items-center gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-primary" /> Verified buyers</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Direct selling</span>
            </div>
          </div>

          {/* Hero visual with floating cards */}
          <div className="relative">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
              className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/40">
              <img src={HERO_IMG} alt="Farmer using smartphone in field" className="w-full h-[420px] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
            </motion.div>

            <motion.div className="absolute -left-4 top-10 glass rounded-2xl shadow-xl p-4 w-44 animate-float-slow">
              <p className="text-xs text-muted-foreground">Tomato · Nashik</p>
              <p className="font-display text-2xl font-extrabold text-primary">{RUPEE}28<span className="text-sm text-muted-foreground">/kg</span></p>
              <p className="text-xs text-primary flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +6% today</p>
            </motion.div>

            <motion.div className="absolute -right-3 bottom-8 glass rounded-2xl shadow-xl p-4 w-52 animate-float-med">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center"><MapPin className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-semibold">4 buyers nearby</p>
                  <p className="text-xs text-muted-foreground">within 15 km · up to {RUPEE}31/kg</p>
                </div>
              </div>
            </motion.div>

            <motion.div className="absolute right-8 -top-4 glass rounded-2xl shadow-xl px-4 py-3 animate-float-med">
              <p className="text-xs text-muted-foreground">Match Score</p>
              <p className="font-display text-xl font-extrabold text-accent-foreground">94%</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-border/60 bg-card">
        <div className="container py-8 grid grid-cols-2 md:grid-cols-5 gap-6">
          {STATS.map((s, i) => (
            <Reveal key={s.key} i={i} className="text-center">
              <p className="font-display text-3xl md:text-4xl font-extrabold text-primary">
                <StatCounter value={s.value} suffix={s.suffix} />
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">{t(s.key)}</p>
            </Reveal>
          ))}
        </div>
        <p className="text-center text-[11px] text-muted-foreground pb-4">* Figures shown are sample/demo data for illustration.</p>
      </section>

      {/* FEATURES */}
      <section className="container py-16 md:py-24">
        <SectionTitle center eyebrow="Features" title={t('features_title')} sub={t('features_sub')} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
          {features.map((f, i) => (
            <Reveal key={f.title} i={i}>
              <button onClick={() => setView(f.view)} className="group text-left h-full w-full rounded-2xl border border-border bg-card p-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display font-bold text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{f.desc}</p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-4">Explore <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" /></span>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-secondary/40">
        <div className="container py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <img src={IMG_FARM} alt="Farmland" className="rounded-3xl shadow-xl w-full h-[360px] object-cover" />
            <img src={IMG_VEG} alt="Fresh vegetables" className="hidden md:block absolute -bottom-8 -right-6 w-48 h-40 object-cover rounded-2xl shadow-2xl border-4 border-card" />
          </div>
          <div>
            <SectionTitle eyebrow="Simple" title={t('how_title')} />
            <div className="mt-8 space-y-5">
              {[t('how_1'), t('how_2'), t('how_3'), t('how_4')].map((step, i) => (
                <Reveal key={i} i={i}>
                  <div className="flex gap-4 items-start">
                    <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">{i + 1}</div>
                    <p className="text-base pt-1.5">{step}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Button className="mt-8" size="lg" onClick={() => user ? setView('dashboard') : openAuth('register')}>
              {user ? t('nav_dashboard') : t('register')} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16 md:py-24">
        <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-10 md:p-16 text-center">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-accent/30 animate-blob" />
          <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10 animate-blob" />
          <div className="relative">
            <h2 className="font-display text-3xl md:text-4xl font-extrabold">Ready to reach better markets?</h2>
            <p className="mt-3 text-primary-foreground/85 max-w-xl mx-auto">Join thousands of farmers and buyers trading smarter with live prices and verified connections.</p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Button size="lg" variant="secondary" className="h-12 px-6" onClick={() => user ? setView('marketplace') : openAuth('register')}>{t('cta_find')}</Button>
              <Button size="lg" variant="outline" className="h-12 px-6 bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white" onClick={() => setView('prices')}>{t('cta_explore')}</Button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card">
        <div className="container py-10 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center"><Leaf className="h-4 w-4 text-primary-foreground" /></div>
              <span className="font-display font-extrabold">{t('brand')}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t('tagline')}</p>
          </div>
          {[['Platform', ['nav_prices', 'nav_marketplace', 'nav_nearby', 'nav_demand']], ['Insights', ['nav_insights', 'f_best', 'f_ai']]].map(([head, keys]) => (
            <div key={head}>
              <p className="font-semibold text-sm mb-3">{head}</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {keys.map((k) => <li key={k}><button className="hover:text-primary" onClick={() => setView('prices')}>{t(k)}</button></li>)}
              </ul>
            </div>
          ))}
          <div>
            <p className="font-semibold text-sm mb-3">Get started</p>
            <Button className="w-full" onClick={() => openAuth('register')}>{t('register')}</Button>
          </div>
        </div>
        <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {t('brand')} · {t('brandSub')}. Built for farmers.
        </div>
      </footer>
    </div>
  )
}
