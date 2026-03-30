/* eslint-disable */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Type, Contrast, Palette, MousePointer2, Volume2, Eye, Zap, Brain, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function BariWebWidgetUI({ onClose, forceMode }: { onClose?: () => void, forceMode?: "hidden-close" }) {
  const { t } = useLanguage();
  const w = t.widget;
  const [activeTab, setActiveTab] = useState<"ru" | "profiles">("ru");
  const [openAccordion, setOpenAccordion] = useState<string>("main");

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? "" : id);
  };

  return (
    <div className="w-full max-w-[360px] bg-white rounded-[24px] shadow-2xl overflow-hidden font-sans border border-zinc-100 flex flex-col text-sm relative z-50">
      
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-black">{w.title}</h2>
        {forceMode !== "hidden-close" && (
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 transition-colors rounded-lg text-zinc-900 cursor-pointer"
            aria-label="Закрыть"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 px-6 pb-6">
        <button 
          onClick={() => setActiveTab("ru")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors cursor-pointer \${
            activeTab === "ru" ? "bg-zinc-100 text-black" : "text-zinc-500 hover:bg-zinc-50"
          }`}
        >
          <Type size={16} />
          {w.tabs.lang}
        </button>
        <button 
          onClick={() => setActiveTab("profiles")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors cursor-pointer \${
            activeTab === "profiles" ? "bg-zinc-100 text-black" : "text-zinc-500 hover:bg-zinc-50"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          {w.tabs.profiles}
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 max-h-[550px] custom-scrollbar">
        
        {/* Accordion 1: Main Features */}
        <div className="border-t border-transparent pt-2">
          <button 
            className="flex items-center justify-between w-full py-3 text-left font-bold text-[15px] text-black cursor-pointer"
            onClick={() => toggleAccordion("main")}
          >
            {w.accordions.features}
            {openAccordion === "main" ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          <AnimatePresence>
            {openAccordion === "main" && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-3 pt-2 pb-4">
                  <FeatureCard icon={<Type size={24} strokeWidth={1.5} />} label={w.features[0]} />
                  <FeatureCard icon={<Contrast size={24} strokeWidth={1.5} />} label={w.features[1]} />
                  <FeatureCard icon={<Palette size={24} strokeWidth={1.5} />} label={w.features[2]} />
                  <FeatureCard icon={<MousePointer2 size={24} strokeWidth={1.5} />} label={w.features[3]} />
                  <FeatureCard icon={<Volume2 size={24} strokeWidth={1.5} />} label={w.features[4]} />
                  <FeatureCard icon={<Eye size={24} strokeWidth={1.5} />} label={w.features[5]} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Accordion 2: Profiles */}
        <div className="border-t border-zinc-100 pt-2">
          <button 
            className="flex items-center justify-between w-full py-3 text-left font-bold text-[15px] text-black cursor-pointer"
            onClick={() => toggleAccordion("profiles")}
          >
            {w.accordions.profiles}
            <div className="flex items-center gap-2">
              {openAccordion !== "profiles" && <span className="text-[10px] bg-zinc-600 text-white px-1.5 py-0.5 rounded uppercase font-mono tracking-wide">{w.accordions.features}</span>}
              {openAccordion === "profiles" ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>
          
          <AnimatePresence>
            {openAccordion === "profiles" && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-3 pt-2 pb-4">
                  <ProfileCard icon={<Zap size={22} strokeWidth={1.5} />} label={w.profileBlocks[0]} />
                  <ProfileCard icon={<Brain size={22} strokeWidth={1.5} />} label={w.profileBlocks[1]} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Accordion 3: How it works */}
        <div className="border-t border-zinc-100 pt-2">
          <button 
            className="flex items-center justify-between w-full py-3 text-left font-bold text-[15px] text-black cursor-pointer"
            onClick={() => toggleAccordion("how")}
          >
            {w.accordions.howItWorks}
            {openAccordion === "how" ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          <AnimatePresence>
            {openAccordion === "how" && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="text-zinc-600 leading-relaxed pb-4 pt-1">
                  {w.howItWorksDesc}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Accordion 4: About Us */}
        <div className="border-t border-zinc-100 pt-2">
          <button 
            className="flex items-center justify-between w-full py-3 text-left font-bold text-[15px] text-black cursor-pointer"
            onClick={() => toggleAccordion("about")}
          >
            {w.accordions.about}
            {openAccordion === "about" ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

      </div>

      {/* Footer */}
      <div className="border-t border-zinc-100 p-6 flex items-center justify-between bg-white text-zinc-500 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-zinc-600">
          <div className="w-5 h-5 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM21 9h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/>
            </svg>
          </div>
          BariWeb
        </div>
        <div>
          Сделано в Казахстане 🇰🇿
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 transition-all text-zinc-700 cursor-pointer">
      <div className="text-zinc-800">
        {icon}
      </div>
      <span className="font-medium text-xs text-center">{label}</span>
    </button>
  );
}

function ProfileCard({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 transition-all text-zinc-700 text-left cursor-pointer">
      <div className="text-zinc-800">
        {icon}
      </div>
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}
