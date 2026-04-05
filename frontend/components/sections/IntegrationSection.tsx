"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { landingTranslations } from "@/lib/i18n/landingTranslations";

const SCRIPT_CODE = '<script src="cdn.bariweb.kz/v2.js" client_id="YOUR_KEY"></script>';

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
    <section className="section-container bg-[#080808]">
      <div className="w-full max-w-4xl text-center">
        <h2 className="section-heading">
          {t.title1} <br />
          <span className="heading-accent">{t.title2}</span>
        </h2>
        <p className="section-description mx-auto">
          {t.desc}
        </p>

        {/* macOS Terminal Mockup */}
        <div className="terminal-container mx-auto w-full">
          {/* Header */}
          <div className="terminal-header">
            <div className="terminal-dot terminal-dot-red" />
            <div className="terminal-dot terminal-dot-yellow" />
            <div className="terminal-dot terminal-dot-green" />
            <div className="ml-4 text-xs text-neutral-500 uppercase tracking-widest">index.html</div>
          </div>
          
          {/* Body */}
          <div className="terminal-body text-left">
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
