'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApp, RUPEE } from './store'
import { SectionTitle, Loading, EmptyState, VerifiedBadge, Rating, Reveal } from './ui-bits'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { MapPin, Clock, Package, Plus, Search, Loader2, MessageCircle, Handshake, Sprout } from 'lucide-react'

function timeAgo(d) {
  const s = (Date.now() - new Date(d).getTime()) / 1000
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function Marketplace() {
  const { t, api, user, openAuth, location, requestLocation } = useApp()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [crops, setCrops] = useState([])
  const [crop, setCrop] = useState('all')
  const [maxPrice, setMaxPrice] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [useLoc, setUseLoc] = useState(false)
  const [offerFor, setOfferFor] = useState(null)
  const [contactFor, setContactFor] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => { api('/market-prices/meta', { auth: false }).then((d) => setCrops(d.crops || [])).catch(() => {}) }, [api])

  const load = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (crop !== 'all') p.set('crop', crop)
    if (maxPrice) p.set('maxPrice', maxPrice)
    if (verifiedOnly) p.set('verified', 'true')
    let loc = location
    if (useLoc) { if (!loc) loc = await requestLocation(); if (loc) { p.set('lat', loc.lat); p.set('lng', loc.lng) } }
    try { const d = await api(`/listings?${p}`, { auth: false }); setListings(d.listings || []) }
    finally { setLoading(false) }
  }, [api, crop, maxPrice, verifiedOnly, useLoc, location, requestLocation])

  useEffect(() => { load() }, [crop, verifiedOnly, useLoc])

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionTitle eyebrow="Marketplace" title={t('nav_marketplace')} sub="Buy directly from farmers. Fresh crops, fair prices." />
        {user?.role === 'farmer' && (
          <Button onClick={() => setCreateOpen(true)} className="shadow-sm"><Plus className="h-4 w-4 mr-1" /> {t('create_listing')}</Button>
        )}
      </div>

      {/* Filters */}
      <div className="mt-8 grid gap-3 md:grid-cols-5 items-end">
        <Select value={crop} onValueChange={setCrop}>
          <SelectTrigger><SelectValue placeholder="Crop" /></SelectTrigger>
          <SelectContent className="max-h-72"><SelectItem value="all">{t('all')} {t('crop')}</SelectItem>{crops.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder={`Max ${t('price')}`} className="pl-9" type="number" /></div>
        <div className="flex items-center gap-2"><Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} id="vo" /><Label htmlFor="vo">Verified only</Label></div>
        <div className="flex items-center gap-2"><Switch checked={useLoc} onCheckedChange={setUseLoc} id="ul" /><Label htmlFor="ul">Sort by distance</Label></div>
        <Button variant="outline" onClick={load}>{t('search')}</Button>
      </div>

      {loading ? <Loading /> : listings.length === 0 ? (
        <EmptyState title="No active crop listings" sub="Try changing filters or check back soon." action={user?.role === 'farmer' && <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1" /> {t('create_listing')}</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {listings.map((l, i) => (
            <Reveal key={l.id} i={i % 6}>
              <Card className="overflow-hidden hover:shadow-xl transition-shadow h-full flex flex-col">
                <div className="relative h-44">
                  <img src={l.images?.[0] || 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2'} alt={l.crop} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-card/90 text-foreground border-0">{l.quality}</Badge>
                    {l.sample && <Badge className="bg-accent/90 text-accent-foreground border-0">Sample</Badge>}
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-white font-display font-bold text-lg">{l.crop}</p>
                  </div>
                </div>
                <CardContent className="pt-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-2xl font-extrabold text-primary">{RUPEE}{l.expectedPrice}<span className="text-sm font-normal text-muted-foreground">/{l.unit}</span></p>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground"><Package className="h-4 w-4" /> {l.quantity} {l.unit}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">{l.farmerName?.[0]}</div>
                    <div className="leading-tight">
                      <p className="text-sm font-medium flex items-center gap-1">{l.farmerName} {l.farmerVerified && <VerifiedBadge show label="" />}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {l.location?.label || 'Unknown'} {l.distance != null && `· ${l.distance} km`}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <Rating value={l.farmerRating} />
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {timeAgo(l.createdAt)}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 mt-auto pt-4">
                    <Button variant="outline" size="sm" onClick={() => user ? setContactFor(l) : openAuth('login')}><MessageCircle className="h-4 w-4 mr-1" /> {t('contact')}</Button>
                    <Button size="sm" onClick={() => user ? setOfferFor(l) : openAuth('login')}><Handshake className="h-4 w-4 mr-1" /> {t('make_offer')}</Button>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      )}

      <MakeOfferDialog listing={offerFor} onClose={() => setOfferFor(null)} api={api} user={user} />
      <ContactDialog listing={contactFor} onClose={() => setContactFor(null)} api={api} />
      <CreateListingDialog open={createOpen} onClose={() => setCreateOpen(false)} api={api} crops={crops} onCreated={load} location={location} requestLocation={requestLocation} />
    </div>
  )
}

function MakeOfferDialog({ listing, onClose, api }) {
  const [loading, setLoading] = useState(false)
  if (!listing) return null
  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    const f = new FormData(e.target)
    try {
      await api('/offers', { method: 'POST', body: { listingId: listing.id, quantity: Number(f.get('quantity')), price: Number(f.get('price')), message: f.get('message'), delivery: f.get('delivery') } })
      toast.success('Offer sent successfully')
      onClose()
    } catch (err) { toast.error(err.message) } finally { setLoading(false) }
  }
  return (
    <Dialog open={!!listing} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Make an offer</DialogTitle><DialogDescription>{listing.crop} · Expected {RUPEE}{listing.expectedPrice}/{listing.unit} · Min {RUPEE}{listing.minPrice}</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Quantity ({listing.unit})</Label><Input name="quantity" type="number" defaultValue={listing.quantity} required /></div>
            <div className="space-y-1.5"><Label>{t_offer('Offer Price')} ({RUPEE}/{listing.unit})</Label><Input name="price" type="number" defaultValue={listing.expectedPrice} required /></div>
          </div>
          <div className="space-y-1.5"><Label>Delivery</Label>
            <select name="delivery" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"><option>Pickup</option><option>Farmer delivers</option><option>Shared transport</option></select>
          </div>
          <div className="space-y-1.5"><Label>Message</Label><Textarea name="message" placeholder="Add a note for the farmer..." /></div>
          <DialogFooter><Button type="submit" className="w-full" disabled={loading}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Send Offer</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
function t_offer(x){return x}

function ContactDialog({ listing, onClose, api }) {
  const [loading, setLoading] = useState(false)
  if (!listing) return null
  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    const f = new FormData(e.target)
    try {
      await api('/messages', { method: 'POST', body: { to: listing.farmerId, text: f.get('text'), listingId: listing.id } })
      toast.success('Message sent to ' + listing.farmerName)
      onClose()
    } catch (err) { toast.error(err.message) } finally { setLoading(false) }
  }
  return (
    <Dialog open={!!listing} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Contact {listing.farmerName}</DialogTitle><DialogDescription>About: {listing.crop} · {listing.quantity} {listing.unit}</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Textarea name="text" placeholder="Hi, I'm interested in your crop..." required />
          <DialogFooter><Button type="submit" className="w-full" disabled={loading}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Send Message</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CreateListingDialog({ open, onClose, api, crops, onCreated, location, requestLocation }) {
  const [loading, setLoading] = useState(false)
  const [crop, setCrop] = useState('Tomato')
  const [quality, setQuality] = useState('Grade A')
  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    const f = new FormData(e.target)
    let loc = location; if (!loc) loc = await requestLocation()
    try {
      await api('/listings', { method: 'POST', body: {
        crop, quality, quantity: Number(f.get('quantity')), unit: f.get('unit'),
        expectedPrice: Number(f.get('expectedPrice')), minPrice: Number(f.get('minPrice')),
        harvestDate: f.get('harvestDate'), description: f.get('description'),
        images: f.get('image') ? [f.get('image')] : [], location: loc,
      } })
      toast.success('Listing published successfully')
      onClose(); onCreated()
    } catch (err) { toast.error(err.message) } finally { setLoading(false) }
  }
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Crop Listing</DialogTitle><DialogDescription>List your harvest for buyers to discover.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Crop</Label>
              <Select value={crop} onValueChange={setCrop}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="max-h-60">{crops.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label>Quality</Label>
              <Select value={quality} onValueChange={setQuality}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Premium">Premium</SelectItem><SelectItem value="Grade A">Grade A</SelectItem><SelectItem value="Grade B">Grade B</SelectItem></SelectContent></Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Quantity</Label><Input name="quantity" type="number" required defaultValue={100} /></div>
            <div className="space-y-1.5"><Label>Unit</Label>
              <select name="unit" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"><option>kg</option><option>quintal</option><option>dozen</option><option>ton</option></select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Expected Price ({RUPEE})</Label><Input name="expectedPrice" type="number" required defaultValue={25} /></div>
            <div className="space-y-1.5"><Label>Min Price ({RUPEE})</Label><Input name="minPrice" type="number" required defaultValue={22} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Harvest Date</Label><Input name="harvestDate" type="date" /></div>
            <div className="space-y-1.5"><Label>Image URL (optional)</Label><Input name="image" placeholder="https://..." /></div>
          </div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea name="description" placeholder="Describe your crop, freshness, pickup details..." /></div>
          <DialogFooter><Button type="submit" className="w-full" disabled={loading}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Publish Listing</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
