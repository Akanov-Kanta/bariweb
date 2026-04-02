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
    <section id="pricing" className="section-container bg-[#080808]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="section-heading">
            {t.title1} <br />
            <span className="heading-accent">{t.title2}</span>
          </h2>
        </div>

        {/* Calculator */}
        <div className="price-card mx-auto mb-20 max-w-3xl">
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
              <div className="text-3xl font-bold heading-accent">${potentialSavings.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:items-center">
          
          {/* Starter */}
          <div className="price-card">
            <h3 className="mb-2 text-xl font-medium text-white">Starter</h3>
            <div className="mb-6 text-4xl font-bold text-white">$299<span className="text-lg text-neutral-500">{t.mo}</span></div>
            <ul className="mb-8 space-y-4 text-neutral-400">
              <li className="flex items-center gap-3"><Check className="h-5 w-5 heading-accent" /> До 10,000 визитов</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 heading-accent" /> Базовое сканирование</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 heading-accent" /> Отчеты об ошибках</li>
            </ul>
            <Link href="/payment" className="w-full">
              <MagneticButton className="btn-outline w-full">
                {t.starter}
              </MagneticButton>
            </Link>
          </div>

          {/* Business (Highlighted) */}
          <div className="price-card price-card-popular md:-translate-y-4">
            <div className="badge-popular">{t.hit}</div>
            <h3 className="mb-2 text-xl font-medium text-white">Business</h3>
            <div className="mb-6 text-4xl font-bold text-white">$1200<span className="text-lg heading-accent opacity-60">{t.mo}</span></div>
            <ul className="mb-8 space-y-4 text-neutral-300">
              <li className="flex items-center gap-3"><Check className="h-5 w-5 heading-accent" /> До 500,000 визитов</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 heading-accent" /> Голосовой автопилот</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 heading-accent" /> SLA & Поддержка 24/7</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 heading-accent" /> Сертификат compliance</li>
            </ul>
            <Link href="/payment" className="w-full">
              <MagneticButton intensity={20} className="btn-primary w-full shadow-lg">
                {t.business}
              </MagneticButton>
            </Link>
          </div>

          {/* Enterprise */}
          <div className="price-card">
            <h3 className="mb-2 text-xl font-medium text-white">Enterprise</h3>
            <div className="mb-6 text-4xl font-bold text-white">$3500<span className="text-lg text-neutral-500">{t.mo}</span></div>
            <ul className="mb-8 space-y-4 text-neutral-400">
              <li className="flex items-center gap-3"><Check className="h-5 w-5 heading-accent" /> Анлим визиты</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 heading-accent" /> On-premise релиз</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 heading-accent" /> Кастомный ИИ-помощник</li>
            </ul>
            <Link href="/payment" className="w-full">
              <MagneticButton className="btn-outline w-full">
                {t.enterprise}
              </MagneticButton>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
