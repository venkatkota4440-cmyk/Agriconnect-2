'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export const RUPEE = '₹'

export const LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Hindi', label: 'हिन्दी (Hindi)' },
  { code: 'Telugu', label: 'తెలుగు (Telugu)' },
  { code: 'Tamil', label: 'தமிழ் (Tamil)' },
  { code: 'Kannada', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'Marathi', label: 'मराठी (Marathi)' },
  { code: 'Bengali', label: 'বাংলা (Bengali)' },
  { code: 'Gujarati', label: 'ગુજરાતી (Gujarati)' },
  { code: 'Punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'Malayalam', label: 'മലയാളം (Malayalam)' },
  { code: 'Odia', label: 'ଓଡିଆ (Odia)' },
  { code: 'Urdu', label: 'Urdu' },
]

export const STRINGS = {
  brand: 'Kisanbazarr',
  brandSub: 'AgriLink 360',
  tagline: 'Connecting Farmers to Better Markets, Better Prices, and Better Opportunities.',
  nav_home: 'Home',
  nav_prices: 'Market Prices',
  nav_marketplace: 'Marketplace',
  nav_nearby: 'Nearby Buyers',
  nav_demand: 'Crop Demand',
  nav_insights: 'Market Insights',
  nav_how: 'How It Works',
  nav_dashboard: 'Dashboard',
  login: 'Login',
  register: 'Register',
  logout: 'Logout',
  hero_title: 'Sell Smarter. Discover Better Prices. Reach Better Markets.',
  hero_desc: 'AgriLink 360 connects farmers directly with verified buyers while providing real-time market prices, demand insights, and location-based opportunities.',
  cta_find: 'Find Better Markets',
  cta_explore: 'Explore Market Prices',
  stat_farmers: 'Farmers Connected',
  stat_buyers: 'Verified Buyers',
  stat_listings: 'Active Crop Listings',
  stat_markets: 'Markets Covered',
  stat_improve: 'Avg Price Improvement',
  features_title: 'Everything a farmer needs to sell better',
  features_sub: 'One platform for prices, buyers, demand and smart decisions.',
  f_prices: 'Live Market Prices',
  f_prices_d: 'Compare crop prices across markets and spot the best place to sell.',
  f_buyers: 'Nearby Verified Buyers',
  f_buyers_d: 'Discover trusted buyers near you, sorted by price and distance.',
  f_ai: 'Ask AgriLink AI',
  f_ai_d: 'Get instant, practical selling advice in your own language.',
  f_best: 'Where Should I Sell?',
  f_best_d: 'Estimate net revenue after transport and pick the best market.',
  how_title: 'How It Works',
  how_1: 'Create your free farmer or buyer account',
  how_2: 'List your crop or set your procurement needs',
  how_3: 'Discover prices, nearby buyers and demand',
  how_4: 'Negotiate, accept the best offer and sell direct',
  search: 'Search',
  crop: 'Crop',
  quantity: 'Quantity',
  price: 'Price',
  market: 'Market',
  distance: 'Distance',
  state: 'State',
  category: 'Category',
  min: 'Min',
  avg: 'Avg',
  max: 'Max',
  updated: 'Updated',
  all: 'All',
  contact: 'Contact',
  make_offer: 'Make Offer',
  verified: 'Verified',
  sample_data: 'Sample / demo data',
  best_market: 'Best Market to Sell',
  price_trend: 'Price Trend (30 days)',
  market_comparison: 'Market Comparison',
  loading: 'Loading...',
  create_listing: 'Create Listing',
  my_listings: 'My Listings',
  offers: 'Offers',
  notifications: 'Notifications',
  no_results: 'No results found',
  use_location: 'Use My Location',
  match_score: 'Match Score',
  where_sell_title: 'Where Should I Sell?',
  where_sell_desc: 'Enter your crop, quantity and travel limit to find the market with the best estimated net revenue.',
  gross_revenue: 'Gross Revenue',
  transport_est: 'Est. Transport',
  net_revenue: 'Est. Net Revenue',
  calculate: 'Calculate',
  demand_title: 'Crop Demand',
  demand_sub: 'See which crops buyers want most right now.',
  high: 'High', medium: 'Medium', low: 'Low',
  insights_title: 'Market Insights',
  ai_greeting: 'Namaste! I am AgriLink AI. Ask me about prices, buyers, or the best time to sell your crop.',
  ai_placeholder: 'Ask about crops, prices, buyers...',
  send: 'Send',
  accept: 'Accept', reject: 'Reject', counter: 'Counter',
  offer_price: 'Offer Price',
  message: 'Message',
  submit: 'Submit', cancel: 'Cancel', save: 'Save',
  welcome_back: 'Welcome back',
  good_to_see: 'Here is your farm at a glance',
  today_price: "Today's Market Price",
  market_opportunity: 'Market Opportunity',
  view_marketplace: 'View Marketplace',
  role_farmer: 'Farmer', role_buyer: 'Buyer', role_transport: 'Transport Provider',
}

const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

export const DEFAULT_LOCATION = { lat: 28.61, lng: 77.23, label: 'New Delhi (default)' }

export function AppProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [view, setView] = useState('home')
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [language, setLanguage] = useState('English')
  const [dict, setDict] = useState(STRINGS)
  const [translating, setTranslating] = useState(false)
  const [location, setLocation] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [booted, setBooted] = useState(false)

  const api = useCallback(async (path, { method = 'GET', body, auth = true } = {}) => {
    const headers = { 'Content-Type': 'application/json' }
    const tk = auth ? (token || (typeof window !== 'undefined' && localStorage.getItem('agri_token'))) : null
    if (tk) headers.Authorization = `Bearer ${tk}`
    const res = await fetch(`/api${path}`, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Request failed')
    return data
  }, [token])

  const t = useCallback((key) => dict[key] || STRINGS[key] || key, [dict])

  // boot: restore token + language
  useEffect(() => {
    const tk = localStorage.getItem('agri_token')
    const lang = localStorage.getItem('agri_lang')
    if (lang) setLanguage(lang)
    if (tk) {
      setToken(tk)
    } else {
      setBooted(true)
    }
    // trigger seed in background
    fetch('/api/seed', { method: 'POST' }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!token) return
    api('/auth/me').then((d) => setUser(d.user)).catch(() => {
      localStorage.removeItem('agri_token'); setToken(null); setUser(null)
    }).finally(() => setBooted(true))
  }, [token, api])

  // translation
  useEffect(() => {
    localStorage.setItem('agri_lang', language)
    if (language === 'English') { setDict(STRINGS); return }
    setTranslating(true)
    fetch('/api/translate-bulk', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strings: STRINGS, language }),
    })
      .then((r) => r.json())
      .then((d) => setDict({ ...STRINGS, ...(d.translations || {}) }))
      .catch(() => setDict(STRINGS))
      .finally(() => setTranslating(false))
  }, [language])

  const refreshNotifications = useCallback(async () => {
    if (!token) return
    try {
      const d = await api('/notifications')
      setNotifications(d.notifications || [])
      setUnread(d.unread || 0)
    } catch {}
  }, [token, api])

  useEffect(() => {
    if (!token) return
    refreshNotifications()
    const id = setInterval(refreshNotifications, 20000)
    return () => clearInterval(id)
  }, [token, refreshNotifications])

  const login = async (email, password) => {
    const d = await api('/auth/login', { method: 'POST', auth: false, body: { email, password } })
    localStorage.setItem('agri_token', d.token)
    setToken(d.token); setUser(d.user); setAuthOpen(false)
    toast.success(`Welcome back, ${d.user.name}!`)
    setView('dashboard')
    return d
  }
  const register = async (payload) => {
    const d = await api('/auth/register', { method: 'POST', auth: false, body: payload })
    localStorage.setItem('agri_token', d.token)
    setToken(d.token); setUser(d.user); setAuthOpen(false)
    toast.success('Account created! Welcome to AgriLink 360.')
    setView('dashboard')
    return d
  }
  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }) } catch {}
    localStorage.removeItem('agri_token')
    setToken(null); setUser(null); setView('home')
    toast('Logged out')
  }
  const refreshUser = async () => {
    try { const d = await api('/auth/me'); setUser(d.user) } catch {}
  }

  const requestLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocation(DEFAULT_LOCATION)
        toast.message('Using default location (New Delhi)')
        resolve(DEFAULT_LOCATION)
        return
      }
      toast.message('Detecting your location...')
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'Your location' }
          setLocation(loc)
          toast.success('Location detected')
          resolve(loc)
        },
        () => {
          setLocation(DEFAULT_LOCATION)
          toast.warning('Location permission denied. Using New Delhi as default.')
          resolve(DEFAULT_LOCATION)
        },
        { enableHighAccuracy: true, timeout: 8000 }
      )
    })
  }, [])

  const openAuth = (mode = 'login') => { setAuthMode(mode); setAuthOpen(true) }

  const value = {
    token, user, view, setView, authOpen, setAuthOpen, authMode, setAuthMode, openAuth,
    language, setLanguage, t, translating, LANGUAGES,
    location, setLocation, requestLocation,
    notifications, unread, refreshNotifications,
    api, login, register, logout, refreshUser, booted,
  }
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}
