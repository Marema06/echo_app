'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { EchoLogo } from '@/components/ui/echo-logo';
import { BarChart3, LogOut, Plus, CalendarDays, UserCircle, Sparkles, Zap } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { createClient } from '@/lib/supabase/client';
import { QuickCheckin } from '@/components/ui/quick-checkin';
import { BottomNav } from '@/components/layout/bottom-nav';

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showCheckin, setShowCheckin] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const navItems = [
    { href: '/dashboard', label: 'Mosaïque' },
    { href: '/constellation', label: 'Constellation', icon: Sparkles },
    { href: '/stats', label: 'Stats', icon: BarChart3 },
    { href: '/calendar', label: 'Calendrier', icon: CalendarDays },
    { href: '/profile', label: 'Profil', icon: UserCircle },
  ];

  return (
    <>
      <header className="sticky top-0 z-10 backdrop-blur-md bg-surface-glass border-b border-ink-900/[0.08]">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3.5 group">
            <EchoLogo size={32} />
            <h1 className="font-serif text-[28px] font-semibold leading-none group-hover:opacity-70 transition-opacity">ECHO.</h1>
            <span className="hidden sm:inline-flex bg-ink-900/[0.08] text-ink-500 px-3 py-1.5 rounded-full text-xs uppercase tracking-wider">
              Journal émotionnel
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            {/* Nav items: hidden on mobile, shown on sm+ */}
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`
                    hidden sm:flex border rounded-full px-4 py-2 text-sm transition-all
                    ${isActive
                      ? 'bg-ink-900 text-white border-ink-900 dark:bg-ink-50 dark:text-ink-900'
                      : 'bg-white/80 dark:bg-ink-800/80 text-ink-700 dark:text-ink-300 border-ink-900/[0.12] dark:border-ink-600/30 hover:bg-ink-900 hover:text-white hover:border-ink-900'
                    }
                    ${Icon ? 'w-10 h-10 items-center justify-center p-0' : ''}
                  `}
                >
                  {Icon ? <Icon className="w-[18px] h-[18px]" /> : item.label}
                </Link>
              );
            })}

            <button
              onClick={() => setShowCheckin(true)}
              title="Check-in rapide"
              className="w-10 h-10 flex items-center justify-center rounded-full border border-ink-900/[0.12] dark:border-ink-600/30
                         bg-white/80 dark:bg-ink-800/80 text-ink-700 dark:text-ink-300
                         hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600 dark:hover:bg-amber-900/20 dark:hover:text-amber-400
                         transition-all"
            >
              <Zap className="w-[18px] h-[18px]" />
            </button>

            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-ink-900 dark:bg-ink-50 text-white dark:text-ink-900
                         rounded-full py-2 px-4 text-sm font-medium
                         hover:-translate-y-0.5 transition-all shadow-pop"
            >
              <Plus className="w-[18px] h-[18px]" />
              <span className="hidden sm:inline">Nouvelle entrée</span>
            </Link>

            <ThemeToggle />

            <button
              onClick={handleSignOut}
              className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 transition-colors p-2"
              title="Se déconnecter"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </nav>
        </div>
      </header>

      {showCheckin && <QuickCheckin onClose={() => setShowCheckin(false)} />}
      <BottomNav />
    </>
  );
}
