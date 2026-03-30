/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Layers } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Lang } from "@/lib/i18n/translations";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { t, lang, setLang } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 \${
        scrolled 
          ? "bg-black/50 backdrop-blur-md border-b border-zinc-800 py-3" 
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-glow-accent">AccessLayer</span>
        </Link>
        
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-zinc-300">
          <a href="#problem" className="hover:text-white transition-colors">{t.nav.problem}</a>
          <a href="#integration" className="hover:text-white transition-colors">{t.nav.solution}</a>
          <a href="#pricing" className="hover:text-white transition-colors">{t.nav.pricing}</a>
          <Link href="/docs" className="hover:text-white transition-colors">{t.nav.docs}</Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 bg-zinc-900/80 border border-zinc-800 rounded-full p-1 mr-2 backdrop-blur-sm">
            {(["ru", "kz", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 text-xs font-bold uppercase rounded-full transition-all \${
                  lang === l 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <Button variant="ghost" className="hidden sm:flex">{t.nav.login}</Button>
          <Button variant="glow" onClick={() => document.getElementById('audit')?.scrollIntoView({ behavior: 'smooth' })}>
            {t.nav.audit}
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
