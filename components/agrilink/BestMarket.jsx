'use client'

import { useEffect, useState } from 'react'
import { useApp, RUPEE } from './store'
import { SectionTitle, Loading } from './ui-bits'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Calculator, Award, MapPin, Loader2, Navigation } from 'lucide-react'

export default function BestMarket() {
  const { t, api, location, requestLocation } = useApp()
  const [crops, setCrops] = useState([])
  const [crop, setCrop] = useState('Tomato')
  const [quantity, setQuantity] = useState(500)
  const [maxDistance, setMaxDistance] = useState(200)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { api('/market-prices/meta', { auth: false }).then((d) => setCrops(d.crops || [])).catch(() => {}) }, [api])

  const calculate = async () => {
    setLoading(true)
    let loc = location
    if (!loc) loc = await requestLocation()
    try {
      const d = await api('/best-market', { method: 'POST', auth: false, body: { crop, quantity: Number(quantity), lat: loc?.lat, lng: loc?.lng, maxDistance } })
      setResult(d)
    } finally { setLoading(false) }
  }

  return (
    <div className="container py-10">
      <SectionTitle eyebrow="Smart calculator" title={t('where_sell_title')} sub={t('where_sell_desc')} />

      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calculator className="h-4 w-4 text-primary" /> Inputs</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label>{t('crop')}</Label>
              <Select value={crop} onValueChange={setCrop}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">{crops.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('quantity')} (kg)</Label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Max travel distance: <span className="text-primary font-semibold">{maxDistance} km</span></Label>
              <Slider value={[maxDistance]} onValueChange={([v]) => setMaxDistance(v)} min={10} max={800} step={10} />
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {location ? (location.label || 'Your location') : 'Location not set (will ask)'}
            </div>
            <Button onClick={calculate} className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Navigation className="h-4 w-4 mr-2" />}{t('calculate')}
            </Button>
            <p className="text-[11px] text-muted-foreground">Transport is an estimate ({RUPEE}12/km + handling). Net = gross − transport.</p>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {loading && <Loading label="Comparing markets..." />}
          {!loading && result?.best && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="py-6">
                <div className="flex items-center gap-2 text-primary mb-3"><Award className="h-5 w-5" /><span className="font-semibold">Best Estimated Option</span></div>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="font-display text-2xl font-extrabold">{result.best.market}</p>
                    <p className="text-sm text-muted-foreground">{result.best.state} · {result.best.distance ?? '–'} km away · {RUPEE}{result.best.price}/{result.best.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{t('net_revenue')}</p>
                    <p className="font-display text-3xl font-extrabold text-primary">{RUPEE}{result.best.net.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-5">
                  <div className="rounded-xl bg-card p-3 text-center"><p className="text-xs text-muted-foreground">{t('gross_revenue')}</p><p className="font-bold">{RUPEE}{result.best.gross.toLocaleString('en-IN')}</p></div>
                  <div className="rounded-xl bg-card p-3 text-center"><p className="text-xs text-muted-foreground">{t('transport_est')}</p><p className="font-bold text-destructive">−{RUPEE}{result.best.transport.toLocaleString('en-IN')}</p></div>
                  <div className="rounded-xl bg-card p-3 text-center"><p className="text-xs text-muted-foreground">{t('net_revenue')}</p><p className="font-bold text-primary">{RUPEE}{result.best.net.toLocaleString('en-IN')}</p></div>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && result?.options?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">All markets ranked by net revenue</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {result.options.map((o, i) => (
                  <div key={o.market} className={`flex items-center justify-between rounded-xl border p-3 ${i === 0 ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
                    <div className="flex items-center gap-3">
                      <span className="h-7 w-7 rounded-full bg-muted text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <div>
                        <p className="font-semibold text-sm">{o.market}</p>
                        <p className="text-xs text-muted-foreground">{RUPEE}{o.price}/{o.unit} · {o.distance ?? '–'} km</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{RUPEE}{o.net.toLocaleString('en-IN')}</p>
                      <p className="text-[11px] text-muted-foreground">net est.</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {!loading && !result && (
            <Card><CardContent className="py-16 text-center text-muted-foreground">
              <Calculator className="h-10 w-10 mx-auto mb-3 text-primary/50" />
              Enter your crop and quantity, then tap Calculate to see where you should sell.
            </CardContent></Card>
          )}
        </div>
      </div>
    </div>
  )
}
