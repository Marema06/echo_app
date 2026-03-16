'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, CalendarDays, UserCircle, Sparkles, LayoutGrid } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard',      icon: LayoutGrid,   label: 'Mosaïque' },
  { href: '/constellation',  icon: Sparkles,     label: 'Constell.' },
  { href: '/stats',          icon: BarChart3,    label: 'Stats' },
  { href: '/calendar',       icon: CalendarDays, label: 'Calendrier' },
  { href: '/profile',        icon: UserCircle,   label: 'Profil' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-20
                 bg-surface-glass/95 backdrop-blur-md border-t border-ink-900/[0.08]
                 flex items-center"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors ${
              isActive
                ? 'text-ink-900 dark:text-ink-50'
                : 'text-ink-400 dark:text-ink-500'
            }`}
          >
            <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
