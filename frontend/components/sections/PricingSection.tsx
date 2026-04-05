"use client";

import { useState } from "react";
import MagneticButton from "../ui/MagneticButton";
import { Check } from "@phosphor-icons/react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { landingTranslations } from "@/lib/i18n/landingTranslations";

export default function PricingSection() {
  const { lang } = useLanguage();
  const t = landingTranslations[lang].pricing;

  return (
    <section id="pricing" className="section-container bg-[#080808]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="section-heading">
            {t.title1} <br />
            <span className="heading-accent">{t.title2}</span>
          </h2>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 md:items-stretch">
          
          {/* Starter */}
          <div className="price-card flex flex-col">
            <h3 className="mb-2 text-xl font-medium text-white">Starter</h3>
            <div className="mb-6 text-4xl font-bold text-white">$299<span className="text-lg text-neutral-500">{t.mo}</span></div>
            <ul className="mb-8 space-y-4 text-neutral-400 flex-1">
              {t.starterFeatures.map((feature: string, i: number) => (
                <li key={i} className="flex items-center gap-3">
                  <Check weight="bold" className="h-5 w-5 heading-accent" /> {feature}
                </li>
              ))}
            </ul>
            <Link href="/payment" className="w-full">
              <MagneticButton className="btn-outline w-full text-sm">
                {t.starter}
              </MagneticButton>
            </Link>
          </div>

          {/* Lite */}
          <div className="price-card flex flex-col border-neutral-700/50 bg-neutral-900/10">
            <h3 className="mb-2 text-xl font-medium text-white">Lite</h3>
            <div className="mb-6 text-4xl font-bold text-white">$99<span className="text-lg text-neutral-500">{t.mo}</span></div>
            <ul className="mb-8 space-y-4 text-neutral-400 flex-1">
              {t.liteFeatures.map((feature: string, i: number) => (
                <li key={i} className="flex items-center gap-3">
                  <Check weight="bold" className="h-5 w-5 heading-accent" /> {feature}
                </li>
              ))}
            </ul>
            <Link href="/payment" className="w-full">
              <MagneticButton className="btn-outline w-full text-sm">
                {t.lite}
              </MagneticButton>
            </Link>
          </div>

          {/* Business (Highlighted) */}
          <div className="price-card price-card-popular flex flex-col relative">
            <div className="badge-popular">{t.hit}</div>
            <h3 className="mb-2 text-xl font-medium text-white">Business</h3>
            <div className="mb-6 text-4xl font-bold text-white">$1200<span className="text-lg heading-accent opacity-60">{t.mo}</span></div>
            <ul className="mb-8 space-y-4 text-neutral-300 flex-1">
              {t.businessFeatures.map((feature: string, i: number) => (
                <li key={i} className="flex items-center gap-3">
                  <Check weight="bold" className="h-5 w-5 heading-accent" /> {feature}
                </li>
              ))}
            </ul>
            <Link href="/payment" className="w-full">
              <MagneticButton intensity={20} className="btn-primary w-full shadow-lg text-sm">
                {t.business}
              </MagneticButton>
            </Link>
          </div>

          {/* Enterprise */}
          <div className="price-card flex flex-col">
            <h3 className="mb-2 text-xl font-medium text-white">Enterprise</h3>
            <div className="mb-6 text-4xl font-bold text-white">$3500<span className="text-lg text-neutral-500">{t.mo}</span></div>
            <ul className="mb-8 space-y-4 text-neutral-400 flex-1">
              {t.enterpriseFeatures.map((feature: string, i: number) => (
                <li key={i} className="flex items-center gap-3">
                  <Check weight="bold" className="h-5 w-5 heading-accent" /> {feature}
                </li>
              ))}
            </ul>
            <Link href="/payment" className="w-full">
              <MagneticButton className="btn-outline w-full text-sm">
                {t.enterprise}
              </MagneticButton>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
