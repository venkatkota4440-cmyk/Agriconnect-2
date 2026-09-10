'use client'

import { useEffect, useState } from 'react'
import { useApp, RUPEE } from './store'
import { SectionTitle, Loading, Reveal, DEMAND_COLORS } from './ui-bits'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Flame } from 'lucide-react'

const TrendIcon = ({ trend }) => {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-primary" />
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-destructive" />
  return <Minus className="h-4 w-4 text-muted-foreground" />
}

export default function Demand() {
  const { t, api } = useApp()
  const [demand, setDemand] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api('/demand', { auth: false }).then((d) => setDemand(d.demand || [])).finally(() => setLoading(false)) }, [api])

  if (loading) return <div className="container py-10"><Loading /></div>

  const chartData = demand.map((d) => ({ crop: d.crop, qty: d.requirementQty, level: d.level }))

  return (
    <div className="container py-10">
      <SectionTitle eyebrow="Demand · Sample data" title={t('demand_title')} sub={t('demand_sub')} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {demand.map((d, i) => (
          <Reveal key={d.crop} i={i}>
            <Card className="hover:shadow-lg transition-shadow h-full">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-bold text-lg">{d.crop}</h3>
                    <Badge className={`mt-1 border-0 ${DEMAND_COLORS[d.level]}`}>{d.level === 'High' && <Flame className="h-3 w-3 mr-1" />}{t(d.level.toLowerCase())} demand</Badge>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-medium"><TrendIcon trend={d.trend} /> {d.trend}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/60 p-3">
                    <p className="text-xs text-muted-foreground">Requirement</p>
                    <p className="font-bold">{d.requirementQty.toLocaleString('en-IN')} kg</p>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-3">
                    <p className="text-xs text-muted-foreground">Avg offered</p>
                    <p className="font-bold text-primary">{RUPEE}{d.avgOfferedPrice}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader><CardTitle className="text-base">Buyer requirement by crop (kg)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(140 18% 90%)" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="crop" tick={{ fontSize: 11 }} width={110} />
              <Tooltip />
              <Bar dataKey="qty" radius={[0, 6, 6, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.level === 'High' ? 'hsl(146 63% 32%)' : entry.level === 'Medium' ? 'hsl(43 92% 52%)' : 'hsl(140 15% 70%)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
