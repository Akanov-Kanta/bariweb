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
    <div className="relative">
      <button 
        onClick={toggleOpen}
        className="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/50 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
      >
        <Globe className="h-4 w-4 text-lime-400" />
        <span className="uppercase">{lang}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-32 z-50 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl"
            >
              <div className="flex flex-col p-2">
                {langs.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setIsOpen(false);
                    }}
                    className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      lang === l.code 
                        ? "bg-lime-400/10 text-lime-400" 
                        : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
