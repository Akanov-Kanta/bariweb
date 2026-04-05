'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Auth } from '@/lib/api/sdk.gen';
import { client } from '@/lib/api/client.gen';

client.setConfig({ credentials: 'include' });

import {
  LayoutDashboard,
  Code,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  User,
  Globe,
  Brain
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
    { name: '🧠 Training', href: '/dashboard/training', icon: Brain },
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
    <div className="flex min-h-screen bg-[#05050a] text-zinc-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 border-r border-[#1f1f23] bg-[#0a0a0f] flex flex-col dashboard-sidebar">
        <div className="flex h-20 items-center px-6 border-b border-[#1f1f23]">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? 'bg-lime-400/10 text-lime-400 shadow-[inset_0_0_12px_rgba(200,255,0,0.05)] border border-lime-400/20'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white',
                  'group flex items-center px-4 py-3 sm:text-sm font-bold rounded-xl transition-all duration-300'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-lime-400' : 'text-zinc-500 group-hover:text-zinc-300',
                    'flex-shrink-0 mr-3 h-5 w-5'
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Language Switcher in Sidebar */}
        <div className="border-t border-[#1f1f23] p-6 bg-black/20">
          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-4 ml-1">
            <Globe className="h-3 w-3" />
            <span>{translations[lang].dashboard.sidebar.overview.includes('Обзор') ? 'ЯЗЫК' : 'LANGUAGE'}</span>
          </div>
          <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-[#1f1f23]">
            {(['ru', 'kz', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "flex-1 py-1.5 rounded-md text-[10px] font-black uppercase transition-all",
                  lang === l 
                    ? "bg-lime-400 text-black shadow-[0_0_15px_rgba(200,255,0,0.3)]" 
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="border-t border-[#1f1f23] p-6">
          <div className="flex items-center group mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-[#1f1f23] flex-shrink-0 shadow-xl group-hover:border-lime-400/30 transition-colors">
              <User className="h-5 w-5 text-zinc-500 group-hover:text-lime-400 transition-colors" />
            </div>
            <div className="ml-3 flex-1 overflow-hidden">
              <p className="text-sm font-bold text-zinc-100 truncate">{t.clientName}</p>
              <p className="text-[10px] text-zinc-500 truncate uppercase tracking-widest font-black text-lime-400/70">{t.planType}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center px-4 py-3 text-xs font-bold text-zinc-400 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all border border-[#1f1f23] hover:border-red-500/30 uppercase tracking-widest"
          >
            <LogOut className="mr-3 h-4 w-4" />
            {isLoggingOut ? t.loggingOut : t.signout}
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#05050a] relative overflow-y-auto">
        {/* Subtle background glow to match landing */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-lime-400/5 blur-[120px] pointer-events-none" />
        
        <div className="flex-1 p-8 md:p-12 z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
