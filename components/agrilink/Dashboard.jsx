'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApp, RUPEE } from './store'
import { Loading, EmptyState, VerifiedBadge, Rating } from './ui-bits'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { TrendingUp, Package, Users, Bell, Sprout, Plus, IndianRupee, MapPin, Loader2, Trash2, ShoppingCart } from 'lucide-react'

const STATUS_COLORS = {
  pending: 'bg-accent/20 text-accent-foreground', accepted: 'bg-primary/15 text-primary',
  rejected: 'bg-destructive/10 text-destructive', countered: 'bg-blue-100 text-blue-700',
  completed: 'bg-primary text-primary-foreground', expired: 'bg-muted text-muted-foreground',
}

export default function Dashboard() {
  const { t, api, user, openAuth, setView, location, requestLocation, refreshNotifications, refreshUser } = useApp()
  const [listings, setListings] = useState([])
  const [offers, setOffers] = useState({ received: [], sent: [] })
  const [alerts, setAlerts] = useState([])
  const [priceCard, setPriceCard] = useState(null)
  const [nearbyCount, setNearbyCount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [alertOpen, setAlertOpen] = useState(false)

  const isFarmer = user?.role === 'farmer'
  const isBuyer = user?.role === 'buyer'

  const loadAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const jobs = [api('/offers').then((d) => setOffers(d)).catch(() => {}), api('/price-alerts').then((d) => setAlerts(d.alerts || [])).catch(() => {})]
      if (isFarmer) jobs.push(api('/listings/mine').then((d) => setListings(d.listings || [])).catch(() => {}))
      const myCrop = user.crops?.[0] || 'Tomato'
      jobs.push(api(`/market-prices?crop=${encodeURIComponent(myCrop)}`, { auth: false }).then((d) => {
        const rows = (d.prices || []).sort((a, b) => b.avgPrice - a.avgPrice)
        if (rows[0]) setPriceCard({ crop: myCrop, best: rows[0], low: rows[rows.length - 1] })
      }).catch(() => {}))
      await Promise.all(jobs)
    } finally { setLoading(false) }
  }, [user, api, isFarmer])

  useEffect(() => { loadAll() }, [loadAll])

  const loadNearby = async () => {
    let loc = location; if (!loc) loc = await requestLocation()
    if (!loc) return
    const type = isBuyer ? 'farmers' : 'buyers'
    try { const d = await api(`/nearby?lat=${loc.lat}&lng=${loc.lng}&type=${type}&radius=200`, { auth: false }); setNearbyCount(d.results?.length || 0) } catch {}
  }
  useEffect(() => { if (user) loadNearby() }, [user])

  const actOnOffer = async (offer, status, counterPrice) => {
    try {
      await api(`/offers/${offer.id}`, { method: 'PUT', body: { status, counterPrice } })
      toast.success(`Offer ${status}`)
      loadAll(); refreshNotifications(); refreshUser()
    } catch (err) { toast.error(err.message) }
  }

  if (!user) {
    return <div className="container py-20"><EmptyState title="Please log in" sub="Login to access your personalised dashboard." action={<Button onClick={() => openAuth('login')}>{t('login')}</Button>} /></div>
  }

  const pendingReceived = offers.received.filter((o) => o.status === 'pending').length

  const StatCard = ({ icon: Icon, label, value, sub, accent }) => (
    <Card className={accent ? 'border-primary/30 bg-primary/5' : ''}>
      <CardContent className="py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-display text-2xl font-extrabold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Icon className="h-5 w-5" /></div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold">{t('welcome_back')}, {user.name}!</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="capitalize">{user.role}</Badge>
            {user.verified ? <VerifiedBadge show /> : <span className="text-xs">Not verified yet</span>}
            <Rating value={user.rating} /> · {user.completedTx || 0} deals
          </p>
        </div>
        {isFarmer && <Button onClick={() => setView('marketplace')}><Plus className="h-4 w-4 mr-1" /> {t('create_listing')}</Button>}
        {isBuyer && <Button onClick={() => setView('marketplace')}><ShoppingCart className="h-4 w-4 mr-1" /> {t('view_marketplace')}</Button>}
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <StatCard accent icon={TrendingUp} label={`${t('today_price')} · ${priceCard?.crop || ''}`} value={priceCard ? `${RUPEE}${priceCard.best.avgPrice}` : '—'} sub={priceCard ? `Best: ${priceCard.best.market}` : ''} />
        {isFarmer && <StatCard icon={Package} label={t('my_listings')} value={listings.filter((l) => l.status === 'active').length} sub={`${listings.filter((l) => l.status === 'sold').length} sold`} />}
        <StatCard icon={Bell} label={isFarmer ? 'Pending offers' : 'Offers sent'} value={isFarmer ? pendingReceived : offers.sent.length} />
        <StatCard icon={Users} label={isBuyer ? 'Farmers nearby' : 'Buyers nearby'} value={nearbyCount ?? '—'} sub={nearbyCount == null ? 'tap to detect' : 'within 200 km'} />
      </div>

      {/* Market opportunity */}
      {priceCard && (
        <Card className="mt-4">
          <CardContent className="py-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-accent/20 text-accent-foreground flex items-center justify-center"><IndianRupee className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{t('market_opportunity')} · {priceCard.crop}</p>
                <p className="font-semibold">{priceCard.best.market} pays {RUPEE}{priceCard.best.avgPrice - priceCard.low.avgPrice} more than {priceCard.low.market}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setView('bestmarket')}>Open calculator</Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="offers" className="mt-8">
        <TabsList>
          <TabsTrigger value="offers">{t('offers')}</TabsTrigger>
          {isFarmer && <TabsTrigger value="listings">{t('my_listings')}</TabsTrigger>}
          <TabsTrigger value="alerts">Price Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="offers" className="mt-4">
          {loading ? <Loading /> : (
            <div className="space-y-6">
              {isFarmer && (
                <div>
                  <h3 className="font-semibold mb-2">Offers received</h3>
                  {offers.received.length === 0 ? <p className="text-sm text-muted-foreground">No offers yet. Publish listings to attract buyers.</p> : (
                    <div className="space-y-3">{offers.received.map((o) => (
                      <OfferRow key={o.id} o={o} role="farmer" onAct={actOnOffer} />
                    ))}</div>
                  )}
                </div>
              )}
              <div>
                <h3 className="font-semibold mb-2">{isFarmer ? 'Offers you sent' : 'My offers'}</h3>
                {offers.sent.length === 0 ? <p className="text-sm text-muted-foreground">You haven't made any offers yet. <button className="text-primary underline" onClick={() => setView('marketplace')}>Browse marketplace</button></p> : (
                  <div className="space-y-3">{offers.sent.map((o) => (
                    <OfferRow key={o.id} o={o} role="buyer" onAct={actOnOffer} />
                  ))}</div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {isFarmer && (
          <TabsContent value="listings" className="mt-4">
            {listings.length === 0 ? (
              <EmptyState icon={Sprout} title="No listings yet" sub="Create your first crop listing to start selling." action={<Button onClick={() => setView('marketplace')}><Plus className="h-4 w-4 mr-1" /> {t('create_listing')}</Button>} />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{listings.map((l) => (
                <Card key={l.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{l.crop}</p>
                      <Badge className={l.status === 'sold' ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary border-0'}>{l.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{l.quantity} {l.unit} · {RUPEE}{l.expectedPrice}/{l.unit}</p>
                    <p className="text-xs text-muted-foreground mt-1">{l.quality} · {l.location?.label}</p>
                  </CardContent>
                </Card>
              ))}</div>
            )}
          </TabsContent>
        )}

        <TabsContent value="alerts" className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Your price alerts</h3>
            <Button size="sm" onClick={() => setAlertOpen(true)}><Plus className="h-4 w-4 mr-1" /> New alert</Button>
          </div>
          {alerts.length === 0 ? <p className="text-sm text-muted-foreground">No alerts. Get notified when prices hit your target.</p> : (
            <div className="space-y-2">{alerts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div className="flex items-center gap-3"><Bell className="h-4 w-4 text-primary" /><span className="text-sm">Notify when <b>{a.crop}</b> goes {a.direction} <b>{RUPEE}{a.targetPrice}</b> · {a.market}</span></div>
                <Button variant="ghost" size="icon" onClick={async () => { await api(`/price-alerts/${a.id}`, { method: 'DELETE' }); setAlerts((x) => x.filter((y) => y.id !== a.id)) }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}</div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialogForm open={alertOpen} onClose={() => setAlertOpen(false)} api={api} onCreated={(a) => setAlerts((x) => [a, ...x])} />
    </div>
  )
}

function OfferRow({ o, role, onAct }) {
  const [counter, setCounter] = useState('')
  const [showCounter, setShowCounter] = useState(false)
  const canAct = role === 'farmer' && (o.status === 'pending' || o.status === 'countered')
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">{o.crop} · {o.quantity} {o.unit}</p>
            <p className="text-sm text-muted-foreground">{role === 'farmer' ? `From ${o.buyerName}` : `To ${o.farmerName}`} · {RUPEE}{o.price}/{o.unit}</p>
            {o.message && <p className="text-xs text-muted-foreground mt-1 italic">“{o.message}”</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`border-0 capitalize ${STATUS_COLORS[o.status] || ''}`}>{o.status}</Badge>
          </div>
        </div>
        {canAct && (
          <div className="flex flex-wrap gap-2 mt-3">
            <Button size="sm" onClick={() => onAct(o, 'accepted')}>Accept</Button>
            <Button size="sm" variant="outline" onClick={() => onAct(o, 'rejected')}>Reject</Button>
            {!showCounter ? <Button size="sm" variant="ghost" onClick={() => setShowCounter(true)}>Counter</Button> : (
              <div className="flex items-center gap-2">
                <Input value={counter} onChange={(e) => setCounter(e.target.value)} type="number" placeholder="Price" className="h-9 w-28" />
                <Button size="sm" onClick={() => onAct(o, 'countered', Number(counter))} disabled={!counter}>Send</Button>
              </div>
            )}
          </div>
        )}
        {role === 'farmer' && o.status === 'accepted' && (
          <div className="mt-3"><Button size="sm" onClick={() => onAct(o, 'completed')}>Mark as completed</Button></div>
        )}
      </CardContent>
    </Card>
  )
}

function AlertDialogForm({ open, onClose, api, onCreated }) {
  const [loading, setLoading] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    const f = new FormData(e.target)
    try {
      const d = await api('/price-alerts', { method: 'POST', body: { crop: f.get('crop'), targetPrice: Number(f.get('targetPrice')), direction: f.get('direction'), market: f.get('market') } })
      toast.success('Price alert created')
      onCreated(d.alert); onClose()
    } catch (err) { toast.error(err.message) } finally { setLoading(false) }
  }
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Create price alert</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5"><Label>Crop</Label><Input name="crop" defaultValue="Tomato" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Direction</Label>
              <select name="direction" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="above">Above</option><option value="below">Below</option></select>
            </div>
            <div className="space-y-1.5"><Label>Target Price ({RUPEE})</Label><Input name="targetPrice" type="number" defaultValue={30} required /></div>
          </div>
          <div className="space-y-1.5"><Label>Market (optional)</Label><Input name="market" placeholder="Any" /></div>
          <DialogFooter><Button type="submit" className="w-full" disabled={loading}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Alert</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
