"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function ROICalculator() {
  const { t, lang } = useLanguage();
  const c = t.roi;
  const [sizeIndex, setSizeIndex] = useState(1);
  const [usersIndex, setUsersIndex] = useState(50); // 0 to 100 representing 1k to 1M

  // Calculate actual users based on index (logarithmic feel)
  const users = Math.floor(Math.pow(10, 3 + (usersIndex / 100) * 3)); // 10^3 = 1k, to 10^6 = 1M

  const companies = [
    { label: c.sizes[0], fine: 1000, redesign: 10000, al: 1188, name: "Lite", limit: 5000 },
    { label: c.sizes[1], fine: 10000, redesign: 30000, al: 3588, name: "Starter", limit: 15000 },
    { label: c.sizes[2], fine: 50000, redesign: 150000, al: 14400, name: "Business", limit: 50000 },
    { label: c.sizes[3], fine: 150000, redesign: 500000, al: 42000, name: "Enterprise", limit: 500000 },
    { label: c.sizes[4], fine: 500000, redesign: 1500000, al: 72000, name: "Enterprise Premium", limit: 10000000 },
  ];

  // Auto-select plan based on traffic if it exceeds current size limit
  const requiredIndex = companies.findIndex(comp => comp.limit >= users);
  const effectiveIndex = Math.max(sizeIndex, requiredIndex === -1 ? 4 : requiredIndex);
  
  const current = companies[effectiveIndex];
  const isUpgradedByTraffic = effectiveIndex > sizeIndex;
  
  // Calculate total alternative cost
  const riskCost = current.fine;
  const redesignCost = current.redesign;

  // Real calculation
  const savings = riskCost + redesignCost - current.al;

  const formatUsd = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <section className="py-24 bg-transparent relative border-t border-zinc-900">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <span className="section-label inline-block font-mono text-xs uppercase tracking-widest text-cyan-500/80 mb-4">
            {c.label}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
            {c.title} <span data-text={c.titleGlitch} className="glitch-word text-red-500">{c.titleGlitch}</span> {c.titleAfter}
          </h2>
          <p className="text-lg text-zinc-400">
            {c.desc}
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 lg:gap-16">
          
          {/* Controls */}
          <div className="space-y-12">
            <div>
              <div className="flex justify-between items-center mb-6">
                <label className="text-zinc-300 font-medium">{c.companySize}</label>
                <div className="px-3 py-1 bg-zinc-800 rounded-md text-blue-400 text-sm font-semibold">
                  {current.label}
                </div>
              </div>
              <input 
                type="range" 
                min="0" max="4" step="1"
                value={sizeIndex}
                onChange={(e) => setSizeIndex(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                aria-label={c.companySize}
              />
              <div className="grid grid-cols-5 text-[8px] md:text-[9px] text-zinc-500 mt-2 font-mono uppercase tracking-tighter">
                <span className="text-left">{c.sizes[0]}</span>
                <span className="text-center">{c.sizes[1]}</span>
                <span className="text-center">{c.sizes[2]}</span>
                <span className="text-center">{c.sizes[3]}</span>
                <span className="text-right">{c.sizes[4]}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-6">
                <label className="text-zinc-300 font-medium">{c.monthlyTraffic}</label>
                <div className="px-3 py-1 bg-zinc-800 rounded-md text-blue-400 text-sm font-mono">
                  {new Intl.NumberFormat('ru-RU').format(users)}
                </div>
              </div>
              <input 
                type="range" 
                min="0" max="100" step="1"
                value={usersIndex}
                onChange={(e) => setUsersIndex(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                aria-label={c.monthlyTraffic}
              />
            </div>
          </div>

          {/* Result Box */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                <span className="text-zinc-400 text-sm md:text-base">{c.fineRisk}</span>
                <span className="text-red-400 font-mono text-xl">{formatUsd(riskCost)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                <span className="text-zinc-400 text-sm md:text-base">{c.redesignCost}</span>
                <span className="text-zinc-300 font-mono text-xl">{formatUsd(redesignCost)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-800 pb-4 font-semibold text-blue-400">
                <div className="flex flex-col">
                  <span>Bariweb ({current.name}) / {c.year}</span>
                  {isUpgradedByTraffic && (
                    <span className="text-[10px] text-amber-500 uppercase tracking-widest mt-1">
                      ↑ {lang === 'ru' ? 'Апгрейд по трафику' : lang === 'kz' ? 'Трафик бойынша жаңарту' : 'Traffic Upgrade'}
                    </span>
                  )}
                </div>
                <span className="font-mono text-xl">{formatUsd(current.al)}</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-700">
              <span className="block text-zinc-400 text-sm font-medium mb-2 uppercase tracking-wider">{c.netSavings}:</span>
              <motion.div 
                key={savings}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-4xl md:text-5xl font-black text-white tracking-tight"
              >
                {formatUsd(savings)}
              </motion.div>
            </div>
            
            <a href="#pricing" className="mt-8 w-full block text-center bg-blue-600 hover:bg-blue-500 text-white font-medium py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-colors">
              {c.protectBtn} {formatUsd(current.al / 12)}/{c.month} &rarr;
            </a>
          </div>

        </div>

        <div className="mt-16 text-[10px] text-cyan-600 font-mono uppercase tracking-widest blink-cursor">
          &gt; SYSTEM: REAL-TIME PENALTY PROJECTIONS RENDERED
        </div>
      </div>
    </section>
  );
}
