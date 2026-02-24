'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { EchoLogo } from '@/components/ui/echo-logo';
import { BarChart3, LogOut, Plus } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { createClient } from '@/lib/supabase/client';

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const navItems = [
    { href: '/dashboard', label: 'Mosaïque' },
    { href: '/stats', label: 'Stats', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-10 backdrop-blur-md bg-surface-glass border-b border-ink-900/[0.08]">
      <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3.5 group">
          <EchoLogo size={32} />
          <h1 className="font-serif text-[28px] font-semibold leading-none group-hover:opacity-70 transition-opacity">ECHO.</h1>
          <span className="hidden sm:inline-flex bg-ink-900/[0.08] text-ink-500 px-3 py-1.5 rounded-full text-xs uppercase tracking-wider">
            Journal émotionnel
          </span>
        </Link>

        <nav className="flex items-center gap-2.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  border rounded-full px-4 py-2 text-sm transition-all
                  ${isActive
                    ? 'bg-ink-900 text-white border-ink-900 dark:bg-ink-50 dark:text-ink-900'
                    : 'bg-white/80 dark:bg-ink-800/80 text-ink-700 dark:text-ink-300 border-ink-900/[0.12] dark:border-ink-600/30 hover:bg-ink-900 hover:text-white hover:border-ink-900'
                  }
                  ${Icon ? 'w-10 h-10 flex items-center justify-center p-0' : ''}
                `}
              >
                {Icon ? <Icon className="w-[18px] h-[18px]" /> : item.label}
              </Link>
            );
          })}

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
  );
}
