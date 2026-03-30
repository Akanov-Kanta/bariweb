"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function Countdown() {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number } | null>(null);

  useEffect(() => {
    // Target date: July 11, 2026
    const targetDate = new Date("2026-07-11T00:00:00").getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0 });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        setTimeLeft({ days, hours });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!timeLeft) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-red-600/90 text-white shadow-[0_-10px_30px_rgba(220,38,38,0.3)] backdrop-blur-md border-t border-red-500">
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between text-sm md:text-base gap-3">
        
        <div className="flex items-center gap-3 font-semibold">
          <ShieldAlert className="w-5 h-5 animate-pulse" />
          <span className="hidden md:inline text-red-200 uppercase tracking-widest text-xs">{t.countdown.deadline}</span>
          <span className="tracking-tight">{t.countdown.title}</span>
        </div>

        <div className="flex items-center gap-4 md:gap-8 font-mono">
          <div className="flex items-center gap-1 bg-black/30 px-3 py-1.5 rounded text-red-50 border border-red-400">
            <span className="font-bold text-lg md:text-xl line-clamp-1">{String(timeLeft.days).padStart(3, '0')}</span>
            <span className="text-red-200 text-xs uppercase">{t.countdown.days}</span>
            <span className="font-bold text-lg md:text-xl ml-1 line-clamp-1">{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="text-red-200 text-xs uppercase">{t.countdown.hours}</span>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-xs font-sans text-red-100 uppercase tracking-wide">
            <div className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-red-300" /> {t.countdown.wcag}</div>
            <div className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-red-300" /> {t.countdown.dev}</div>
          </div>
        </div>

        <button 
          onClick={() => document.getElementById('audit')?.scrollIntoView({ behavior: 'smooth' })}
          className="bg-white text-red-600 px-5 py-2 rounded-full font-bold text-sm tracking-wide shadow-lg hover:shadow-white/20 hover:scale-105 transition-all whitespace-nowrap cursor-pointer"
        >
          {t.countdown.ready}
        </button>
      </div>
    </div>
  );
}
