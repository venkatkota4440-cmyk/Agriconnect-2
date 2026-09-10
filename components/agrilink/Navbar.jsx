'use client'

import { useState } from 'react'
import { useApp } from './store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sprout, Menu, Bell, Globe, LogOut, LayoutDashboard, Languages, Loader2, User } from 'lucide-react'

const NAV = [
  ['home', 'nav_home'], ['prices', 'nav_prices'], ['marketplace', 'nav_marketplace'],
  ['nearby', 'nav_nearby'], ['demand', 'nav_demand'], ['insights', 'nav_insights'],
]

export default function Navbar() {
  const { t, view, setView, user, openAuth, logout, language, setLanguage, LANGUAGES, translating, notifications, unread, refreshNotifications, api } = useApp()
  const [open, setOpen] = useState(false)

  const go = (v) => { setView(v); setOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const markRead = async () => { try { await api('/notifications/read', { method: 'PUT' }); refreshNotifications() } catch {} }

  const NavLinks = ({ mobile }) => (
    <>
      {NAV.map(([v, key]) => (
        <button
          key={v}
          onClick={() => go(v)}
          className={`text-sm font-medium transition-colors ${mobile ? 'py-2 text-left w-full' : ''} ${view === v ? 'text-primary' : 'text-foreground/70 hover:text-primary'}`}
        >
          {t(key)}
        </button>
      ))}
    </>
  )

  const LangSelect = () => (
    <Select value={language} onValueChange={setLanguage}>
      <SelectTrigger className="h-9 w-[140px] gap-1 border-border bg-background/60">
        <Languages className="h-4 w-4 text-primary" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 glass">
      <div className="container flex h-16 items-center justify-between">
        <button onClick={() => go('home')} className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Sprout className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight text-left">
            <span className="font-display font-extrabold text-lg text-foreground block">{t('brand')}</span>
            <span className="text-[10px] font-semibold tracking-wide text-primary/80 uppercase">{t('brandSub')}</span>
          </div>
        </button>

        <nav className="hidden lg:flex items-center gap-6">
          <NavLinks />
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            {translating ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground w-[140px] justify-center h-9"><Loader2 className="h-4 w-4 animate-spin" /> Translating</div>
            ) : <LangSelect />}
          </div>

          {user ? (
            <>
              <Popover onOpenChange={(o) => o && markRead()}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unread > 0 && <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">{unread}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="px-4 py-3 border-b font-semibold text-sm">{t('notifications')}</div>
                  <ScrollArea className="h-80">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-4">No notifications yet.</p>
                    ) : notifications.map((n) => (
                      <div key={n.id} className="px-4 py-3 border-b last:border-0 hover:bg-muted/50">
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">{new Date(n.createdAt).toLocaleString('en-IN')}</p>
                      </div>
                    ))}
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      <span className="text-xs font-normal text-muted-foreground capitalize">{user.role} {user.verified && '• Verified'}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => go('dashboard')}><LayoutDashboard className="h-4 w-4 mr-2" /> {t('nav_dashboard')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => go('profile')}><User className="h-4 w-4 mr-2" /> Profile</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive"><LogOut className="h-4 w-4 mr-2" /> {t('logout')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" onClick={() => openAuth('login')}>{t('login')}</Button>
              <Button onClick={() => openAuth('register')} className="shadow-sm">{t('register')}</Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="font-display">{t('brand')}</SheetTitle>
              <div className="flex flex-col gap-1 mt-6">
                <NavLinks mobile />
                {user && <button onClick={() => go('dashboard')} className="py-2 text-left text-sm font-medium text-foreground/70">{t('nav_dashboard')}</button>}
              </div>
              <div className="mt-6"><LangSelect /></div>
              {!user && (
                <div className="flex flex-col gap-2 mt-6">
                  <Button variant="outline" onClick={() => { openAuth('login'); setOpen(false) }}>{t('login')}</Button>
                  <Button onClick={() => { openAuth('register'); setOpen(false) }}>{t('register')}</Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
