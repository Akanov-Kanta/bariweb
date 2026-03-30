"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Mic, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { landingTranslations } from "@/lib/i18n/landingTranslations";

export default function ScrollTourSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { lang } = useLanguage();
  const t = landingTranslations[lang].scroll;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Calculate current active step based on scroll progress (0 to 1) 
  // 0-0.25: Step 1 (Problem)
  // 0.25-0.50: Step 2 (Scan)
  // 0.50-0.75: Step 3 (Voice/Agent)
  // 0.75-1.0: Step 4 (Result)
  const [activeStep, setActiveStep] = useState(1);

  // Read scroll continuously to trigger state changes safely
  useEffect(() => {
    return scrollYProgress.onChange((latest) => {
      if (latest < 0.25) setActiveStep(1);
      else if (latest < 0.50) setActiveStep(2);
      else if (latest < 0.75) setActiveStep(3);
      else setActiveStep(4);
    });
  }, [scrollYProgress]);

  // Scanner position matches Step 2
  const scannerY = useTransform(scrollYProgress, [0.25, 0.50], ["0%", "100%"]);
  // Step 3 progress matches typing/voice logic
  const step3Progress = useTransform(scrollYProgress, [0.50, 0.75], [0, 1]);

  // Derive typing string for IIN based on step3 progress
  const fullIIN = "010101500999";
  const [typedIIN, setTypedIIN] = useState("");
  useEffect(() => {
    return step3Progress.onChange((v) => {
      const length = Math.floor(v * fullIIN.length);
      setTypedIIN(fullIIN.substring(0, length));
    });
  }, [step3Progress]);

  const clipPathVal = useTransform(scrollYProgress, [0.25, 0.50], ["inset(0 0 100% 0)", "inset(0 0 0% 0)"]);

  const textSteps = [
    { id: 1, title: t.problem, desc: t.problemDesc, color: "text-white" },
    { id: 2, title: t.scan, desc: t.scanDesc, color: "text-white" },
    { id: 3, title: t.voice, desc: t.voiceDesc, color: "text-white" },
    { id: 4, title: t.result, desc: t.resultDesc, color: "text-lime-400" },
  ];

  return (
    <section ref={containerRef} className="relative h-[400vh] w-full bg-[#080808]">
      <div className="sticky top-0 flex h-screen w-full items-center justify-center p-6 md:p-12">
        <div className="grid h-[80vh] w-full max-w-7xl grid-cols-1 gap-8 md:grid-cols-2">
          
          {/* Left Column: Text Content using AnimatePresence to guarantee no overlap */}
          <div className="relative flex h-full flex-col justify-center">
            <AnimatePresence mode="wait">
              {textSteps.map((step) => (
                activeStep === step.id && (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-full pr-12"
                  >
                    <h2 className={`mb-4 text-4xl font-bold tracking-tight md:text-5xl ${step.color}`} 
                        dangerouslySetInnerHTML={{ __html: step.title }} 
                    />
                    <p className="text-lg text-neutral-400">
                      {step.desc}
                    </p>
                  </motion.div>
                )
              ))}
            </AnimatePresence>
          </div>

          {/* Right Column: Interactive Mockup */}
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
            
            <div className="relative h-full w-full overflow-hidden rounded-xl bg-[#EBEBEB] text-black shadow-2xl">
              
              {/* === Messy Phase (Step 1) === */}
              <div className="absolute inset-0 p-6 opacity-40">
                <div className="mb-4 flex items-center justify-between border-b-2 border-red-500 pb-2">
                  <div className="h-6 w-24 bg-red-600 px-2 font-bold text-white content-center text-xs shadow-md transform rotate-2">{t.demoUI.messyBank}</div>
                  <div className="flex gap-2 text-[10px] font-bold text-red-600 underline">
                    {t.demoUI.credits}
                  </div>
                </div>
                {/* Flashing distracting banners */}
                <div className="mb-6 h-28 w-full animate-pulse bg-gradient-to-r from-yellow-400 to-red-600 p-4 text-center border-4 border-yellow-300">
                  <h3 className="text-2xl font-black italic tracking-tighter shadow-sm">{t.demoUI.ad}</h3>
                  <p className="text-[9px] mt-1 leading-tight text-neutral-200">{t.demoUI.adSmall.repeat(5)}</p>
                </div>
                {/* Cluttered form */}
                <div className="space-y-2 mt-4">
                  <div className="h-10 border border-gray-400 bg-gray-200"></div>
                  <div className="h-10 border border-gray-400 bg-gray-200"></div>
                  <div className="h-10 bg-blue-600 opacity-50"></div>
                </div>
              </div>

              {/* === Clean Phase (Step 2, 3, 4) === */}
              <motion.div
                className="absolute inset-0 bg-neutral-50 p-8 flex flex-col"
                style={{ clipPath: clipPathVal }}
              >
                <div className="mb-8 flex items-center justify-between border-b pb-4">
                  <div className="text-xl font-bold tracking-tight text-neutral-800 flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-500 rounded-sm"></div>
                    {t.demoUI.cleanBank}
                  </div>
                  <div className="h-8 w-8 rounded-full bg-neutral-200"></div>
                </div>

                <div className="flex-1 space-y-6">
                  {/* Balance Card */}
                  <div className="w-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-1 text-sm font-medium text-neutral-500">{t.demoUI.balance}</h3>
                    <p className="text-3xl font-semibold">1 250 000 ₸</p>
                  </div>

                  {/* Payment Form (Where agent will type) */}
                  <div className="w-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-neutral-800">{t.demoUI.payTaxes}</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-neutral-500 ml-1 mb-1 block">{t.demoUI.iinTarget}</label>
                        <div className={`h-10 w-full rounded-lg border flex items-center px-3 font-mono ${activeStep >= 3 ? 'border-lime-500 bg-lime-50/50 shadow-[0_0_0_2px_rgba(200,255,0,0.2)]' : 'border-neutral-200 bg-neutral-50'}`}>
                          {typedIIN}
                          {activeStep >= 3 && typedIIN.length < fullIIN.length && (
                            <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }} className="ml-1 w-1.5 h-4 bg-lime-500 inline-block"></motion.span>
                          )}
                        </div>
                      </div>
                      <button className={`w-full rounded-xl py-3 text-sm font-semibold transition-colors ${activeStep === 4 ? 'bg-emerald-500 text-white' : 'bg-neutral-800 text-white'}`}>
                        {t.demoUI.findTarget}
                      </button>
                    </div>
                  </div>
                </div>

                {/* The Scanning Line (Visible only during Step 2) */}
                <motion.div
                  className="absolute left-0 right-0 h-[2px] w-full bg-lime-400 shadow-[0_0_20px_4px_rgba(200,255,0,0.6)] z-20"
                  style={{ top: scannerY, opacity: activeStep === 2 ? 1 : 0 }}
                />

                {/* AccessLayer Floating AI Agent Widget (Visible in Step 3 & 4) */}
                <AnimatePresence>
                  {activeStep >= 3 && (
                    <motion.div
                      initial={{ opacity: 0, y: 50, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 50 }}
                      className="absolute bottom-6 right-6 z-30 flex items-center gap-3 rounded-full border border-neutral-200 bg-white p-2 shadow-xl"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-400 text-black">
                        {activeStep === 4 ? <CheckCircle2 className="h-5 w-5" /> : <Mic className="h-5 w-5 animate-pulse" />}
                      </div>
                      <div className="pr-4">
                        <div className="text-[10px] font-bold text-lime-600 uppercase tracking-widest">AccessLayer Agent</div>
                        <div className="text-xs font-medium text-neutral-600">
                          {activeStep === 3 && typedIIN.length < fullIIN.length ? (
                            <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>{t.demoUI.voiceMic}</motion.span>
                          ) : activeStep === 3 ? (
                            <span>{t.demoUI.voiceTyping}</span>
                          ) : (
                            <span className="text-emerald-600">{t.demoUI.voiceSuccess}</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
