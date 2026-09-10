'use client'

import { useEffect, useState } from 'react'
import { useApp, RUPEE } from './store'
import { SectionTitle, Loading } from './ui-bits'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar } from 'recharts'
import { TrendingUp, Award, Search } from 'lucide-react'

export default function Prices() {
  const { t, api, location } = useApp()
  const [meta, setMeta] = useState({ crops: [], states: [], markets: [] })
  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [crop, setCrop] = useState('Tomato')
  const [state, setState] = useState('all')
  const [search, setSearch] = useState('')
  const [trend, setTrend] = useState(null)

  useEffect(() => { api('/market-prices/meta', { auth: false }).then(setMeta).catch(() => {}) }, [api])

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (crop && crop !== 'all') params.set('crop', crop)
    if (state && state !== 'all') params.set('state', state)
    api(`/market-prices?${params}`, { auth: false })
      .then((d) => setPrices(d.prices || []))
      .finally(() => setLoading(false))
    if (crop && crop !== 'all') api(`/market-prices/trend?crop=${encodeURIComponent(crop)}`, { auth: false }).then(setTrend).catch(() => setTrend(null))
  }
  useEffect(() => { load() }, [crop, state])

  const filtered = prices.filter((p) => !search || p.crop.toLowerCase().includes(search.toLowerCase()) || p.market.toLowerCase().includes(search.toLowerCase()))
  const best = trend?.best

  return (
    <div className="container py-10">
      <SectionTitle eyebrow="Live · Sample data" title={t('nav_prices')} sub="Compare crop prices across markets and find the best place to sell." />

      <div className="mt-8 grid gap-3 md:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search crop or market" className="pl-9" />
        </div>
        <Select value={crop} onValueChange={setCrop}>
          <SelectTrigger><SelectValue placeholder="Crop" /></SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">{t('all')} {t('crop')}</SelectItem>
            {meta.crops.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={state} onValueChange={setState}>
          <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">{t('all')} {t('state')}</SelectItem>
            {meta.states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={load}>{t('search')}</Button>
      </div>

      {/* Best market highlight */}
      {best && (
        <Card className="mt-6 border-primary/30 bg-primary/5">
          <CardContent className="py-5 flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center"><Award className="h-6 w-6" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{t('best_market')} · {crop}</p>
                <p className="font-display text-xl font-extrabold">{best.market}, {best.state}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-extrabold text-primary">{RUPEE}{best.avgPrice}</p>
              <p className="text-xs text-muted-foreground">avg price</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* Table */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">{t('nav_prices')}</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? <Loading /> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('crop')}</TableHead>
                      <TableHead>{t('market')}</TableHead>
                      <TableHead className="text-right">{t('min')}</TableHead>
                      <TableHead className="text-right">{t('avg')}</TableHead>
                      <TableHead className="text-right">{t('max')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.slice(0, 60).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.crop}<span className="block text-xs text-muted-foreground">{p.category}</span></TableCell>
                        <TableCell>{p.market}<span className="block text-xs text-muted-foreground">{p.state}</span></TableCell>
                        <TableCell className="text-right text-muted-foreground">{RUPEE}{p.minPrice}</TableCell>
                        <TableCell className="text-right font-bold text-primary">{RUPEE}{p.avgPrice}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{RUPEE}{p.maxPrice}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trend chart */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> {t('price_trend')}</CardTitle></CardHeader>
          <CardContent>
            {trend?.series?.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(140 18% 90%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} interval={5} />
                  <YAxis tick={{ fontSize: 10 }} width={40} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Average" stroke="hsl(146 63% 32%)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <Loading label="Select a crop" />}
            <p className="text-[11px] text-muted-foreground mt-2 text-center">{t('sample_data')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Market comparison */}
      {trend?.markets?.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle className="text-base">{t('market_comparison')} · {crop}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={trend.markets}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(140 18% 90%)" />
                <XAxis dataKey="market" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="minPrice" name="Min" fill="hsl(96 45% 65%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgPrice" name="Avg" fill="hsl(146 63% 32%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="maxPrice" name="Max" fill="hsl(43 92% 52%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
