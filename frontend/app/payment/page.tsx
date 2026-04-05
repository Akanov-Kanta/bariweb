"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { landingTranslations } from "@/lib/i18n/landingTranslations";
import Navbar from "@/components/sections/Navbar";
import NoiseOverlay from "@/components/ui/NoiseOverlay";
import MagneticButton from "@/components/ui/MagneticButton";
import { CheckCircle2, CreditCard, ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PaymentPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const t = landingTranslations[lang].paymentPage;

  useEffect(() => {
    const status = localStorage.getItem("subscription_status");
    const isDev = process.env.NODE_ENV === 'development';
    if (status === "active" || isDev) {
      if (isDev && !status) {
        localStorage.setItem("subscription_status", "active");
        localStorage.setItem("subscription_plan", "pro");
      }
      setTimeout(() => router.push("/dashboard"), 100);
    }
  }, [router]);

  type PlanType = "freemium" | "lite" | "starter" | "business" | "enterprise" | "enterprisePremium";
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("business");
  const [isAnnual, setIsAnnual] = useState(true);
  const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");

  const plans: Record<PlanType, { name: string; price: number | string }> = {
    freemium: { name: "Freemium", price: 0 },
    lite: { name: "Lite", price: 99 },
    starter: { name: "Starter", price: 299 },
    business: { name: "Business", price: 1200 },
    enterprise: { name: "Enterprise", price: 3500 },
    enterprisePremium: { name: "Ent. Premium", price: "6000+" }
  };

  const getPrice = (planPrice: number | string) => {
    if (typeof planPrice === 'string') return planPrice; // e.g. "6000+"
    if (planPrice === 0) return 0;
    return isAnnual ? Math.floor(planPrice * 0.8) * 12 : planPrice;
  };

  const currentPriceRaw = getPrice(plans[selectedPlan].price);
  const currentPriceDisplay = typeof currentPriceRaw === 'number' 
    ? `$${currentPriceRaw.toLocaleString()}` 
    : `$${currentPriceRaw}`;

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("processing");
    setTimeout(() => {
      localStorage.setItem("subscription_status", "active");
      localStorage.setItem("subscription_plan", selectedPlan);
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

      <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-16 px-6 pb-24 pt-32 lg:flex-row lg:items-start lg:gap-24 lg:px-12 lg:pt-48">
        
        {/* Left: Content & Strategy */}
        <div className="flex-1 lg:max-w-3xl">
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

            {/* Plan Cards - Bento 3x2 Grid */}
            <div className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(["freemium", "lite", "starter", "business", "enterprise", "enterprisePremium"] as const).map((plan) => {
                const planData = plans[plan];
                const isSelected = selectedPlan === plan;
                return (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={`group relative flex flex-col items-start overflow-hidden rounded-2xl border p-5 transition-all duration-500 sm:p-6 ${
                      isSelected 
                      ? "border-lime-400 bg-lime-400/5 shadow-[0_0_30px_-10px_rgba(200,255,0,0.2)]" 
                      : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
                    }`}
                  >
                    {/* Active highlight glow behind button content */}
                    {isSelected && (
                      <div className="absolute inset-0 z-0 bg-gradient-to-br from-lime-400/10 to-transparent pointer-events-none" />
                    )}
                    
                    <div className="relative z-10 w-full text-left">
                      <span className={`mb-2 block text-[10px] font-bold uppercase tracking-widest sm:text-xs ${isSelected ? 'text-lime-400' : 'text-neutral-500'}`}>
                        {planData.name}
                      </span>
                      <span className={`block text-lg font-black transition-colors sm:text-2xl ${plan === 'freemium' ? 'text-white' : 'text-white'}`}>
                        {typeof planData.price === 'number' && planData.price === 0 ? 'Free' : `$${planData.price}`}
                      </span>
                      <span className="mt-1 block text-[10px] text-neutral-500 font-medium">
                        {plan === 'freemium' ? 'Up to 5k' : plan === 'lite' ? 'Up to 15k' : plan === 'starter' ? 'Up to 50k' : plan === 'business' ? 'Up to 500k' : 'Unlimited'}
                      </span>
                    </div>

                    {isSelected && (
                      <motion.div
                        layoutId="activePlanMarker"
                        className="absolute right-3 top-3 text-lime-400"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </motion.div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Billing Toggle */}
            <div className="flex w-fit items-center gap-6 rounded-3xl border border-neutral-800 bg-neutral-900/30 p-2 pl-6">
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
              <div className="flex flex-col pr-4">
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
                      Welcome to Bariweb. Your subscription is now active!
                    </p>
                    <div onClick={() => router.push('/dashboard')} className="w-full cursor-pointer relative overflow-hidden group rounded-2xl bg-white focus:outline-none">
                      <MagneticButton className="flex w-full items-center justify-center gap-2 py-5 font-bold text-black transition-transform group-hover:scale-[1.02]">
                        Enter Dashboard <ArrowRight className="h-5 w-5" />
                      </MagneticButton>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                    onSubmit={handlePayment}
                    className="flex flex-col min-h-[440px]"
                  >
                    <div className="mb-8 flex items-center justify-between border-b border-neutral-800/50 pb-8">
                       <div className="flex flex-col">
                         <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">{t.billingInfo}</span>
                         <span className="text-xl font-bold">Total: {currentPriceDisplay}</span>
                       </div>
                       <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-800 shadow-inner">
                         <CreditCard className="h-6 w-6 text-neutral-400" />
                       </div>
                    </div>

                    <div className="space-y-6">
                      <div className="group">
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-neutral-500 transition-colors group-focus-within:text-lime-400">{t.name}</label>
                        <input 
                          required={selectedPlan !== 'freemium'}
                          type="text" 
                          placeholder="Jane Doe" 
                          className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/50 px-5 py-4 text-sm text-white placeholder-neutral-600 outline-none transition-all focus:border-lime-400 focus:bg-neutral-900 focus:ring-1 focus:ring-lime-400/20 disabled:opacity-50"
                          disabled={selectedPlan === 'freemium'}
                        />
                      </div>

                      <div className="group">
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-neutral-500 transition-colors group-focus-within:text-lime-400">{t.cardNum}</label>
                        <input 
                          required={selectedPlan !== 'freemium'}
                          type="text" 
                          placeholder="0000 0000 0000 0000" 
                          maxLength={19}
                          className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/50 px-5 py-4 text-sm font-mono text-white placeholder-neutral-600 outline-none transition-all focus:border-lime-400 focus:bg-neutral-900 focus:ring-1 focus:ring-lime-400/20 disabled:opacity-50"
                          disabled={selectedPlan === 'freemium'}
                        />
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-1 group">
                          <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-neutral-500 transition-colors group-focus-within:text-lime-400">{t.expiry}</label>
                          <input 
                            required={selectedPlan !== 'freemium'}
                            type="text" 
                            placeholder="MM/YY" 
                            maxLength={5}
                            className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/50 px-5 py-4 text-sm font-mono text-white placeholder-neutral-600 outline-none transition-all focus:border-lime-400 focus:bg-neutral-900 focus:ring-1 focus:ring-lime-400/20 disabled:opacity-50"
                            disabled={selectedPlan === 'freemium'}
                          />
                        </div>
                        <div className="flex-1 group">
                          <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-neutral-500 transition-colors group-focus-within:text-lime-400">{t.cvc}</label>
                          <input 
                            required={selectedPlan !== 'freemium'}
                            type="text" 
                            placeholder="123" 
                            maxLength={4}
                            className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/50 px-5 py-4 text-sm font-mono text-white placeholder-neutral-600 outline-none transition-all focus:border-lime-400 focus:bg-neutral-900 focus:ring-1 focus:ring-lime-400/20 disabled:opacity-50"
                            disabled={selectedPlan === 'freemium'}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8">
                      <button disabled={status === "processing"} type="submit" className="w-full relative outline-none h-14 rounded-2xl bg-lime-400">
                         <div className="absolute inset-0 rounded-2xl bg-lime-400 shadow-[0_0_20px_rgba(200,255,0,0.3)] transition-all hover:bg-lime-500 peer-disabled:bg-neutral-700" />
                         <div className="relative z-10 flex w-full h-full items-center justify-center font-extrabold text-black uppercase tracking-widest text-xs">
                          {status === "processing" ? (
                            <span className="flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin" /> {t.processing}</span>
                          ) : (
                            <span className="flex items-center gap-2">{selectedPlan === 'freemium' ? 'Activate Free' : t.payBtn} <ArrowRight className="h-5 w-5" /></span>
                          )}
                         </div>
                      </button>
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
