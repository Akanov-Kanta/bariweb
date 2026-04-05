'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Auth } from '@/lib/api/sdk.gen';
import { client } from '@/lib/api/client.gen';

client.setConfig({ credentials: 'include' });

import {
  SquaresFour,
  Code,
  FileText,
  Brain,
  CreditCard,
  Gear,
  SignOut,
  User,
  Globe,
  List,
  X
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const t = translations[lang].dashboard.sidebar;

  useEffect(() => {
    const status = localStorage.getItem('subscription_status');
    const plan = localStorage.getItem('subscription_plan');
    if (status !== 'active') {
      router.push('/payment');
    } else {
      // capitalize plan string
      setActivePlan(plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "Unknown Plan");
    }
  }, [router]);

  // Gate access until plan is read
  if (activePlan === null) {
    return <div className="h-screen w-screen bg-[#05050a] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-lime-400 border-t-transparent animate-spin"/></div>;
  }

  const navigation = [
    { name: t.overview, href: '/dashboard', icon: SquaresFour },
    { name: t.integration, href: '/dashboard/integration', icon: Code },

    { name: t.training, href: '/dashboard/training', icon: Brain },
    { name: t.billing, href: '/payment', icon: CreditCard },
    { name: t.settings, href: '/dashboard/settings', icon: Gear },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await Auth.logout();
      document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      router.push('/login');
    } catch (e) {
      console.error('Failed to log out', e);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#05050a] text-zinc-100 font-sans selection:bg-lime-400 selection:text-black relative">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0f] border-b border-[#1f1f23] flex items-center justify-between px-4 z-50">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo />
        </Link>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-zinc-400 hover:text-white transition-colors"
        >
          <List weight="thin" className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-[70] w-64 border-r border-[#1f1f23] bg-[#0a0a0f] flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 shrink-0 h-full",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Close Button (Mobile Only) */}
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors"
        >
          <X weight="thin" className="h-5 w-5" />
        </button>
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-lime-400/20 to-transparent" />
        
        <div className="flex h-20 items-center px-6 mb-2">
          <Link href="/dashboard" className="flex items-center gap-2 translate-y-[-1px]">
            <Logo />
          </Link>
        </div>

        <div className="px-5 mb-4">
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
              <div className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.overview.includes('Обзор') ? 'Активно' : 'LIVE'}</span>
           </div>
        </div>

        <nav className="flex-1 px-3 space-y-1.5">
           <p className="px-4 text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] mb-4 mt-6">Navigation</p>
          {navigation.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? 'bg-lime-400/5 text-lime-400 border border-lime-400/20 shadow-[0_0_20px_rgba(200,255,0,0.03)]'
                    : 'text-zinc-500 hover:bg-white/[0.03] hover:text-white border border-transparent',
                  'group flex items-center px-4 py-2.5 sm:text-[13px] font-bold rounded-xl transition-all duration-200'
                )}
              >
                <item.icon
                  weight={isActive ? "fill" : "thin"}
                  className={cn(
                    isActive ? 'text-lime-400' : 'text-zinc-500 group-hover:text-zinc-300',
                    'flex-shrink-0 mr-3 h-5 w-5 transition-colors'
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Group */}
        <div className="mt-auto space-y-6 pb-8">
          
          {/* Language Switcher in Sidebar */}
          <div className="px-6">
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-700 uppercase tracking-[0.2em] mb-3 ml-1">
              <Globe weight="thin" className="h-4 w-4" />
              <span>{t.settings.includes('Настройки') ? 'ЯЗЫК' : 'LANGUAGE'}</span>
            </div>
            <div className="flex gap-1 overflow-hidden p-1 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
              {(['ru', 'kz', 'en'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "flex-1 py-1 rounded-lg text-[10px] font-black uppercase transition-all duration-300",
                    lang === l 
                      ? "bg-lime-400 text-black shadow-[0_10px_20px_rgba(200,255,0,0.15)]" 
                      : "text-zinc-600 hover:text-zinc-400"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4">
             <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 group hover:border-lime-400/20 transition-all">
                <div className="flex items-center mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 border border-zinc-800 flex-shrink-0 shadow-lg transition-colors group-hover:bg-lime-400/5">
                    <User weight="thin" className="h-5 w-5 text-zinc-500 group-hover:text-lime-400 transition-colors" />
                  </div>
                  <div className="ml-3 flex-1 overflow-hidden">
                    <p className="text-[13px] font-bold text-zinc-200 truncate">{t.clientName}</p>
                    <p className="text-[9px] text-zinc-600 truncate uppercase tracking-widest font-black group-hover:text-lime-400/60 transition-colors">PLAN: {activePlan}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex w-full items-center justify-center h-10 text-[10px] font-black text-zinc-500 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all border border-zinc-800 hover:border-red-500/30 uppercase tracking-[0.2em]"
                >
                  <SignOut weight="thin" className="mr-2 h-4 w-4" />
                  {isLoggingOut ? '...' : t.signout}
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#05050a] relative overflow-y-auto lg:h-screen pt-16 lg:pt-0">
        {/* Subtle background glow to match landing */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-lime-400/5 blur-[120px] pointer-events-none" />
        
        <div className="flex-1 p-5 md:p-8 lg:p-12 z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
