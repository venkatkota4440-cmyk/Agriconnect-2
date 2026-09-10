'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useApp, RUPEE } from './store'
import { SectionTitle, Loading, VerifiedBadge, Rating, EmptyState } from './ui-bits'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Navigation, Loader2, Phone, Store, Truck, ShoppingCart, Sprout } from 'lucide-react'

const TYPES = [
  { key: 'buyers', label: 'Buyers', icon: ShoppingCart, color: '#1d7a46' },
  { key: 'farmers', label: 'Farmers', icon: Sprout, color: '#0f9d58' },
  { key: 'markets', label: 'Markets', icon: Store, color: '#e0a11b' },
  { key: 'transport', label: 'Transport', icon: Truck, color: '#2b7de9' },
]

export default function Nearby() {
  const { t, api, location, requestLocation, user, openAuth } = useApp()
  const [type, setType] = useState('buyers')
  const [radius, setRadius] = useState(150)
  const [crop, setCrop] = useState('all')
  const [crops, setCrops] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const mapRef = useRef(null)
  const mapObj = useRef(null)
  const layerRef = useRef(null)
  const LRef = useRef(null)

  useEffect(() => { api('/market-prices/meta', { auth: false }).then((d) => setCrops(d.crops || [])).catch(() => {}) }, [api])

  // init map once
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !mapRef.current || mapObj.current) return
      LRef.current = L
      const map = L.map(mapRef.current, { scrollWheelZoom: false }).setView([22.5, 79], 5)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap', maxZoom: 18,
      }).addTo(map)
      layerRef.current = L.layerGroup().addTo(map)
      mapObj.current = map
      setTimeout(() => map.invalidateSize(), 200)
    })()
    return () => { cancelled = true }
  }, [])

  const load = useCallback(async (loc) => {
    const useLoc = loc || location
    if (!useLoc) return
    setLoading(true)
    const p = new URLSearchParams({ lat: useLoc.lat, lng: useLoc.lng, type, radius: String(radius) })
    if (crop !== 'all') p.set('crop', crop)
    try {
      const d = await api(`/nearby?${p}`, { auth: false })
      setResults(d.results || [])
      drawMarkers(useLoc, d.results || [])
    } finally { setLoading(false) }
  }, [api, location, type, radius, crop])

  const drawMarkers = (loc, items) => {
    const L = LRef.current, map = mapObj.current, layer = layerRef.current
    if (!L || !map || !layer) return
    layer.clearLayers()
    const you = L.divIcon({ className: '', html: `<div style="background:#111;color:#fff;border-radius:9999px;padding:4px 8px;font-size:11px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.3)">You</div>`, iconSize: [40, 20], iconAnchor: [20, 10] })
    L.marker([loc.lat, loc.lng], { icon: you }).addTo(layer)
    L.circle([loc.lat, loc.lng], { radius: radius * 1000, color: '#1d7a46', weight: 1, fillOpacity: 0.05 }).addTo(layer)
    const color = TYPES.find((x) => x.key === type)?.color || '#1d7a46'
    const pts = [[loc.lat, loc.lng]]
    items.forEach((r) => {
      if (r.lat == null || r.lng == null) return
      pts.push([r.lat, r.lng])
      const icon = L.divIcon({ className: '', html: `<div style="background:${color};width:16px;height:16px;border-radius:9999px;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] })
      const price = r.offeredPrice ? `${RUPEE}${r.offeredPrice}` : (r.costPerKm ? `${RUPEE}${r.costPerKm}/km` : '')
      L.marker([r.lat, r.lng], { icon }).addTo(layer).bindPopup(
        `<b>${r.name}</b><br/>${r.buyerType || r.vehicleType || r.type}<br/>${r.distance ?? '?'} km ${price ? '· ' + price : ''}${r.verified ? '<br/>✔ Verified' : ''}`
      )
    })
    try { map.fitBounds(pts, { padding: [40, 40], maxZoom: 9 }) } catch {}
  }

  useEffect(() => { if (location) load() }, [type, radius, crop])

  const detect = async () => { const loc = await requestLocation(); load(loc) }

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionTitle eyebrow="Location" title={t('nav_nearby')} sub="Discover verified buyers, farmers, markets and transport near you." />
        <Button onClick={detect}><Navigation className="h-4 w-4 mr-1" /> {t('use_location')}</Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {TYPES.map((ty) => (
          <button key={ty.key} onClick={() => setType(ty.key)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition ${type === ty.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/40'}`}>
            <ty.icon className="h-4 w-4" /> {ty.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid md:grid-cols-3 gap-4 items-center">
        <div className="space-y-2">
          <Label>Radius: <span className="text-primary font-semibold">{radius} km</span></Label>
          <Slider value={[radius]} onValueChange={([v]) => setRadius(v)} min={10} max={800} step={10} />
        </div>
        {(type === 'buyers' || type === 'farmers') && (
          <div className="space-y-1.5"><Label>Match crop</Label>
            <Select value={crop} onValueChange={setCrop}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="max-h-60"><SelectItem value="all">Any crop</SelectItem>{crops.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div ref={mapRef} className="h-[420px] w-full rounded-2xl border border-border bg-muted" />

        <div className="space-y-3 max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
          {loading && <Loading label="Finding nearby..." />}
          {!loading && !location && (
            <EmptyState icon={MapPin} title="Share your location" sub="We use your location to find nearby matches and calculate distance." action={<Button onClick={detect}><Navigation className="h-4 w-4 mr-1" /> {t('use_location')}</Button>} />
          )}
          {!loading && location && results.length === 0 && (
            <EmptyState icon={MapPin} title={`No ${type} within ${radius} km`} sub="Try expanding your search radius." action={<Button variant="outline" onClick={() => setRadius(Math.min(800, radius + 150))}>Expand search radius</Button>} />
          )}
          {!loading && results.map((r) => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4 flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">{(r.name || '?')[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{r.name}</p>
                    {r.verified && <VerifiedBadge show label="" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{r.buyerType || r.vehicleType || (r.type === 'market' ? `${r.district || ''} market` : r.type)} · {r.distance ?? '?'} km</p>
                  <div className="flex items-center gap-3 mt-1">
                    {r.rating > 0 && <Rating value={r.rating} />}
                    {r.offeredPrice && <span className="text-xs font-medium text-primary">{RUPEE}{r.offeredPrice}</span>}
                    {r.costPerKm && <span className="text-xs font-medium">{RUPEE}{r.costPerKm}/km</span>}
                    {r.cropMatch && <Badge className="bg-primary/10 text-primary border-0 text-[10px]">crop match</Badge>}
                  </div>
                </div>
                <div className="text-right">
                  {r.matchScore && <><p className="font-display text-lg font-extrabold text-primary">{r.matchScore}%</p><p className="text-[10px] text-muted-foreground">{t('match_score')}</p></>}
                  {r.phone && <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 text-xs text-primary mt-1"><Phone className="h-3 w-3" /> Call</a>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-3">Approximate locations shown for privacy. {t('sample_data')} used for demo buyers/markets.</p>
    </div>
  )
}
