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
import { cn } from "@/lib/utils";
import Logo from "../ui/Logo";

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
        "nav-container",
        scrolled ? "nav-scrolled" : "bg-transparent border-b border-transparent"
      )}
    >
      {/* Logo */}
      <Link href="/" className="nav-logo">
        <Logo />
      </Link>

      <div className="flex items-center gap-6">
        <Link href="/docs" className="nav-link">
          {t.docs}
        </Link>
        <a 
          href="https://a1-gitlab3.alem.ai/aidyn/arifalta" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="nav-link flex items-center gap-2"
        >
          GitLab
        </a>
        <a 
          href="https://alem.plus" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="nav-link"
        >
          Витрина alem.plus
        </a>
        <Link href="/login" className="nav-link nav-link-accent">
          Log In
        </Link>
        <LanguageSwitcher />

        {/* Action */}
        <Link href="/#pricing">
          <MagneticButton
            intensity={20}
            className="hidden md:block btn-primary px-6 py-2.5 text-sm"
          >
            {t.embed}
          </MagneticButton>
        </Link>
      </div>
    </motion.nav>
  );
}
