"use client";

import { motion } from "framer-motion";
import { CursorClick, Scan, ShieldCheck, Lightning } from "@phosphor-icons/react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { landingTranslations } from "@/lib/i18n/landingTranslations";

export default function BentoFeaturesSection() {
  const { lang } = useLanguage();
  const t = landingTranslations[lang].bento;

  return (
    <section className="section-container min-h-screen bg-[#080808]">
      <div className="w-full max-w-7xl">
        <div className="mb-16">
          <h2 className="section-heading text-left">
            {t.title1} <br />
            <span className="heading-accent">{t.title2}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:grid-rows-2">
          
          {/* Feature 1 - Scanning (1 column, 2 rows) */}
          <div className="group glass-card md:row-span-2 flex flex-col justify-between">
            <div>
              <Scan weight="thin" className="mb-6 h-8 w-8 text-neutral-400 group-hover:text-white transition-colors" />
              <h3 className="mb-3 text-2xl font-bold text-white">{t.scanTitle}</h3>
              <p className="text-neutral-400">
                {t.scanDesc}
              </p>
            </div>
            
            <div className="mt-8 flex h-48 items-end justify-center rounded-2xl bg-black p-4">
              <motion.div 
                className="h-1 w-full bg-gradient-to-r from-transparent via-lime-400 to-transparent shadow-[0_0_10px_rgba(200,255,0,0.5)]"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </div>

          {/* Feature 2 - Autopilot (2 columns, 1 row) */}
          <div className="group glass-card md:col-span-2 flex flex-col">
            <div className="relative z-10 flex h-full flex-col justify-center w-1/2">
              <Lightning weight="thin" className="mb-6 h-8 w-8 heading-accent" />
              <h3 className="mb-3 text-2xl font-bold text-white">{t.autoTitle}</h3>
              <p className="text-neutral-400">
                {t.autoDesc}
              </p>
            </div>

            {/* Simulated Live Cursor Animation (Right side of the card) */}
            <div className="absolute -right-10 -top-10 bottom-0 w-2/3 md:w-1/2 opacity-70 group-hover:opacity-100 transition-opacity">
              <div className="relative h-full w-full rounded-tl-3xl border-l border-t border-neutral-800 bg-black p-8 shadow-2xl">
                {/* Fake Inputs */}
                <div className="space-y-4 pt-12">
                  <div className="h-10 w-3/4 rounded-lg border border-neutral-800 bg-neutral-950" />
                  <div className="h-10 w-full rounded-lg border border-neutral-800 bg-neutral-950" id="target-input-1" />
                  <div className="h-10 w-1/2 rounded-lg bg-lime-400" id="target-btn-1" />
                </div>
                
                {/* The Animated Cursor */}
                <motion.div
                  className="absolute"
                  animate={{
                    x: [0, -100, -80, -150],
                    y: [0, 80, 140, 200],
                    scale: [1, 1, 0.9, 1], // simulate click on scale down
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                    times: [0, 0.4, 0.6, 1],
                  }}
                  initial={{ x: 0, y: 0 }}
                >
                  <CursorClick weight="thin" className="h-8 w-8 text-white" />
                  <div className="mt-2 rounded bg-neutral-800 px-2 py-1 text-[10px] text-white font-mono">{t.agentActive}</div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Feature 3 - Compliance (1 column, 1 row) */}
          <div className="group glass-card flex flex-col justify-between">
            <div>
              <ShieldCheck weight="thin" className="mb-6 h-8 w-8 text-neutral-400 group-hover:heading-accent transition-colors" />
              <h3 className="mb-3 text-xl font-bold text-white">{t.codeTitle}</h3>
              <p className="text-sm text-neutral-400">
                {t.codeDesc}
              </p>
            </div>
          </div>

          {/* Feature 4 - Performance (1 column, 1 row) */}
          <div className="group glass-card flex flex-col justify-between">
            <div>
              <div className="mb-6 text-2xl font-bold text-neutral-500 group-hover:text-white transition-colors">1.2kb</div>
              <h3 className="mb-3 text-xl font-bold text-white">{t.perfTitle}</h3>
              <p className="text-sm text-neutral-400">
                {t.perfDesc}
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
