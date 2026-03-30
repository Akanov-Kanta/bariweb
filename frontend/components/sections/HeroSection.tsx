"use client";

import { motion, Variants } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { landingTranslations } from "@/lib/i18n/landingTranslations";

export default function HeroSection() {
  const [timeLeft, setTimeLeft] = useState({
    days: 102,
    hours: 21,
  });

  const { lang } = useLanguage();
  const t = landingTranslations[lang].hero;

  const TITLE_WORDS = useMemo(() => t.title.split(" "), [t.title]);

  // Simple countdown effect purely for visuals
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.hours === 0) return { days: prev.days - 1, hours: 23 };
        return { ...prev, hours: prev.hours - 1 };
      });
    }, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const wordVariants: Variants = {
    hidden: { opacity: 0, y: 50, rotateX: -45 },
    visible: { 
      opacity: 1, 
      y: 0, 
      rotateX: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
    },
  };

  return (
    <section className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden">
      {/* Abstract Blob Background */}
      <div className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 opacity-40">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            borderRadius: ["30% 70% 70% 30% / 30% 30% 70% 70%", "70% 30% 30% 70% / 70% 70% 30% 30%", "30% 70% 70% 30% / 30% 30% 70% 70%"],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
          className="h-full w-full bg-gradient-to-br from-lime-400 to-[#003311] opacity-60 blur-[100px]"
        />
      </div>

      {/* Huge Typography */}
      <div className="z-10 w-full max-w-6xl px-6 text-center md:px-12">
        <motion.h1
          key={lang} // forces re-animation on language change
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-5xl font-extrabold leading-[1.1] tracking-tight text-white md:text-7xl lg:text-[90px]"
          style={{ perspective: "1000px" }}
        >
          {TITLE_WORDS.map((word: string, i: number) => (
            <motion.span
              key={i}
              variants={wordVariants}
              className="inline-block"
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>
      </div>

      {/* Timer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-12 flex flex-col items-center gap-2"
      >
        <div className="text-sm tracking-[0.2em] text-neutral-500 uppercase">
          {t.deadline}
        </div>
        <div className="font-mono text-xl text-lime-400">
          {t.timeLeft} {timeLeft.days} {t.days} {timeLeft.hours} {t.hours}
        </div>
      </motion.div>
    </section>
  );
}
