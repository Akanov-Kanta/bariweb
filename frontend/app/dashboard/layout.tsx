'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Auth } from '@/lib/api/sdk.gen';
import {
  LayoutDashboard,
  Code,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  User,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { translations } from '@/lib/i18n/translations';

import Logo from '@/components/ui/Logo';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { lang, setLang } = useLanguage();
  const t = translations[lang].dashboard.sidebar;

  const navigation = [
    { name: t.overview, href: '/dashboard', icon: LayoutDashboard },
    { name: t.integration, href: '/dashboard/integration', icon: Code },
    { name: t.reports, href: '/dashboard/reports', icon: FileText },
    { name: t.billing, href: '/payment', icon: CreditCard },
    { name: t.settings, href: '/dashboard/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await Auth.logout();
      router.push('/login');
    } catch (e) {
      console.error('Failed to log out', e);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 border-r dashboard-sidebar flex flex-col">
        <div className="flex h-16 items-center px-6 border-b border-zinc-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo />
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? 'nav-active-item'
                    : 'nav-hover-item text-zinc-400',
                  'group flex items-center px-3 py-2.5 sm:text-sm font-medium rounded-md transition-all'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-lime-400' : 'text-zinc-500 group-hover:text-zinc-300',
                    'flex-shrink-0 -ml-1 mr-3 h-5 w-5'
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Language Switcher in Sidebar */}
        <div className="border-t border-zinc-800 p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3 ml-1">
            <Globe className="h-3 w-3" />
            <span>Language</span>
          </div>
          <div className="flex gap-1">
            {(['ru', 'kz', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all border",
                  lang === l 
                    ? "bg-lime-400/10 border-lime-400/30 text-lime-400" 
                    : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="border-t border-zinc-800 p-4">
          <div className="flex items-center group">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 flex-shrink-0 shadow-lg">
              <User className="h-5 w-5 text-zinc-400" />
            </div>
            <div className="ml-3 flex-1 overflow-hidden">
              <p className="text-sm font-medium text-zinc-200 truncate">{t.clientName}</p>
              <p className="text-xs text-zinc-500 truncate uppercase tracking-widest font-bold">{t.planType}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="mt-4 flex w-full items-center px-3 py-2.5 text-sm font-medium text-red-400 rounded-md hover:bg-red-500/10 hover:text-red-300 transition-all border border-transparent hover:border-red-500/20"
          >
            <LogOut className="mr-3 h-5 w-5 text-red-500/70" />
            {isLoggingOut ? t.loggingOut : t.signout}
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-lime-900/10 via-zinc-950 to-zinc-950 overflow-y-auto">
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
