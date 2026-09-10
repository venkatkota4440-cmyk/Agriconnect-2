'use client'

import { AppProvider, useApp } from '@/components/agrilink/store'
import Navbar from '@/components/agrilink/Navbar'
import AuthDialog from '@/components/agrilink/AuthDialog'
import AiChat from '@/components/agrilink/AiChat'
import Landing from '@/components/agrilink/Landing'
import Prices from '@/components/agrilink/Prices'
import Marketplace from '@/components/agrilink/Marketplace'
import Nearby from '@/components/agrilink/Nearby'
import BestMarket from '@/components/agrilink/BestMarket'
import Demand from '@/components/agrilink/Demand'
import Insights from '@/components/agrilink/Insights'
import Dashboard from '@/components/agrilink/Dashboard'

function Shell() {
  const { view } = useApp()
  const views = {
    home: <Landing />,
    prices: <Prices />,
    marketplace: <Marketplace />,
    nearby: <Nearby />,
    bestmarket: <BestMarket />,
    demand: <Demand />,
    insights: <Insights />,
    dashboard: <Dashboard />,
    profile: <Dashboard />,
  }
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">{views[view] || <Landing />}</main>
      <AuthDialog />
      <AiChat />
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}

export default App
