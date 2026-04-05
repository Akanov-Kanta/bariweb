"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { landingTranslations } from "@/lib/i18n/landingTranslations";
import Navbar from "@/components/sections/Navbar";
import NoiseOverlay from "@/components/ui/NoiseOverlay";
import MagneticButton from "@/components/ui/MagneticButton";
import { CheckCircle2, CreditCard, ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PaymentPage() {
  const { lang } = useLanguage();
  const t = landingTranslations[lang].paymentPage;

  const [selectedPlan, setSelectedPlan] = useState<"lite" | "starter" | "business" | "enterprise">("business");
  const [isAnnual, setIsAnnual] = useState(true);
  const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");

  const plans = {
    lite: { name: "Lite", price: 99 },
    starter: { name: "Starter", price: 299 },
    business: { name: "Business", price: 1200 },
    enterprise: { name: "Enterprise", price: 3500 }
  };

  const currentPrice = isAnnual 
    ? Math.floor(plans[selectedPlan].price * 0.8) * 12 
    : plans[selectedPlan].price;

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("processing");
    setTimeout(() => {
      setStatus("success");
    }, 2500);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080808] text-white selection:bg-lime-400 selection:text-black">
      <NoiseOverlay />
      <Navbar />

      {/* Abstract Background Effect */}
      <div className="absolute left-1/2 top-1/2 -z-10 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 opacity-10">
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 20, 0],
            borderRadius: ["30% 70% 70% 30% / 30% 30% 70% 70%", "70% 30% 30% 70% / 70% 70% 30% 30%", "30% 70% 70% 30% / 30% 30% 70% 70%"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="h-full w-full bg-gradient-to-br from-lime-400 to-[#003311] blur-[80px]"
        />
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center gap-16 px-6 pb-24 pt-32 lg:flex-row lg:items-start lg:px-12 lg:pt-48">
        
        {/* Left: Content & Strategy */}
        <div className="flex-1 lg:max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="mb-6 text-5xl font-extrabold tracking-tighter md:text-7xl">
              {t.title}
            </h1>
            <p className="mb-12 max-w-xl text-xl leading-relaxed text-neutral-400">
              {t.desc}
            </p>

            {/* Plan Cards - Horizontal Selector */}
            <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-4">
              {(["lite", "starter", "business", "enterprise"] as const).map((plan) => (
                <button
                  key={plan}
                  onClick={() => setSelectedPlan(plan)}
                  className={`group relative flex flex-col items-start rounded-2xl border p-6 transition-all duration-500 ${
                    selectedPlan === plan 
                    ? "border-lime-400 bg-lime-400/5 shadow-[0_0_30px_-10px_rgba(200,255,0,0.2)]" 
                    : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
                  }`}
                >
                  <span className={`mb-1 text-xs font-bold uppercase tracking-widest ${selectedPlan === plan ? 'text-lime-400' : 'text-neutral-500'}`}>
                    {plan}
                  </span>
                  <span className="text-xl font-bold text-white transition-colors">
                    ${plans[plan].price}
                  </span>
                  {selectedPlan === plan && (
                    <motion.div
                      layoutId="activePlan"
                      className="absolute bottom-2 right-4 text-lime-400"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center gap-6 rounded-3xl border border-neutral-800 bg-neutral-900/30 p-2 pl-6">
              <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-white' : 'text-neutral-500'}`}>
                {landingTranslations[lang].paymentPage.monthly}
              </span>
              <button 
                type="button"
                onClick={() => setIsAnnual(!isAnnual)}
                className={`group relative flex h-10 w-20 items-center rounded-full p-1 transition-colors ${isAnnual ? 'bg-lime-400' : 'bg-neutral-800'}`}
              >
                <motion.div 
                  className={`h-8 w-8 rounded-full shadow-lg ${isAnnual ? 'bg-black' : 'bg-neutral-500'}`}
                  animate={{ x: isAnnual ? 40 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
              <div className="flex flex-col">
                <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-lime-400' : 'text-neutral-500'}`}>
                  {landingTranslations[lang].paymentPage.annual}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-lime-400 opacity-80">
                  {t.save20}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Checkout Card */}
        <div className="w-full lg:max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* Glow effect behind the card */}
            <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-br from-lime-400/20 to-transparent blur-2xl" />
            
            <div className="relative overflow-hidden rounded-[2rem] border border-neutral-800 bg-[#0c0c0c]/80 p-8 shadow-2xl backdrop-blur-2xl">
              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex h-full min-h-[440px] flex-col items-center justify-center text-center"
                  >
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                      className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-lime-400/10"
                    >
                      <CheckCircle2 className="h-12 w-12 text-lime-400" />
                    </motion.div>
                    <h3 className="mb-4 text-3xl font-bold tracking-tight">{t.success}</h3>
                    <p className="mb-10 text-neutral-400">
                      Мы отправили квитанцию и инструкции по установке на ваш email.
                    </p>
                    <Link href="/dashboard" className="w-full">
                      <MagneticButton className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-5 font-bold text-black transition-transform hover:scale-[1.02]">
                        Go to Dashboard <ArrowRight className="h-5 w-5" />
                      </MagneticButton>
                    </Link>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                    onSubmit={handlePayment}
                    className="flex flex-col"
                  >
                    <div className="mb-8 flex items-center justify-between border-b border-neutral-800/50 pb-8">
                       <div className="flex flex-col">
                         <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">{t.billingInfo}</span>
                         <span className="text-xl font-bold">Total: ${currentPrice.toLocaleString()}</span>
                       </div>
                       <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-800">
                         <CreditCard className="h-6 w-6 text-neutral-400" />
                       </div>
                    </div>

                    <div className="space-y-6">
                      <div className="group">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-500 transition-colors group-focus-within:text-lime-400">{t.name}</label>
                        <input 
                          required
                          type="text" 
                          placeholder="Jane Doe" 
                          className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/50 px-5 py-4 text-sm text-white placeholder-neutral-600 outline-none transition-all focus:border-lime-400 focus:bg-neutral-900 focus:ring-1 focus:ring-lime-400/20"
                        />
                      </div>

                      <div className="group">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-500 transition-colors group-focus-within:text-lime-400">{t.cardNum}</label>
                        <input 
                          required
                          type="text" 
                          placeholder="0000 0000 0000 0000" 
                          maxLength={19}
                          className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/50 px-5 py-4 text-sm font-mono text-white placeholder-neutral-600 outline-none transition-all focus:border-lime-400 focus:bg-neutral-900 focus:ring-1 focus:ring-lime-400/20"
                        />
                      </div>

                      <div className="flex gap-6">
                        <div className="flex-1 group">
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-500 transition-colors group-focus-within:text-lime-400">{t.expiry}</label>
                          <input 
                            required
                            type="text" 
                            placeholder="MM/YY" 
                            maxLength={5}
                            className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/50 px-5 py-4 text-sm font-mono text-white placeholder-neutral-600 outline-none transition-all focus:border-lime-400 focus:bg-neutral-900 focus:ring-1 focus:ring-lime-400/20"
                          />
                        </div>
                        <div className="flex-1 group">
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-500 transition-colors group-focus-within:text-lime-400">{t.cvc}</label>
                          <input 
                            required
                            type="text" 
                            placeholder="123" 
                            maxLength={4}
                            className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/50 px-5 py-4 text-sm font-mono text-white placeholder-neutral-600 outline-none transition-all focus:border-lime-400 focus:bg-neutral-900 focus:ring-1 focus:ring-lime-400/20"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-10">
                      <MagneticButton 
                        intensity={15}
                        disabled={status === "processing"}
                        type="submit" 
                        className="flex w-full items-center justify-center rounded-2xl bg-lime-400 py-5 font-extrabold text-black transition-transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
                      >
                        {status === "processing" ? (
                          <span className="flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin" /> {t.processing}</span>
                        ) : (
                          <span className="flex items-center gap-2">{t.payBtn} <ArrowRight className="h-5 w-5" /></span>
                        )}
                      </MagneticButton>
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                      <ShieldCheck className="h-4 w-4" />
                      <span>{t.secureMessage}</span>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

      </div>
    </main>
  );
}
