'use client'

import { useEffect, useState } from 'react'
import { useApp, RUPEE } from './store'
import { SectionTitle, Loading } from './ui-bits'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, AreaChart, Area, BarChart, Bar, Cell } from 'recharts'
import { LineChart as LineIcon, Activity, TrendingUp } from 'lucide-react'

const LINE_COLORS = ['hsl(146 63% 32%)', 'hsl(43 92% 52%)', 'hsl(168 55% 42%)', 'hsl(24 80% 55%)']
const RANGES = [7, 14, 30]

export default function Insights() {
  const { t, api } = useApp()
  const [crops, setCrops] = useState([])
  const [crop, setCrop] = useState('Tomato')
  const [range, setRange] = useState(30)
  const [trend, setTrend] = useState(null)
  const [demand, setDemand] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api('/market-prices/meta', { auth: false }).then((d) => setCrops(d.crops || [])).catch(() => {}) }, [api])
  useEffect(() => { api('/demand', { auth: false }).then((d) => setDemand(d.demand || [])).catch(() => {}) }, [api])
  useEffect(() => {
    setLoading(true)
    api(`/market-prices/trend?crop=${encodeURIComponent(crop)}`, { auth: false }).then(setTrend).finally(() => setLoading(false))
  }, [crop, api])

  const series = (trend?.series || []).slice(-range)
  const marketKeys = trend?.markets?.slice(0, 4).map((m) => m.market) || []
  const demandChart = demand.map((d) => ({ crop: d.crop, price: d.avgOfferedPrice, level: d.level }))

  return (
    <div className="container py-10">
      <SectionTitle eyebrow="Analytics · Sample data" title={t('insights_title')} sub="Track price trends, demand and market comparison to time your sale." />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Select value={crop} onValueChange={setCrop}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-72">{crops.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {RANGES.map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 text-sm rounded-md font-medium ${range === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{r}d</button>
          ))}
        </div>
      </div>

      {loading ? <Loading /> : (
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> {crop} price trend across markets ({range} days)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(140 18% 90%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} width={50} />
                  <Tooltip />
                  <Legend />
                  {marketKeys.map((m, i) => <Line key={m} type="monotone" dataKey={m} stroke={LINE_COLORS[i % 4]} strokeWidth={2} dot={false} />)}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Average price area ({crop})</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={series}>
                  <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(146 63% 32%)" stopOpacity={0.4} /><stop offset="95%" stopColor="hsl(146 63% 32%)" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(140 18% 90%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} width={50} />
                  <Tooltip />
                  <Area type="monotone" dataKey="Average" stroke="hsl(146 63% 32%)" fill="url(#g1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><LineIcon className="h-4 w-4 text-primary" /> Avg offered price by demand</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={demandChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(140 18% 90%)" />
                  <XAxis dataKey="crop" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} interval={0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                    {demandChart.map((e, i) => <Cell key={i} fill={e.level === 'High' ? 'hsl(146 63% 32%)' : e.level === 'Medium' ? 'hsl(43 92% 52%)' : 'hsl(140 15% 70%)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
