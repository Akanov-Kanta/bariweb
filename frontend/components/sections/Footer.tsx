"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { landingTranslations } from "@/lib/i18n/landingTranslations";
import Logo from "../ui/Logo";

export default function Footer() {
  const { lang } = useLanguage();
  const t = landingTranslations[lang].footer;

  return (
    <footer className="border-t border-neutral-900 bg-[#080808] px-6 py-12 md:px-12 text-neutral-500">
      <div className="mx-auto max-w-7xl grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
        
        {/* Brand */}
        <div className="col-span-2 lg:col-span-2">
          <div className="nav-logo mb-4">
            <Logo />
          </div>
          <p className="mb-6 max-w-xs text-sm text-neutral-400">
            {t.desc}
          </p>
          <div className="text-xs opacity-50 font-mono">
            © 2026 Bariweb. Made in Kazakhstan.
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="mb-4 text-white font-medium">{t.product}</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="https://a1-gitlab3.alem.ai/aidyn/arifalta" target="_blank" rel="noopener noreferrer" className="nav-link nav-link-accent">{t.gitLab}</a></li>
            <li><a href="https://alem.plus" target="_blank" rel="noopener noreferrer" className="nav-link nav-link-accent">{t.vitrine}</a></li>
            <li><a href="#" className="nav-link nav-link-accent">{t.features}</a></li>
            <li><a href="#" className="nav-link nav-link-accent">{t.integration}</a></li>
            <li><a href="#" className="nav-link nav-link-accent">{t.pricing}</a></li>
            <li><a href="#" className="nav-link nav-link-accent">{t.changelog}</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-white font-medium">{t.docs}</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="nav-link nav-link-accent">{t.apiDocs}</a></li>
            <li><a href="#" className="nav-link nav-link-accent">{t.wcagGuide}</a></li>
            <li><a href="#" className="nav-link nav-link-accent">{t.calcPenalty}</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-white font-medium">{t.company}</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="nav-link nav-link-accent">{t.about}</a></li>
            <li><a href="#" className="nav-link nav-link-accent">{t.blog}</a></li>
            <li><a href="#" className="nav-link nav-link-accent">{t.contacts}</a></li>
          </ul>
        </div>

      </div>
      <div className="mx-auto max-w-7xl mt-12 pt-8 border-t border-neutral-900 text-xs opacity-50 font-mono text-center">
        {t.copyright}
      </div>
    </footer>
  );
}
