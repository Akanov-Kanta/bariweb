"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function FAQ() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section className="py-24 bg-[#0a0a0f]/60 backdrop-blur-md relative border-t border-zinc-900">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-12 text-center">
            {t.faq.title}
          </h2>

          <div className="space-y-1">
            {t.faq.items.map((faq: { q: string, a: string }, i: number) => (
              <div key={i} className="border-b border-zinc-800/80 last:border-0">
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between py-5 md:py-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm cursor-pointer"
                  aria-expanded={openIndex === i}
                >
                  <span className="text-lg text-zinc-200 font-medium pr-8">{faq.q}</span>
                  <motion.div
                     animate={{ rotate: openIndex === i ? 180 : 0 }}
                     transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-blue-500 shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 text-zinc-400 text-sm md:text-base leading-relaxed max-w-2xl">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
