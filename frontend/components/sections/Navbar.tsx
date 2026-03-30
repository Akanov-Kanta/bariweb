"use client";

import { motion } from "framer-motion";
import MagneticButton from "../ui/MagneticButton";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import LanguageSwitcher from "../ui/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { landingTranslations } from "@/lib/i18n/landingTranslations";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { lang } = useLanguage();
  const t = landingTranslations[lang].navbar;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed left-0 right-0 top-0 z-40 flex items-center justify-between px-6 py-4 transition-colors duration-300 md:px-12",
        scrolled ? "border-b border-neutral-800 bg-black/60 backdrop-blur-xl" : "bg-transparent border-b border-transparent"
      )}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-1 text-2xl font-bold tracking-tighter text-white">
        <span>Access</span>
        <span className="text-lime-400">Layer</span>
      </Link>

      <div className="flex items-center gap-6">
        <Link href="/docs" className="text-sm font-medium text-neutral-300 transition-colors hover:text-white">
          {t.docs}
        </Link>
        <LanguageSwitcher />

        {/* Action */}
        <Link href="/#pricing">
          <MagneticButton
            intensity={20}
            className="hidden md:block rounded-full bg-lime-400 px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-105"
          >
            {t.embed}
          </MagneticButton>
        </Link>
      </div>
    </motion.nav>
  );
}
