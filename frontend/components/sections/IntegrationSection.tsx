"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { landingTranslations } from "@/lib/i18n/landingTranslations";

const SCRIPT_CODE = '<script src="cdn.accesslayer.kz/v2.js" data-key="YOUR_KEY"></script>';

const typewriterVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const charVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export default function IntegrationSection() {
  const { lang } = useLanguage();
  const t = landingTranslations[lang].integration;

  return (
    <section className="flex flex-col items-center justify-center bg-[#080808] px-6 py-24 md:px-12">
      <div className="w-full max-w-4xl text-center">
        <h2 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-5xl">
          {t.title1} <br />
          <span className="text-lime-400">{t.title2}</span>
        </h2>
        <p className="mb-12 text-lg text-neutral-400">
          {t.desc}
        </p>

        {/* macOS Terminal Mockup */}
        <div className="mx-auto w-full overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-neutral-800 bg-neutral-900 px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <div className="ml-4 text-xs text-neutral-500">index.html</div>
          </div>
          
          {/* Body */}
          <div className="p-6 text-left font-mono text-sm md:text-base">
            <div className="mb-2 text-neutral-500">{"<head>"}</div>
            
            <div className="pl-4 text-lime-400">
              <motion.span
                variants={typewriterVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
              >
                {SCRIPT_CODE.split("").map((char, index) => (
                  <motion.span key={index} variants={charVariants}>
                    {char}
                  </motion.span>
                ))}
              </motion.span>
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block h-5 w-2 translate-y-1 bg-lime-400 ml-1"
              />
            </div>
            
            <div className="mt-2 text-neutral-500">{"</head>"}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
