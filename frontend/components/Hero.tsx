"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { ParticleNetwork } from "./ParticleNetwork";
import { SphereBlob } from "./SphereBlob";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden noise">
      
      {/* 3D Global Particle Background */}
      <div className="absolute inset-0 z-0 opacity-40">
        <ParticleNetwork />
      </div>

      <div className="container relative z-10 px-4 md:px-6 mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          
          <div className="flex-1 space-y-8 max-w-2xl text-center lg:text-left pt-12">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm text-sm font-medium text-zinc-300"
            >
              <Sparkles className="w-4 h-4 text-blue-500" />
              <div className="glitch-word text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500" data-text={t.hero.glitchText}>
                {t.hero.glitchText}
              </div>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none text-white"
            >
              {t.hero.title}
              <br />
              <span className="text-zinc-500 block mt-2 text-4xl md:text-6xl">{t.hero.title2}</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-500 to-indigo-700 glitch-word glow" data-text={t.hero.title2Glitch}>
                {t.hero.title2Glitch}
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="text-lg md:text-xl text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light"
            >
              {t.hero.desc}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center gap-4 pt-4 justify-center lg:justify-start"
            >
              <Button size="lg" variant="glow" className="w-full sm:w-auto text-lg group h-14 px-8">
                {t.hero.btnPrimary}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg hover:bg-zinc-900 border-zinc-700 text-white">
                {t.hero.btnSecondary}
              </Button>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex-1 w-full max-w-lg lg:max-w-xl aspect-square relative"
          >
            {/* Morphing Widget Visualization */}
            <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
            <SphereBlob />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
