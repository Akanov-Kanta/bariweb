"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { landingTranslations } from "@/lib/i18n/landingTranslations";

export default function Footer() {
  const { lang } = useLanguage();
  const t = landingTranslations[lang].footer;

  return (
    <footer className="border-t border-neutral-900 bg-[#080808] px-6 py-12 md:px-12 text-neutral-500">
      <div className="mx-auto max-w-7xl grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
        
        {/* Brand */}
        <div className="col-span-2 lg:col-span-2">
          <div className="nav-logo mb-4">
            <span>Access</span>
            <span className="heading-accent">Layer</span>
          </div>
          <p className="mb-6 max-w-xs text-sm text-neutral-400">
            {t.desc}
          </p>
          <div className="text-xs opacity-50 font-mono">
            © 2026 AccessLayer. Made in Kazakhstan.
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="mb-4 text-white font-medium">{t.product}</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="nav-link nav-link-accent">Фичи</a></li>
            <li><a href="#" className="nav-link nav-link-accent">Интеграция</a></li>
            <li><a href="#" className="nav-link nav-link-accent">Цены</a></li>
            <li><a href="#" className="nav-link nav-link-accent">Changelog</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-white font-medium">{t.docs}</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="nav-link nav-link-accent">API Docs</a></li>
            <li><a href="#" className="nav-link nav-link-accent">WCAG 2.1 Guide</a></li>
            <li><a href="#" className="nav-link nav-link-accent">Калькулятор штрафов</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-white font-medium">{t.company}</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="nav-link nav-link-accent">О нас</a></li>
            <li><a href="#" className="nav-link nav-link-accent">Блог</a></li>
            <li><a href="#" className="nav-link nav-link-accent">Контакты</a></li>
          </ul>
        </div>

      </div>
    </footer>
  );
}
