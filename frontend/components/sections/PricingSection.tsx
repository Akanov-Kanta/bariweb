"use client";

import { useState } from "react";
import MagneticButton from "../ui/MagneticButton";
import { Check } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { landingTranslations } from "@/lib/i18n/landingTranslations";

export default function PricingSection() {
  const [companySize, setCompanySize] = useState(50);
  const { lang } = useLanguage();
  const t = landingTranslations[lang].pricing;
  
  // Fake calculation logic for visual impact
  const potentialPenalty = Math.round(companySize * 1500 + 50000);
  const potentialSavings = Math.ceil(potentialPenalty * 0.95);

  return (
    <section id="pricing" className="bg-[#080808] px-6 py-24 md:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            {t.title1} <br />
            <span className="text-lime-400">{t.title2}</span>
          </h2>
        </div>

        {/* Calculator */}
        <div className="mx-auto mb-20 max-w-3xl rounded-3xl border border-neutral-800 bg-neutral-900/50 p-8 shadow-2xl">
          <h3 className="mb-6 text-xl font-semibold text-white">{t.calcTitle}</h3>
          <div className="mb-8">
            <label className="mb-4 flex justify-between text-sm text-neutral-400">
              <span>{t.calcEmployees}</span>
              <span className="text-white">{companySize} {t.calcPeople}</span>
            </label>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={companySize}
              onChange={(e) => setCompanySize(Number(e.target.value))}
              className="h-2 w-full appearance-none rounded-lg bg-neutral-700 accent-lime-400 outline-none"
            />
          </div>
          
          <div className="flex flex-col gap-4 border-t border-neutral-800 pt-6 md:flex-row md:justify-between">
            <div>
              <div className="text-sm text-neutral-500">{t.calcPenalty}</div>
              <div className="text-2xl font-bold text-red-500">${potentialPenalty.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-neutral-500">{t.calcSavings}</div>
              <div className="text-3xl font-bold text-lime-400">${potentialSavings.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:items-center">
          
          {/* Starter */}
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-8">
            <h3 className="mb-2 text-xl font-medium text-white">Starter</h3>
            <div className="mb-6 text-4xl font-bold text-white">$299<span className="text-lg text-neutral-500">{t.mo}</span></div>
            <ul className="mb-8 space-y-4 text-neutral-400">
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-lime-400" /> До 10,000 визитов</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-lime-400" /> Базовое сканирование</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-lime-400" /> Отчеты об ошибках</li>
            </ul>
            <Link href="/payment" className="w-full">
              <MagneticButton className="w-full rounded-full border border-neutral-700 bg-transparent py-3 font-medium text-white transition-colors hover:bg-neutral-800">
                {t.starter}
              </MagneticButton>
            </Link>
          </div>

          {/* Business (Highlighted) */}
          <div className="relative rounded-3xl border border-lime-400/50 bg-[#0a1200] p-8 shadow-[0_0_40px_-10px_rgba(200,255,0,0.15)] md:-translate-y-4">
            <div className="absolute -top-4 right-8 rounded-full bg-lime-400 px-3 py-1 text-xs font-bold text-black">{t.hit}</div>
            <h3 className="mb-2 text-xl font-medium text-white">Business</h3>
            <div className="mb-6 text-4xl font-bold text-white">$1200<span className="text-lg text-lime-400/60">{t.mo}</span></div>
            <ul className="mb-8 space-y-4 text-neutral-300">
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-lime-400" /> До 500,000 визитов</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-lime-400" /> Голосовой автопилот</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-lime-400" /> SLA & Поддержка 24/7</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-lime-400" /> Сертификат compliance</li>
            </ul>
            <Link href="/payment" className="w-full">
              <MagneticButton intensity={20} className="w-full rounded-full bg-lime-400 py-3 font-semibold text-black transition-transform hover:scale-105">
                {t.business}
              </MagneticButton>
            </Link>
          </div>

          {/* Enterprise */}
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-8">
            <h3 className="mb-2 text-xl font-medium text-white">Enterprise</h3>
            <div className="mb-6 text-4xl font-bold text-white">$3500<span className="text-lg text-neutral-500">{t.mo}</span></div>
            <ul className="mb-8 space-y-4 text-neutral-400">
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-lime-400" /> Анлим визиты</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-lime-400" /> On-premise релиз</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-lime-400" /> Кастомный ИИ-помощник</li>
            </ul>
            <Link href="/payment" className="w-full">
              <MagneticButton className="w-full rounded-full border border-neutral-700 bg-transparent py-3 font-medium text-white transition-colors hover:bg-neutral-800">
                {t.enterprise}
              </MagneticButton>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
