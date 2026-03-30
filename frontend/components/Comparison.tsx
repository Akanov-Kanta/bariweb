/* eslint-disable */
"use client";

import { Check, X, Info } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function Comparison() {
  const { t } = useLanguage();
  const c = t.comparison;

  return (
    <section className="py-24 bg-[#0a0a0f]/60 backdrop-blur-md relative border-t border-zinc-900">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
            {c.title}
          </h2>
          <p className="text-lg text-zinc-400">
            {c.desc}
          </p>
        </div>

        <div className="max-w-5xl mx-auto overflow-x-auto pb-8">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="py-6 px-4 text-left font-medium tracking-wider text-zinc-400 w-1/4">{c.th1}</th>
                <th className="py-6 px-4 text-center font-bold tracking-wider text-white text-lg w-1/4 bg-zinc-900/20 rounded-t-lg">{c.th2}</th>
                <th className="py-6 px-4 text-center font-bold tracking-wider text-red-400 text-lg w-1/4">{c.th3}</th>
                <th className="py-6 px-4 text-center w-1/4 relative border-x border-t border-blue-500 bg-blue-500/5 rounded-t-xl">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.4)] whitespace-nowrap">
                    Рекомендуемый
                  </div>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 text-xl font-black block mt-2">{c.thFull}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-sm md:text-base">
              
              {c.rows.map((row: { name: string, r1: string, r2: string, r3: string }, idx: number) => (
                <tr key={idx} className={idx === c.rows.length - 1 ? "border-b border-zinc-800" : ""}>
                  <td className="py-5 px-4 text-zinc-300 font-medium font-sans">{row.name}</td>
                  <td className={`py-5 px-4 text-center \${row.r1.includes('От') || row.r1.includes('Сохраняется') ? 'text-red-400' : 'text-zinc-400'}`}>{row.r1}</td>
                  <td className={`py-5 px-4 text-center \${row.r2.includes('100') ? 'text-red-500 font-medium' : 'text-zinc-400'}`}>{row.r2 === '-' ? <div className="flex justify-center"><X className="w-5 h-5 text-zinc-600" /></div> : row.r2}</td>
                  <td className={`py-5 px-4 text-center font-bold border-x \${idx === c.rows.length - 1 ? 'border-b rounded-b-xl ' : ''}border-blue-500 bg-blue-500/5 \${row.r3.includes('Автоматическая') || row.r3.includes('Устранен') ? 'text-green-400' : 'text-blue-400'}`}>
                    {row.r3 === '0 ₸' ? <span className="text-white">0 ₸</span> : row.r3.includes('Автоматическая') ? <div className="flex justify-center"><Check className="w-6 h-6 text-green-500" /></div> : row.r3}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
