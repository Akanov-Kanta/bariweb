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
          <div className="mb-4 flex items-center gap-1 text-2xl font-bold tracking-tighter text-white">
            <span>Access</span>
            <span className="text-lime-400">Layer</span>
          </div>
          <p className="mb-6 max-w-xs text-sm">
            {t.desc}
          </p>
          <div className="text-xs">
            © 2026 AccessLayer. Made in Kazakhstan.
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="mb-4 text-white font-medium">{t.product}</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-lime-400 transition-colors">Фичи</a></li>
            <li><a href="#" className="hover:text-lime-400 transition-colors">Интеграция</a></li>
            <li><a href="#" className="hover:text-lime-400 transition-colors">Цены</a></li>
            <li><a href="#" className="hover:text-lime-400 transition-colors">Changelog</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-white font-medium">{t.docs}</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-lime-400 transition-colors">API Docs</a></li>
            <li><a href="#" className="hover:text-lime-400 transition-colors">WCAG 2.1 Guide</a></li>
            <li><a href="#" className="hover:text-lime-400 transition-colors">Калькулятор штрафов</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-white font-medium">{t.company}</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-lime-400 transition-colors">О нас</a></li>
            <li><a href="#" className="hover:text-lime-400 transition-colors">Блог</a></li>
            <li><a href="#" className="hover:text-lime-400 transition-colors">Контакты</a></li>
          </ul>
        </div>

      </div>
    </footer>
  );
}
