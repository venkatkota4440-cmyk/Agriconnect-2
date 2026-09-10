import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import { getDb } from '@/lib/mongodb'
import { llmChat, MODELS, AGRI_SYSTEM } from '@/lib/llm'
import { CROPS, MARKETS, DEMAND, SAMPLE_USERS, SAMPLE_TRANSPORT } from '@/lib/seedData'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ---------- helpers ----------
function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return res
}
function json(data, status = 200) {
  return cors(NextResponse.json(data, { status }))
}
export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 200 }))
}

function hashPw(pw) {
  return crypto.createHash('sha256').update(String(pw) + '::agrilink-salt').digest('hex')
}
function clean(doc) {
  if (!doc) return doc
  const { _id, passwordHash, ...rest } = doc
  return rest
}
function haversine(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => v === undefined || v === null || isNaN(v))) return null
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
}

async function getUser(request, db) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) return null
  const session = await db.collection('sessions').findOne({ token })
  if (!session) return null
  return db.collection('users').findOne({ id: session.userId })
}

async function notify(db, userId, type, title, body, meta = {}) {
  if (!userId) return
  await db.collection('notifications').insertOne({
    id: uuidv4(), userId, type, title, body, meta, read: false, createdAt: new Date(),
  })
}

// ---------- seeding ----------
async function seedIfEmpty(db) {
  const already = await db.collection('meta').findOne({ id: 'seed' })
  if (already) return

  const prices = []
  for (const m of MARKETS) {
    const cropsForMarket = CROPS.filter((_, i) => (i + m.name.length) % 2 === 0 || i < 6)
    for (const c of cropsForMarket) {
      const variance = 0.85 + Math.random() * 0.4
      const avg = Math.round(c.base * variance)
      const min = Math.round(avg * (0.88 + Math.random() * 0.05))
      const max = Math.round(avg * (1.06 + Math.random() * 0.08))
      const history = []
      let p = avg
      for (let d = 29; d >= 0; d--) {
        const day = new Date()
        day.setDate(day.getDate() - d)
        p = Math.max(Math.round(p * (0.97 + Math.random() * 0.06)), Math.round(c.base * 0.7))
        history.push({ date: day.toISOString().slice(0, 10), price: p })
      }
      history[history.length - 1].price = avg
      prices.push({
        id: uuidv4(), crop: c.name, category: c.category, unit: c.unit,
        market: m.name, state: m.state, district: m.district, lat: m.lat, lng: m.lng,
        minPrice: min, avgPrice: avg, maxPrice: max, history,
        updatedAt: new Date(),
      })
    }
  }
  await db.collection('market_prices').insertMany(prices)

  await db.collection('markets').insertMany(MARKETS.map((m) => ({ id: uuidv4(), ...m })))
  await db.collection('demand').insertMany(DEMAND.map((d) => ({ id: uuidv4(), ...d, updatedAt: new Date() })))

  const users = SAMPLE_USERS.map((u) => ({
    id: uuidv4(),
    name: u.name,
    email: `${u.name.toLowerCase().replace(/[^a-z]+/g, '.')}@sample.agrilink`,
    passwordHash: hashPw('sample123'),
    role: u.role,
    buyerType: u.buyerType || null,
    crops: u.crops || [],
    phone: u.phone,
    location: { lat: u.lat, lng: u.lng, label: u.label },
    verified: !!u.verified,
    rating: u.rating || 4.2,
    completedTx: Math.floor(Math.random() * 120) + 5,
    offeredPrice: u.offeredPrice || null,
    sample: true,
    createdAt: new Date(),
  }))
  await db.collection('users').insertMany(users)

  await db.collection('transport').insertMany(
    SAMPLE_TRANSPORT.map((t) => ({
      id: uuidv4(), name: t.name, vehicleType: t.vehicleType, availability: t.availability,
      costPerKm: t.costPerKm, rating: t.rating, phone: t.phone,
      location: { lat: t.lat, lng: t.lng, label: t.label }, sample: true, createdAt: new Date(),
    }))
  )

  const farmers = users.filter((u) => u.role === 'farmer')
  const sampleListings = [
    { crop: 'Tomato', category: 'Vegetable', unit: 'kg', quantity: 800, expectedPrice: 28, minPrice: 24, quality: 'Grade A', img: 'https://images.unsplash.com/photo-1485637701894-09ad422f6de6' },
    { crop: 'Turmeric', category: 'Spice', unit: 'quintal', quantity: 12, expectedPrice: 14000, minPrice: 13200, quality: 'Premium', img: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2' },
    { crop: 'Wheat', category: 'Grain', unit: 'quintal', quantity: 60, expectedPrice: 2500, minPrice: 2380, quality: 'Grade A', img: 'https://images.unsplash.com/photo-1594760910270-8720de623883' },
    { crop: 'Onion', category: 'Vegetable', unit: 'kg', quantity: 1500, expectedPrice: 24, minPrice: 20, quality: 'Grade B', img: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2' },
    { crop: 'Green Chilli', category: 'Vegetable', unit: 'kg', quantity: 300, expectedPrice: 45, minPrice: 40, quality: 'Grade A', img: 'https://images.unsplash.com/photo-1551649001-7a2482d98d05' },
    { crop: 'Mango', category: 'Fruit', unit: 'kg', quantity: 500, expectedPrice: 62, minPrice: 55, quality: 'Premium', img: 'https://images.unsplash.com/photo-1551649001-7a2482d98d05' },
  ]
  const listings = sampleListings.map((s, i) => {
    const f = farmers[i % farmers.length]
    return {
      id: uuidv4(),
      farmerId: f.id, farmerName: f.name,
      farmerVerified: f.verified, farmerRating: f.rating,
      crop: s.crop, category: s.category, quantity: s.quantity, unit: s.unit,
      expectedPrice: s.expectedPrice, minPrice: s.minPrice,
      harvestDate: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
      availabilityDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
      quality: s.quality,
      location: f.location,
      description: `Fresh ${s.crop} available directly from farm. ${s.quality} quality, ready for pickup.`,
      images: [s.img],
      status: 'active',
      sample: true,
      createdAt: new Date(Date.now() - i * 3600000),
    }
  })
  await db.collection('crop_listings').insertMany(listings)

  await db.collection('meta').insertOne({ id: 'seed', seededAt: new Date() })
}

// ---------- main handler ----------
async function handle(request, { params }) {
  const { path = [] } = await params
  const seg = Array.isArray(path) ? path : [path]
  const route = '/' + seg.join('/')
  const method = request.method
  const url = new URL(request.url)
  const q = url.searchParams

  try {
    const db = await getDb()

    if (route === '/seed') {
      await seedIfEmpty(db)
      return json({ ok: true })
    }
    await seedIfEmpty(db)

    if ((route === '/' || route === '/root') && method === 'GET') {
      return json({ message: 'AgriLink 360 API', ok: true })
    }

    // ---------------- AUTH ----------------
    if (route === '/auth/register' && method === 'POST') {
      const b = await request.json()
      if (!b.email || !b.password || !b.name || !b.role) {
        return json({ error: 'name, email, password and role are required' }, 400)
      }
      const existing = await db.collection('users').findOne({ email: b.email.toLowerCase() })
      if (existing) return json({ error: 'Email already registered' }, 409)
      const user = {
        id: uuidv4(),
        name: b.name,
        email: b.email.toLowerCase(),
        passwordHash: hashPw(b.password),
        role: b.role,
        buyerType: b.buyerType || null,
        phone: b.phone || '',
        crops: b.crops || [],
        farmSize: b.farmSize || null,
        experience: b.experience || null,
        location: b.location || null,
        verified: false,
        rating: 0,
        completedTx: 0,
        createdAt: new Date(),
      }
      await db.collection('users').insertOne(user)
      const token = uuidv4()
      await db.collection('sessions').insertOne({ token, userId: user.id, createdAt: new Date() })
      await notify(db, user.id, 'welcome', 'Welcome to AgriLink 360', 'Your account is ready. Complete your profile to get better matches.')
      return json({ token, user: clean(user) })
    }

    if (route === '/auth/login' && method === 'POST') {
      const b = await request.json()
      const user = await db.collection('users').findOne({ email: (b.email || '').toLowerCase() })
      if (!user || user.passwordHash !== hashPw(b.password)) {
        return json({ error: 'Invalid email or password' }, 401)
      }
      const token = uuidv4()
      await db.collection('sessions').insertOne({ token, userId: user.id, createdAt: new Date() })
      return json({ token, user: clean(user) })
    }

    if (route === '/auth/me' && method === 'GET') {
      const user = await getUser(request, db)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      return json({ user: clean(user) })
    }

    if (route === '/auth/logout' && method === 'POST') {
      const auth = request.headers.get('authorization') || ''
      const token = auth.replace('Bearer ', '').trim()
      if (token) await db.collection('sessions').deleteOne({ token })
      return json({ ok: true })
    }

    if (route === '/auth/profile' && method === 'PUT') {
      const user = await getUser(request, db)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const b = await request.json()
      const allowed = ['name', 'phone', 'crops', 'farmSize', 'experience', 'location', 'buyerType', 'avatar']
      const update = {}
      for (const k of allowed) if (b[k] !== undefined) update[k] = b[k]
      await db.collection('users').updateOne({ id: user.id }, { $set: update })
      const updated = await db.collection('users').findOne({ id: user.id })
      return json({ user: clean(updated) })
    }

    // ---------------- MARKET PRICES ----------------
    if (route === '/market-prices' && method === 'GET') {
      const filter = {}
      if (q.get('crop')) filter.crop = q.get('crop')
      if (q.get('category')) filter.category = q.get('category')
      if (q.get('state')) filter.state = q.get('state')
      if (q.get('market')) filter.market = q.get('market')
      let rows = await db.collection('market_prices').find(filter).limit(500).toArray()
      const min = q.get('minPrice'), max = q.get('maxPrice')
      if (min) rows = rows.filter((r) => r.avgPrice >= Number(min))
      if (max) rows = rows.filter((r) => r.avgPrice <= Number(max))
      rows = rows.map((r) => { const { history, ...rest } = clean(r); return rest })
      return json({ prices: rows })
    }

    if (route === '/market-prices/meta' && method === 'GET') {
      const crops = await db.collection('market_prices').distinct('crop')
      const states = await db.collection('market_prices').distinct('state')
      const markets = await db.collection('market_prices').distinct('market')
      const categories = await db.collection('market_prices').distinct('category')
      return json({ crops, states, markets, categories })
    }

    if (route === '/market-prices/trend' && method === 'GET') {
      const crop = q.get('crop')
      if (!crop) return json({ error: 'crop required' }, 400)
      const rows = await db.collection('market_prices').find({ crop }).toArray()
      if (!rows.length) return json({ crop, series: [], markets: [] })
      const days = rows[0].history.map((h) => h.date)
      const series = days.map((date, i) => {
        const point = { date }
        for (const r of rows.slice(0, 4)) point[r.market] = r.history[i]?.price
        const avg = Math.round(rows.reduce((s, r) => s + (r.history[i]?.price || 0), 0) / rows.length)
        point.Average = avg
        return point
      })
      const markets = rows.map((r) => ({ market: r.market, state: r.state, avgPrice: r.avgPrice, minPrice: r.minPrice, maxPrice: r.maxPrice }))
      const best = [...markets].sort((a, b) => b.avgPrice - a.avgPrice)[0]
      return json({ crop, series, markets, best })
    }

    if (route === '/best-market' && method === 'POST') {
      const b = await request.json()
      const { crop, quantity = 0, lat, lng, maxDistance = 200 } = b
      if (!crop) return json({ error: 'crop required' }, 400)
      const rows = await db.collection('market_prices').find({ crop }).toArray()
      const options = rows.map((r) => {
        const distance = (lat && lng) ? haversine(Number(lat), Number(lng), r.lat, r.lng) : null
        const perUnit = r.avgPrice
        const gross = Math.round(perUnit * Number(quantity || 0))
        const transport = distance ? Math.round(distance * 12 + (quantity > 1000 ? 800 : 300)) : 0
        const net = gross - transport
        return {
          market: r.market, state: r.state, district: r.district,
          price: perUnit, unit: r.unit, distance, gross, transport, net,
          lat: r.lat, lng: r.lng,
        }
      })
      let filtered = options
      if (lat && lng) filtered = options.filter((o) => o.distance === null || o.distance <= Number(maxDistance))
      const ranked = filtered.sort((a, b2) => b2.net - a.net)
      return json({ crop, quantity: Number(quantity || 0), options: ranked, best: ranked[0] || null })
    }

    // ---------------- DEMAND ----------------
    if (route === '/demand' && method === 'GET') {
      const rows = await db.collection('demand').find({}).toArray()
      return json({ demand: rows.map(clean) })
    }

    // ---------------- LISTINGS ----------------
    if (route === '/listings' && method === 'GET') {
      const filter = { status: q.get('status') || 'active' }
      if (q.get('crop')) filter.crop = q.get('crop')
      if (q.get('quality')) filter.quality = q.get('quality')
      if (q.get('verified') === 'true') filter.farmerVerified = true
      let rows = await db.collection('crop_listings').find(filter).sort({ createdAt: -1 }).limit(200).toArray()
      const maxP = q.get('maxPrice')
      if (maxP) rows = rows.filter((r) => r.expectedPrice <= Number(maxP))
      const lat = q.get('lat'), lng = q.get('lng')
      rows = rows.map((r) => {
        const c = clean(r)
        if (lat && lng && r.location) c.distance = haversine(Number(lat), Number(lng), r.location.lat, r.location.lng)
        return c
      })
      if (lat && lng) {
        const radius = q.get('radius')
        if (radius) rows = rows.filter((r) => r.distance === null || r.distance <= Number(radius))
        rows.sort((a, b) => (a.distance ?? 1e9) - (b.distance ?? 1e9))
      }
      return json({ listings: rows })
    }

    if (route === '/listings' && method === 'POST') {
      const user = await getUser(request, db)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const b = await request.json()
      if (!b.crop || !b.quantity || !b.expectedPrice) return json({ error: 'crop, quantity and expectedPrice required' }, 400)
      const listing = {
        id: uuidv4(),
        farmerId: user.id, farmerName: user.name,
        farmerVerified: user.verified, farmerRating: user.rating,
        crop: b.crop, category: b.category || 'Other',
        quantity: Number(b.quantity), unit: b.unit || 'kg',
        expectedPrice: Number(b.expectedPrice), minPrice: Number(b.minPrice || b.expectedPrice),
        harvestDate: b.harvestDate || null,
        availabilityDate: b.availabilityDate || null,
        quality: b.quality || 'Grade A',
        location: b.location || user.location || null,
        description: b.description || '',
        images: b.images || [],
        status: 'active',
        createdAt: new Date(),
      }
      await db.collection('crop_listings').insertOne(listing)
      return json({ listing: clean(listing) })
    }

    if (route === '/listings/mine' && method === 'GET') {
      const user = await getUser(request, db)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const rows = await db.collection('crop_listings').find({ farmerId: user.id }).sort({ createdAt: -1 }).toArray()
      return json({ listings: rows.map(clean) })
    }

    if (seg[0] === 'listings' && seg[1] && seg.length === 2 && method === 'GET') {
      const row = await db.collection('crop_listings').findOne({ id: seg[1] })
      if (!row) return json({ error: 'Not found' }, 404)
      return json({ listing: clean(row) })
    }

    if (seg[0] === 'listings' && seg[1] && method === 'DELETE') {
      const user = await getUser(request, db)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      await db.collection('crop_listings').deleteOne({ id: seg[1], farmerId: user.id })
      return json({ ok: true })
    }

    // ---------------- NEARBY ----------------
    if (route === '/nearby' && method === 'GET') {
      const lat = Number(q.get('lat')), lng = Number(q.get('lng'))
      const type = q.get('type') || 'buyers'
      const radius = Number(q.get('radius') || 100)
      const crop = q.get('crop')
      if (isNaN(lat) || isNaN(lng)) return json({ error: 'lat and lng required' }, 400)

      let results = []
      if (type === 'markets') {
        const rows = await db.collection('markets').find({}).toArray()
        results = rows.map((r) => ({ ...clean(r), type: 'market', distance: haversine(lat, lng, r.lat, r.lng) }))
      } else if (type === 'transport') {
        const rows = await db.collection('transport').find({}).toArray()
        results = rows.map((r) => ({ ...clean(r), type: 'transport', distance: haversine(lat, lng, r.location.lat, r.location.lng), lat: r.location.lat, lng: r.location.lng }))
      } else {
        const role = type === 'farmers' ? 'farmer' : 'buyer'
        const rows = await db.collection('users').find({ role, location: { $ne: null } }).toArray()
        results = rows.map((r) => {
          const distance = r.location ? haversine(lat, lng, r.location.lat, r.location.lng) : null
          const cropMatch = crop ? (r.crops || []).includes(crop) : false
          let score = 60
          if (distance != null) score += Math.max(0, 25 - distance / 4)
          if (cropMatch) score += 15
          if (r.verified) score += 8
          score += (r.rating || 0) * 2
          return {
            ...clean(r), type: role, distance, cropMatch,
            matchScore: Math.min(99, Math.round(score)),
            lat: r.location?.lat, lng: r.location?.lng,
          }
        })
      }
      results = results.filter((r) => r.distance == null || r.distance <= radius)
      results.sort((a, b) => {
        if (b.matchScore && a.matchScore && b.matchScore !== a.matchScore) return b.matchScore - a.matchScore
        return (a.distance ?? 1e9) - (b.distance ?? 1e9)
      })
      return json({ results })
    }

    // ---------------- TRANSPORT ----------------
    if (route === '/transport' && method === 'GET') {
      const rows = await db.collection('transport').find({}).toArray()
      const lat = q.get('lat'), lng = q.get('lng')
      const out = rows.map((r) => ({ ...clean(r), distance: (lat && lng) ? haversine(Number(lat), Number(lng), r.location.lat, r.location.lng) : null }))
      if (lat && lng) out.sort((a, b) => (a.distance ?? 1e9) - (b.distance ?? 1e9))
      return json({ transport: out })
    }
    if (route === '/transport' && method === 'POST') {
      const b = await request.json()
      const t = { id: uuidv4(), name: b.name, vehicleType: b.vehicleType, location: b.location || null, availability: b.availability || 'Available', costPerKm: Number(b.costPerKm || 30), rating: 0, phone: b.phone || '', createdAt: new Date() }
      await db.collection('transport').insertOne(t)
      return json({ transport: clean(t) })
    }

    // ---------------- OFFERS ----------------
    if (route === '/offers' && method === 'POST') {
      const user = await getUser(request, db)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const b = await request.json()
      const listing = await db.collection('crop_listings').findOne({ id: b.listingId })
      if (!listing) return json({ error: 'Listing not found' }, 404)
      const offer = {
        id: uuidv4(),
        listingId: listing.id, crop: listing.crop,
        buyerId: user.id, buyerName: user.name, buyerVerified: user.verified,
        farmerId: listing.farmerId, farmerName: listing.farmerName,
        quantity: Number(b.quantity || listing.quantity),
        price: Number(b.price),
        unit: listing.unit,
        message: b.message || '',
        delivery: b.delivery || 'Pickup',
        expiry: b.expiry || null,
        status: 'pending',
        history: [{ by: 'buyer', price: Number(b.price), at: new Date() }],
        createdAt: new Date(),
      }
      await db.collection('offers').insertOne(offer)
      await notify(db, listing.farmerId, 'offer', 'New Offer Received', `${user.name} offered Rs ${offer.price}/${listing.unit} for ${offer.quantity} ${listing.unit} of ${listing.crop}.`, { offerId: offer.id })
      return json({ offer: clean(offer) })
    }

    if (route === '/offers' && method === 'GET') {
      const user = await getUser(request, db)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const asFarmer = await db.collection('offers').find({ farmerId: user.id }).sort({ createdAt: -1 }).toArray()
      const asBuyer = await db.collection('offers').find({ buyerId: user.id }).sort({ createdAt: -1 }).toArray()
      return json({ received: asFarmer.map(clean), sent: asBuyer.map(clean) })
    }

    if (seg[0] === 'offers' && seg[1] && method === 'PUT') {
      const user = await getUser(request, db)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const b = await request.json()
      const offer = await db.collection('offers').findOne({ id: seg[1] })
      if (!offer) return json({ error: 'Not found' }, 404)
      const status = b.status
      const update = { status }
      let pushHist = null
      if (status === 'countered' && b.counterPrice) {
        update.price = Number(b.counterPrice)
        pushHist = { by: offer.farmerId === user.id ? 'farmer' : 'buyer', price: Number(b.counterPrice), at: new Date() }
      }
      const op = { $set: update }
      if (pushHist) op.$push = { history: pushHist }
      await db.collection('offers').updateOne({ id: offer.id }, op)

      const target = user.id === offer.farmerId ? offer.buyerId : offer.farmerId
      const titles = { accepted: 'Offer Accepted', rejected: 'Offer Rejected', countered: 'Counter Offer', completed: 'Transaction Completed' }
      await notify(db, target, 'offer', titles[status] || 'Offer Updated', `Your offer for ${offer.crop} was ${status}.`, { offerId: offer.id })

      if (status === 'completed') {
        await db.collection('transactions').insertOne({ id: uuidv4(), offerId: offer.id, crop: offer.crop, quantity: offer.quantity, price: offer.price, farmerId: offer.farmerId, buyerId: offer.buyerId, createdAt: new Date() })
        await db.collection('crop_listings').updateOne({ id: offer.listingId }, { $set: { status: 'sold' } })
        await db.collection('users').updateOne({ id: offer.farmerId }, { $inc: { completedTx: 1 } })
        await db.collection('users').updateOne({ id: offer.buyerId }, { $inc: { completedTx: 1 } })
      }
      const updated = await db.collection('offers').findOne({ id: offer.id })
      return json({ offer: clean(updated) })
    }

    // ---------------- NOTIFICATIONS ----------------
    if (route === '/notifications' && method === 'GET') {
      const user = await getUser(request, db)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const rows = await db.collection('notifications').find({ userId: user.id }).sort({ createdAt: -1 }).limit(50).toArray()
      return json({ notifications: rows.map(clean), unread: rows.filter((r) => !r.read).length })
    }
    if (route === '/notifications/read' && method === 'PUT') {
      const user = await getUser(request, db)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      await db.collection('notifications').updateMany({ userId: user.id }, { $set: { read: true } })
      return json({ ok: true })
    }

    // ---------------- PRICE ALERTS ----------------
    if (route === '/price-alerts' && method === 'GET') {
      const user = await getUser(request, db)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const rows = await db.collection('price_alerts').find({ userId: user.id }).sort({ createdAt: -1 }).toArray()
      return json({ alerts: rows.map(clean) })
    }
    if (route === '/price-alerts' && method === 'POST') {
      const user = await getUser(request, db)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const b = await request.json()
      const alert = { id: uuidv4(), userId: user.id, crop: b.crop, market: b.market || 'Any', targetPrice: Number(b.targetPrice), direction: b.direction || 'above', notify: b.notify || 'in-app', createdAt: new Date() }
      await db.collection('price_alerts').insertOne(alert)
      await notify(db, user.id, 'alert', 'Price Alert Created', `We will notify you when ${b.crop} goes ${alert.direction} Rs ${alert.targetPrice}.`)
      return json({ alert: clean(alert) })
    }
    if (seg[0] === 'price-alerts' && seg[1] && method === 'DELETE') {
      const user = await getUser(request, db)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      await db.collection('price_alerts').deleteOne({ id: seg[1], userId: user.id })
      return json({ ok: true })
    }

    // ---------------- MESSAGES ----------------
    if (route === '/messages' && method === 'POST') {
      const user = await getUser(request, db)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const b = await request.json()
      const other = b.to
      const convId = b.conversationId || ['c', ...[user.id, other].sort()].join('_')
      const msg = { id: uuidv4(), conversationId: convId, senderId: user.id, senderName: user.name, to: other, text: b.text, listingId: b.listingId || null, read: false, createdAt: new Date() }
      await db.collection('messages').insertOne(msg)
      await db.collection('conversations').updateOne(
        { id: convId },
        { $set: { id: convId, participants: [user.id, other], updatedAt: new Date(), lastMessage: b.text }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      )
      await notify(db, other, 'message', 'New Message', `${user.name}: ${String(b.text).slice(0, 60)}`, { conversationId: convId })
      return json({ message: clean(msg) })
    }
    if (route === '/messages' && method === 'GET') {
      const user = await getUser(request, db)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const convId = q.get('conversationId')
      const rows = await db.collection('messages').find({ conversationId: convId }).sort({ createdAt: 1 }).toArray()
      return json({ messages: rows.map(clean) })
    }
    if (route === '/conversations' && method === 'GET') {
      const user = await getUser(request, db)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const rows = await db.collection('conversations').find({ participants: user.id }).sort({ updatedAt: -1 }).toArray()
      return json({ conversations: rows.map(clean) })
    }

    // ---------------- RATINGS ----------------
    if (route === '/ratings' && method === 'POST') {
      const user = await getUser(request, db)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const b = await request.json()
      await db.collection('ratings').insertOne({ id: uuidv4(), fromId: user.id, toId: b.toId, stars: Number(b.stars), comment: b.comment || '', createdAt: new Date() })
      const all = await db.collection('ratings').find({ toId: b.toId }).toArray()
      const avg = Math.round((all.reduce((s, r) => s + r.stars, 0) / all.length) * 10) / 10
      await db.collection('users').updateOne({ id: b.toId }, { $set: { rating: avg } })
      return json({ ok: true, rating: avg })
    }

    // ---------------- ANALYTICS (admin) ----------------
    if (route === '/analytics' && method === 'GET') {
      const [farmers, buyers, listings, transactions, markets, alerts] = await Promise.all([
        db.collection('users').countDocuments({ role: 'farmer' }),
        db.collection('users').countDocuments({ role: 'buyer' }),
        db.collection('crop_listings').countDocuments({ status: 'active' }),
        db.collection('transactions').countDocuments({}),
        db.collection('markets').countDocuments({}),
        db.collection('price_alerts').countDocuments({}),
      ])
      const listingRows = await db.collection('crop_listings').find({}).toArray()
      const cropCount = {}
      for (const l of listingRows) cropCount[l.crop] = (cropCount[l.crop] || 0) + 1
      const topCrops = Object.entries(cropCount).map(([crop, count]) => ({ crop, count })).sort((a, b) => b.count - a.count).slice(0, 8)
      return json({ stats: { farmers, buyers, listings, transactions, markets, alerts }, topCrops })
    }

    if (route === '/admin/users' && method === 'GET') {
      const rows = await db.collection('users').find({}).sort({ createdAt: -1 }).limit(200).toArray()
      return json({ users: rows.map(clean) })
    }
    if (seg[0] === 'admin' && seg[1] === 'verify' && seg[2] && method === 'PUT') {
      await db.collection('users').updateOne({ id: seg[2] }, { $set: { verified: true } })
      await notify(db, seg[2], 'verification', 'You are Verified', 'Your account has been verified by AgriLink 360.')
      return json({ ok: true })
    }

    // ---------------- AI ----------------
    if (route === '/ai/chat' && method === 'POST') {
      const b = await request.json()
      const sessionId = b.sessionId || uuidv4()
      const language = b.language || 'English'
      const message = (b.message || '').trim()
      if (!message) return json({ error: 'message required' }, 400)

      const conv = await db.collection('ai_conversations').findOne({ sessionId })
      const history = (conv?.messages || []).slice(-20).map((m) => ({ role: m.role, content: m.content }))

      let context = ''
      const cropHit = CROPS.find((c) => message.toLowerCase().includes(c.name.toLowerCase().split(' ')[0].toLowerCase()))
      if (cropHit) {
        const rows = await db.collection('market_prices').find({ crop: cropHit.name }).limit(6).toArray()
        if (rows.length) {
          const snap = rows.map((r) => `${r.market} (${r.state}): avg Rs ${r.avgPrice}/${r.unit}`).join('; ')
          context = `\n[Sample market snapshot for ${cropHit.name}]: ${snap}. This is demo/sample data.`
        }
      }

      const messages = [
        { role: 'system', content: `${AGRI_SYSTEM}\nUser's preferred language: ${language}.${context}` },
        ...history,
        { role: 'user', content: message },
      ]
      let answer
      try {
        answer = await llmChat({ messages, model: MODELS.MODEL, maxTokens: 800 })
      } catch (e) {
        console.error('AI error', e)
        return json({ error: 'AI is busy right now. Please try again shortly.' }, 503)
      }
      await db.collection('ai_conversations').updateOne(
        { sessionId },
        {
          $set: { updatedAt: new Date(), language },
          $setOnInsert: { createdAt: new Date() },
          $push: { messages: { $each: [
            { role: 'user', content: message, at: new Date() },
            { role: 'assistant', content: answer, at: new Date() },
          ] } },
        },
        { upsert: true }
      )
      return json({ sessionId, answer })
    }

    if (route === '/translate-bulk' && method === 'POST') {
      const b = await request.json()
      const language = b.language || 'English'
      const strings = b.strings || {}
      if (language.toLowerCase() === 'english') return json({ translations: strings })
      const cacheId = `${language}`
      const cached = await db.collection('translations').findOne({ id: cacheId })
      if (cached && cached.count >= Object.keys(strings).length) {
        return json({ translations: cached.map, cached: true })
      }
      const prompt = `Translate the VALUES of this JSON object into ${language}. Keep the KEYS exactly the same. Preserve any placeholders like {name}, numbers, and units. Keep translations short and natural for a mobile app UI. Return ONLY valid minified JSON, no markdown.\n\n${JSON.stringify(strings)}`
      let out
      try {
        const raw = await llmChat({
          messages: [
            { role: 'system', content: 'You are a professional UI localization engine. Output only valid JSON.' },
            { role: 'user', content: prompt },
          ],
          model: MODELS.FAST_MODEL,
          maxTokens: 3000,
          temperature: 0.2,
        })
        const jsonStr = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
        out = JSON.parse(jsonStr)
      } catch (e) {
        console.error('translate-bulk error', e)
        return json({ translations: strings, error: 'translation-failed' })
      }
      await db.collection('translations').updateOne(
        { id: cacheId },
        { $set: { id: cacheId, language, map: out, count: Object.keys(out).length, updatedAt: new Date() } },
        { upsert: true }
      )
      return json({ translations: out })
    }

    if (route === '/translate' && method === 'POST') {
      const b = await request.json()
      if (!b.text || !b.targetLanguage) return json({ error: 'text and targetLanguage required' }, 400)
      try {
        const out = await llmChat({
          messages: [
            { role: 'system', content: 'Translate faithfully. Preserve placeholders, numbers, units and product names. Return only the translation.' },
            { role: 'user', content: `Target language: ${b.targetLanguage}\n\n${b.text}` },
          ],
          model: MODELS.FAST_MODEL, maxTokens: 1200, temperature: 0.2,
        })
        return json({ translation: out })
      } catch (e) {
        return json({ error: 'translation-failed' }, 503)
      }
    }

    return json({ error: `Route ${route} not found` }, 404)
  } catch (error) {
    console.error('API Error:', error)
    return json({ error: 'Internal server error', detail: String(error?.message || error) }, 500)
  }
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const DELETE = handle
export const PATCH = handle
