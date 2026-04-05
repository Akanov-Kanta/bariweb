"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { landingTranslations } from "@/lib/i18n/landingTranslations";

export default function TechStackSection() {
  const { lang } = useLanguage();
  const t = landingTranslations[lang].techstack;

  return (
    <div className="w-full border-y border-neutral-900 bg-[#080808] py-8 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500 opacity-60">
          {t.label}<span className="text-white">alem.plus</span>
        </div>
        
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 md:gap-x-12">
          {t.items.map((item: string, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2 text-sm font-medium text-neutral-400"
            >
              <div className="h-1 w-1 rounded-full bg-lime-400/50" />
              {item}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
