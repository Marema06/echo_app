'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 flex items-center justify-center rounded-full
                 text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 transition-colors"
      title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
    >
      {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
    </button>
  );
}
