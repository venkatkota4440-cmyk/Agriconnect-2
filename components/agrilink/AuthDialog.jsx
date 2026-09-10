'use client'

import { useState } from 'react'
import { useApp } from './store'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sprout, ShoppingCart, Truck, Loader2 } from 'lucide-react'

const ROLES = [
  { value: 'farmer', label: 'Farmer', icon: Sprout, desc: 'Sell your crops directly' },
  { value: 'buyer', label: 'Buyer', icon: ShoppingCart, desc: 'Source crops from farmers' },
  { value: 'transport', label: 'Transport', icon: Truck, desc: 'Offer transport services' },
]
const BUYER_TYPES = ['Retailer', 'Wholesaler', 'Trader', 'Food processing company', 'Restaurant', 'Exporter', 'Institutional buyer']

export default function AuthDialog() {
  const { authOpen, setAuthOpen, authMode, setAuthMode, login, register } = useApp()
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState('farmer')
  const [buyerType, setBuyerType] = useState('Retailer')

  const submitLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const f = new FormData(e.target)
    try { await login(f.get('email'), f.get('password')) }
    catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }
  const submitRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    const f = new FormData(e.target)
    try {
      await register({
        name: f.get('name'), email: f.get('email'), password: f.get('password'),
        phone: f.get('phone'), role, buyerType: role === 'buyer' ? buyerType : null,
      })
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  return (
    <Dialog open={authOpen} onOpenChange={setAuthOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Welcome to AgriLink 360</DialogTitle>
          <DialogDescription>Sell smarter and discover better prices.</DialogDescription>
        </DialogHeader>
        <Tabs value={authMode} onValueChange={setAuthMode}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={submitLogin} className="space-y-4 mt-2">
              <div className="space-y-1.5"><Label>Email</Label><Input name="email" type="email" required placeholder="you@example.com" /></div>
              <div className="space-y-1.5"><Label>Password</Label><Input name="password" type="password" required placeholder="••••••••" /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Login</Button>
              <p className="text-xs text-center text-muted-foreground">Try a sample buyer: freshmart.retail@sample.agrilink / sample123</p>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={submitRegister} className="space-y-4 mt-2">
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button type="button" key={r.value} onClick={() => setRole(r.value)}
                    className={`rounded-xl border p-3 text-center transition ${role === r.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/40'}`}>
                    <r.icon className={`h-5 w-5 mx-auto mb-1 ${role === r.value ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-semibold block">{r.label}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Name</Label><Input name="name" required placeholder="Full name" /></div>
                <div className="space-y-1.5"><Label>Phone</Label><Input name="phone" placeholder="+91..." /></div>
              </div>
              {role === 'buyer' && (
                <div className="space-y-1.5">
                  <Label>Buyer Type</Label>
                  <Select value={buyerType} onValueChange={setBuyerType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{BUYER_TYPES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5"><Label>Email</Label><Input name="email" type="email" required placeholder="you@example.com" /></div>
              <div className="space-y-1.5"><Label>Password</Label><Input name="password" type="password" required minLength={4} placeholder="Create a password" /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Account</Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
