"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Globe } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Lang } from "@/lib/i18n/translations";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  const langs: { code: Lang; label: string }[] = [
    { code: "kz", label: "Қазақша" },
    { code: "ru", label: "Русский" },
    { code: "en", label: "English" },
  ];

  return (
    <div className="relative inline-flex items-center">
      <button 
        onClick={toggleOpen}
        className="flex items-center gap-2.5 rounded-full border border-neutral-800 bg-neutral-900/50 px-5 py-2.5 text-sm font-bold text-white transition-all hover:border-lime-400/50 hover:text-lime-400 active:scale-95"
      >
        <Globe className="h-4 w-4 heading-accent" />
        <span className="uppercase tracking-wider">{lang}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="absolute top-full right-0 mt-3 z-50">
            {/* Backdrop for closing */}
            <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative w-48 overflow-hidden rounded-2xl border border-neutral-800 bg-black/80 p-2 shadow-2xl backdrop-blur-2xl"
            >
              <div className="flex flex-col gap-1">
                {langs.map((l: any) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setIsOpen(false);
                    }}
                    className={`group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                      lang === l.code 
                        ? "bg-lime-400 text-black shadow-[0_0_20px_rgba(200,255,0,0.2)]" 
                        : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    }`}
                  >
                    <span>{l.label}</span>
                    {lang === l.code && (
                      <div className="h-1.5 w-1.5 rounded-full bg-black/40" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
