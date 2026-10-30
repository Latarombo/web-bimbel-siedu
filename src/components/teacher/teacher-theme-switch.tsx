'use client';

import { useSyncExternalStore } from 'react';
import { useLocale } from 'next-intl';
import { Sun, Moon } from 'lucide-react';

interface TeacherThemeSwitchProps {
  isCollapsed?: boolean;
  className?: string;
}

const subscribe = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  return () => observer.disconnect();
};

const getSnapshot = (): 'light' | 'dark' => {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

const getServerSnapshot = (): 'light' | 'dark' => 'light';

export function TeacherThemeSwitch({
  isCollapsed = false,
  className = '',
}: TeacherThemeSwitchProps) {
  const locale = useLocale();
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setAppTheme = (newTheme: 'light' | 'dark') => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      document.cookie = `siedu_theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
      localStorage.setItem('siedu_theme', newTheme);
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    setAppTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isLightActive = theme === 'light';
  const isDarkActive = theme === 'dark';

  const lightLabel = locale === 'en' ? 'Light' : 'Terang';
  const darkLabel = locale === 'en' ? 'Dark' : 'Gelap';

  // 1. Collapsed Mode: Single compact circular/rounded button
  if (isCollapsed) {
    return (
      <div className={`flex justify-center w-full ${className}`}>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDarkActive ? `Ganti ke mode ${lightLabel}` : `Ganti ke mode ${darkLabel}`}
          className="group relative flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
        >
          {isDarkActive ? (
            <Moon className="size-4 text-blue-400" />
          ) : (
            <Sun className="size-4 text-amber-500" />
          )}

          {/* Floating Tooltip */}
          <div className="pointer-events-none absolute left-full top-1/2 ml-3.5 -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-900 dark:text-white opacity-0 shadow-xl transition-all duration-150 group-hover:opacity-100 z-50">
            {isDarkActive ? `Mode: ${darkLabel}` : `Mode: ${lightLabel}`}
          </div>
        </button>
      </div>
    );
  }

  // 2. Expanded Mode: Segmented Pill (Medtbank style)
  return (
    <div
      className={`flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-800/80 p-1 text-xs font-semibold transition-colors ${className}`}
      role="group"
      aria-label="Pengaturan Tema"
    >
      <button
        type="button"
        onClick={() => setAppTheme('light')}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 px-2 transition-all cursor-pointer ${
          isLightActive
            ? 'bg-white text-slate-900 shadow-2xs font-bold'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        <Sun className={`size-3.5 ${isLightActive ? 'text-amber-500' : 'text-slate-400'}`} />
        <span>{lightLabel}</span>
      </button>

      <button
        type="button"
        onClick={() => setAppTheme('dark')}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 px-2 transition-all cursor-pointer ${
          isDarkActive
            ? 'bg-slate-700 text-white shadow-2xs font-bold'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        <Moon className={`size-3.5 ${isDarkActive ? 'text-blue-400' : 'text-slate-400'}`} />
        <span>{darkLabel}</span>
      </button>
    </div>
  );
}

export default TeacherThemeSwitch;
