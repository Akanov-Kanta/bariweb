"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Navbar from "@/components/sections/Navbar";
import NoiseOverlay from "@/components/ui/NoiseOverlay";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { landingTranslations } from "@/lib/i18n/landingTranslations";
import { Code2, Settings2, ShieldCheck, Cpu } from "lucide-react";

type SectionKey = "intro" | "architecture" | "security" | "vanilla" | "react" | "vue" | "config" | "callbacks" | "css";

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<SectionKey>("intro");
  const { lang } = useLanguage();
  const t = landingTranslations[lang].docsPage;

  const sidebarGroups = [
    {
      title: t.sidebar.category1,
      icon: <Cpu className="h-4 w-4" />,
      items: [
        { id: "intro", label: t.sidebar.items1.intro },
        { id: "architecture", label: t.sidebar.items1.architecture },
        { id: "security", label: t.sidebar.items1.security },
      ]
    },
    {
      title: t.sidebar.category2,
      icon: <Code2 className="h-4 w-4" />,
      items: [
        { id: "vanilla", label: t.sidebar.items2.vanilla },
        { id: "react", label: t.sidebar.items2.react },
        { id: "vue", label: t.sidebar.items2.vue },
      ]
    },
    {
      title: t.sidebar.category3,
      icon: <Settings2 className="h-4 w-4" />,
      items: [
        { id: "config", label: t.sidebar.items3.config },
        { id: "callbacks", label: t.sidebar.items3.callbacks },
        { id: "css", label: t.sidebar.items3.css },
      ]
    }
  ];

  const activeContent = t.content[activeTab];

  return (
    <main className="relative min-h-screen bg-[#080808] text-white selection:bg-lime-400 selection:text-black">
      <NoiseOverlay />
      <Navbar />

      <div className="mx-auto flex max-w-7xl pt-24 md:pt-32">
        {/* Sidebar */}
        <aside className="sticky top-24 hidden h-[calc(100vh-6rem)] w-64 flex-col gap-8 overflow-y-auto border-r border-neutral-800 pr-6 text-sm md:flex scrollbar-hide">
          {sidebarGroups.map((group, idx) => (
            <div key={idx}>
              <h4 className="mb-4 flex items-center gap-2 font-semibold text-white uppercase tracking-wider text-xs">
                <span className="text-lime-400">{group.icon}</span>
                {group.title}
              </h4>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveTab(item.id as SectionKey)}
                      className={`w-full rounded-md px-3 py-2 text-left transition-colors ${
                        activeTab === item.id 
                          ? "bg-lime-400/10 text-lime-400 font-medium" 
                          : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="mt-8 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 p-4 border border-neutral-700">
            <ShieldCheck className="mb-2 h-6 w-6 text-lime-400" />
            <div className="text-xs font-medium text-white mb-1">Остались вопросы?</div>
            <div className="text-[11px] text-neutral-400">Напишите нам в поддержку, мы отвечаем за 5 минут.</div>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 px-6 pb-24 md:pl-16">
          <div className="max-w-3xl">
            {/* Header / Intro (Visible universally above tabs) */}
            <div className="mb-12 border-b border-neutral-800 pb-12">
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 text-4xl font-bold tracking-tight md:text-5xl"
              >
                {t.title}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-neutral-400"
              >
                {t.desc}
              </motion.p>
            </div>

            {/* Dynamic Content Area with Animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-6 w-1.5 bg-lime-400 rounded-full" />
                  <h2 className="text-3xl font-bold text-white">{activeContent?.title}</h2>
                </div>
                
                <p className="mb-8 text-[17px] leading-relaxed text-neutral-300">
                  {activeContent?.body}
                </p>

                {activeContent?.code && (
                  <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#0d0d0d] shadow-2xl">
                    <div className="flex items-center gap-2 border-b border-neutral-800 bg-[#111] px-4 py-3">
                      <div className="h-3 w-3 rounded-full bg-red-500/80" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                      <div className="h-3 w-3 rounded-full bg-green-500/80" />
                      <span className="ml-4 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                        {activeTab === 'vanilla' ? 'index.html' : activeTab === 'react' ? 'layout.tsx' : activeTab === 'vue' ? 'nuxt.config.ts' : 'script.js'}
                      </span>
                    </div>
                    <div className="p-6 overflow-x-auto">
                      <pre className="text-sm font-mono text-neutral-300">
                        <code className="language-js">{activeContent.code}</code>
                      </pre>
                    </div>
                  </div>
                )}

                {/* Optional Configuration Table if tab is Config */}
                {activeTab === "config" && (
                  <div className="mt-12 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
                          <th className="px-6 py-4 font-medium">Ключ</th>
                          <th className="px-6 py-4 font-medium">Тип</th>
                          <th className="px-6 py-4 font-medium">Значение</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800 text-neutral-300">
                        <tr>
                          <td className="px-6 py-4 font-mono text-lime-400">locale</td>
                          <td className="px-6 py-4 font-mono text-neutral-500">&quot;ru&quot; | &quot;kz&quot; | &quot;en&quot;</td>
                          <td className="px-6 py-4">Язык интерфейса по умолчанию. (Default: kz)</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 font-mono text-lime-400">position</td>
                          <td className="px-6 py-4 font-mono text-neutral-500">&quot;left&quot; | &quot;right&quot;</td>
                          <td className="px-6 py-4">Позиция виджета на экране (Default: right).</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 font-mono text-lime-400">theme</td>
                          <td className="px-6 py-4 font-mono text-neutral-500">&quot;light&quot; | &quot;dark&quot; | &quot;auto&quot;</td>
                          <td className="px-6 py-4">Принудительная тема виджета. (Default: auto)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}
