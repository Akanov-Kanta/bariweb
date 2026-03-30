/* eslint-disable */
"use client"
import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Phone, User, CheckCircle2, Mic } from 'lucide-react'
import { BariWebWidgetUI } from './BariWebWidgetUI'
import { useLanguage } from '@/lib/i18n/LanguageContext'

// Global stages definition for scroll tracking
const STAGES = [
  { threshold: 0,    id: 'stage0', compliance: false },
  { threshold: 0.18, id: 'stage1', compliance: false },
  { threshold: 0.38, id: 'stage2', compliance: false },
  { threshold: 0.58, id: 'stage3', compliance: false },
  { threshold: 0.78, id: 'stage4', compliance: false },
  { threshold: 1.0,  id: 'stage5', compliance: true  },
]

export function ScrollTransformSection() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const [progress, setProgress] = useState(shouldReduceMotion ? 1 : 0)
  const [stage, setStage] = useState(shouldReduceMotion ? 5 : 0)

  // Hydrate stage labels from i18n
  const stagesWithLabels = STAGES.map((s, i) => ({
    ...s,
    label: t.scrollTransform.stages[i]
  }));

  useEffect(() => {
    // If reduced motion is preferred, we skip the 500vh scroll effect
    if (shouldReduceMotion) return

    const handleScroll = () => {
      const el = sectionRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      // Total scrollable area inside the 500vh container
      const totalScroll = el.offsetHeight - window.innerHeight
      const scrolled = -rect.top
      const p = Math.max(0, Math.min(1, scrolled / totalScroll))
      setProgress(p)
      
      let s = 0
      for (let i = STAGES.length - 1; i >= 0; i--) {
        if (p >= STAGES[i].threshold) { s = i; break }
      }
      setStage(s)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    // Initial calculation
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [shouldReduceMotion])

  // If prefers-reduced-motion, render a static block instead of 500vh
  if (shouldReduceMotion) {
    return (
      <div className="py-24 bg-[#0a0a0f] relative overflow-hidden">
        <div className="container mx-auto px-4 z-10 relative">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              [ SCROLL TRANSFORM DISABLED ]
            </h2>
            <p className="text-zinc-400">Мы уважаем ваши настройки уменьшения движения (prefers-reduced-motion).</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-[#0d0d14] p-8 max-w-4xl mx-auto shadow-2xl">
            <BrowserMockup stage={5} progress={1} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={sectionRef} style={{ height: '500vh', position: 'relative' }} className="w-full bg-[#05050a] border-t border-zinc-900/50">
      {/* Sticky inner */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        
        {/* Scanlines inside sticky viewport */}
        <div className="absolute inset-0 z-0 pointer-events-none mix-blend-overlay opacity-30">
          <div className="scanlines absolute inset-0" />
        </div>

        {/* Global texts layout */}
        <div className="absolute top-1/2 left-4 md:left-12 -translate-y-1/2 w-[250px] lg:w-[350px] z-20 pointer-events-none">
          <div className="text-blue-500 font-mono text-xs tracking-widest uppercase mb-6">
            {t.scrollTransform.label}
          </div>
          <h2 className="text-4xl md:text-5xl font-syne font-bold leading-[1.1] mb-6 text-white text-glow">
            {t.scrollTransform.title1}<br/>
            <span data-text={t.scrollTransform.title2} className="glitch-word text-cyan-400">{t.scrollTransform.title2}</span> {t.scrollTransform.title3}
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed bg-[#05050a]/80 backdrop-blur-sm p-4 rounded-xl border border-zinc-800/50">
            {t.scrollTransform.desc}
          </p>
        </div>

        {/* Stage label (Top Right) */}
        <div className={`absolute top-8 right-8 z-30 font-mono text-[10px] md:text-xs uppercase tracking-widest pl-4 pr-1 py-1 border-l-2 \${
          stage === 5 ? 'border-green-500 text-green-400' : 'border-blue-500 text-blue-400'
        } bg-black/40 backdrop-blur-md`}>
          {stagesWithLabels[stage].label}
          <span className="blink-cursor ml-1"></span>
        </div>
        
        {/* Progress bar (Right edge) */}
        <div className="absolute right-0 top-0 w-1 lg:w-2 h-full bg-zinc-900 z-30">
          <div 
            className={`w-full transition-all duration-75 \${stage === 5 ? 'bg-green-500' : 'bg-blue-500 glow-blue'}`} 
            style={{ height: `\${progress * 100}%` }} 
          />
        </div>

        {/* Browser Mockup centered offset to right slightly */}
        <div className="w-[90%] md:w-[700px] absolute right-4 md:right-16 lg:right-32 top-1/2 -translate-y-1/2 z-10">
          <BrowserMockup stage={stage} progress={progress} />
        </div>

      </div>
    </div>
  )
}

function BrowserMockup({ stage, progress }: { stage: number, progress: number }) {
  const { t } = useLanguage();
  const c = t.scrollTransform.mockup;
  
  const isStage1 = stage >= 1 // ARIA
  const isStage2 = stage >= 2 // Contrast
  const isStage3 = stage >= 3 // Remove noise (Widget Appears)
  const isStage4 = stage >= 4 // Simulation Sequence Start
  const isStage5 = stage >= 5 // Compliance

  const [demoStep, setDemoStep] = useState(0);

  useEffect(() => {
    if (!isStage4) {
      setTimeout(() => setDemoStep(0), 0);
      return;
    }
    const intervals: NodeJS.Timeout[] = [];
    intervals.push(setTimeout(() => setDemoStep(1), 500));  // Step 1
    intervals.push(setTimeout(() => setDemoStep(2), 2500)); // Step 2
    intervals.push(setTimeout(() => setDemoStep(3), 4500)); // Step 3
    intervals.push(setTimeout(() => setDemoStep(4), 6500)); // Step 4
    intervals.push(setTimeout(() => setDemoStep(5), 8500)); // Step 5

    return () => intervals.forEach(i => clearTimeout(i));
  }, [isStage4]);

  const getDialogText = () => {
    switch (demoStep) {
      case 1: return c.dialogs.step1;
      case 2: return c.dialogs.step2;
      case 3: return c.dialogs.step3;
      case 4: return c.dialogs.step4;
      case 5: return c.dialogs.step5;
      default: return "";
    }
  };

  return (
    <motion.div 
      className={`relative w-full rounded-2xl border transition-all duration-500 overflow-hidden bg-[#fafafa] \${
        isStage3 ? 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.1)]' : 'border-zinc-300 shadow-2xl'
      }`}
      style={{ perspective: 1000 }}
    >
      {/* Browser Bar */}
      <div className="h-10 border-b border-zinc-200 bg-zinc-100 flex items-center px-4 gap-2">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-amber-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
        <div className="mx-auto bg-white border border-zinc-200 rounded-md text-[10px] sm:text-xs text-zinc-500 font-mono px-3 pt-1 pb-0.5 flex items-center gap-2 transition-all duration-300">
          <LockIcon />
          bank.kz/pay
          {isStage3 && <span className="ml-2 px-1.5 rounded-sm bg-blue-100 text-blue-700 text-[9px] font-bold tracking-wider">✦ AccessLayer</span>}
        </div>
      </div>

      {/* Browser Body (Kaspi-like Fake UI) */}
      <div className={`p-6 relative min-h-[400px] transition-colors duration-500 \${isStage2 ? 'bg-white' : 'bg-zinc-50'}`}>
        
        {/* Header / Nav */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all \${isStage2 ? 'bg-blue-600' : 'bg-[#f14635]'}`}>b.</div>
            <span className={`font-bold transition-all \${isStage2 ? 'text-zinc-900 text-lg' : 'text-zinc-700 text-base'}`}>
              {c.headerName}
            </span>
          </div>
          <div className="flex gap-4">
            <button 
              aria-label={isStage1 ? c.phoneLabel : undefined}
              className={`flex flex-col items-center gap-1 transition-all duration-300 \${
                isStage1 ? 'text-blue-600 scale-105' : 'text-zinc-400 opacity-60 scale-95'
              }`}
            >
              <Phone size={isStage1 ? 16 : 14} />
              <span className={`text-[10px] \${isStage1 ? 'font-medium' : ''}`}>{c.phoneText}</span>
            </button>
            <button 
              aria-label={isStage1 ? c.userLabel : undefined}
              className={`flex flex-col items-center gap-1 transition-all duration-300 \${
                isStage1 ? 'text-blue-600 scale-105' : 'text-zinc-400 opacity-60 scale-95'
              }`}
            >
              <User size={isStage1 ? 16 : 14} />
              <span className={`text-[10px] \${isStage1 ? 'font-medium' : ''}`}>{c.userText}</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          {/* Main Form Area */}
          <div className="sm:col-span-2 space-y-6">
            <div>
              <h1 className={`font-bold mb-2 transition-all duration-300 \${isStage2 ? 'text-3xl text-zinc-900' : 'text-2xl text-zinc-700'}`}>
                {c.serviceTitle}
              </h1>
              <p className={`text-sm transition-all duration-300 \${isStage2 ? 'text-zinc-600 font-medium' : 'text-zinc-400 opacity-50'}`}>
                {c.serviceDesc}
              </p>
            </div>

            <div className="space-y-4 pt-4 relative">
              <div>
                <label className={`block text-xs mb-1 transition-all \${isStage2 ? 'text-zinc-800 font-bold' : 'text-zinc-400'}`}>{c.inputIdLabel}</label>
                <input 
                  type="text" 
                  readOnly
                  value={demoStep >= 4 ? "010203405060" : ""}
                  className={`w-full border rounded-md p-2 outline-none transition-all \${isStage2 ? 'border-zinc-400 bg-white placeholder:text-zinc-400' : 'border-zinc-200 bg-zinc-100 placeholder:text-zinc-300'}`}
                  placeholder="000000000000"
                />
                
                {demoStep >= 4 && demoStep < 5 && (
                  <motion.div 
                    className="absolute right-4 top-[50%] -translate-y-1/2 text-blue-500 text-sm font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {c.autofillText}
                  </motion.div>
                )}
              </div>
              
              <div className="pt-4 relative">
                <button 
                  className={`w-full sm:w-auto font-medium transition-all duration-500 \${
                    isStage4 
                      ? 'bg-blue-600 text-white rounded-lg px-8 py-3 shadow-[0_4px_20px_rgba(37,99,235,0.4)] hover:bg-blue-700 transform hover:-translate-y-0.5' 
                      : 'bg-[#f14635] text-white/90 rounded-sm px-6 py-2 shadow-none'
                  }`}
                >
                  {c.btnSubmit}
                </button>
                
                {/* Highlight box during simulation step 3 */}
                {demoStep >= 3 && demoStep < 4 && (
                  <motion.div 
                    layoutId="cursor-target"
                    className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Ad Banners Column (To be removed at stage 3) */}
          <motion.div 
            initial={false}
            animate={{ 
              opacity: isStage3 ? 0 : 1,
              maxHeight: isStage3 ? 0 : 500,
              scale: isStage3 ? 0.9 : 1
            }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="space-y-4 overflow-hidden"
          >
            <div className="bg-gradient-to-br from-yellow-100 to-amber-50 p-4 border border-yellow-200 rounded-md relative text-center">
              <span className="absolute top-1 right-2 text-[8px] text-zinc-400 uppercase">Реклама</span>
              <div className="text-2xl mb-1">🎁🎰</div>
              <h4 className="font-bold text-sm text-yellow-800">Кредит без переплат!</h4>
              <p className="text-[10px] text-yellow-700/80 mt-1">Оформи сейчас и получи бонус 5000 ₸. Жми сюда срочно!!!</p>
            </div>

            <div className="bg-gradient-to-br from-purple-100 to-pink-50 p-4 border border-purple-200 rounded-md relative text-center">
              <span className="absolute top-1 right-2 text-[8px] text-zinc-400 uppercase">Реклама</span>
              <h4 className="font-bold text-sm text-purple-800 line-through">Цена: 9000 ₸</h4>
              <h4 className="font-black text-lg text-red-600 animate-pulse">Сейчас: 400 ₸ 🔥</h4>
              <p className="text-[10px] text-purple-700/80 mt-1">Купи подписку на фильмы и музыку.</p>
            </div>
          </motion.div>

        </div>

        {/* Voice AI Panel Simulation during Stage 4 */}
        <AnimatePresence>
          {isStage4 && demoStep > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-[60px] left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-zinc-900 border border-blue-500/30 rounded-full p-2 pr-6 shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center gap-4 z-20 overflow-hidden backdrop-blur-md"
            >
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                <Mic className="text-white w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 overflow-hidden min-w-0">
                <p className="text-blue-100 text-xs sm:text-sm font-medium truncate">
                  {getDialogText()}
                </p>
              </div>
              {demoStep >= 5 && (
                <motion.button 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer"
                >
                  ДА
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Authentic BariWeb Widget UI Overlay inside Mockup when Stage >= 3 */}
        <AnimatePresence>
          {isStage3 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.2 }}
              className="absolute top-4 right-4 z-40 origin-top-right drop-shadow-2xl"
            >
              <div className="scale-75 md:scale-90 lg:scale-100 origin-top-right">
                <BariWebWidgetUI onClose={() => {}} forceMode="hidden-close" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Footer Status Bar overlay */}
      <div className={`bottom-0 left-0 right-0 p-2 sm:p-3 transition-colors duration-500 flex items-center justify-between z-30 relative \${
        isStage5 ? 'bg-green-600 text-white' : 'bg-red-500/10 text-red-600 border-t border-red-200'
      }`}>
        <div className="text-[10px] sm:text-xs font-mono font-medium flex items-center gap-2">
          {isStage5 ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {isStage5 
            ? '✓ WCAG 2.1 AA · Цифровой кодекс РК 2026 — СООТВЕТСТВУЕТ' 
            : 'WCAG: НЕ СООТВЕТСТВУЕТ · РИСК ШТРАФА ↑'
          }
        </div>
        {isStage5 && (
          <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse hidden sm:block" />
        )}
      </div>

      {/* Cyberpunk Glitch overlay during Stage transitions */}
      <motion.div 
        className="absolute inset-0 pointer-events-none mix-blend-screen bg-cyan-400 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: (progress * 100) % 20 < 1 && progress > 0.05 && progress < 0.95 ? 0.15 : 0 }}
        transition={{ duration: 0.1 }}
      />
    </motion.div>
  )
}

function LockIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
