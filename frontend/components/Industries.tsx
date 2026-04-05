"use client";

import { motion } from "framer-motion";
import { Building2, ShoppingCart, Landmark, GraduationCap, ShieldCheck, Wifi } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function Industries() {
  const { t } = useLanguage();

  const c = t.industries.cards;
  const icons = [Building2, ShoppingCart, Landmark, GraduationCap, ShieldCheck, Wifi];
  
  const industries = c.map((card: any, i: number) => ({
    name: card.name,
    desc: card.desc,
    icon: icons[i]
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section className="py-24 bg-[#050505] relative z-10" id="industries">
      <div className="container mx-auto px-4 md:px-6">
        
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-sm font-mono tracking-widest text-zinc-500 uppercase mb-4 section-label">
            {t.industries.label}
          </h2>
          <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
            {t.industries.title}
          </h3>
          <p className="text-lg text-zinc-400">
            {t.industries.desc}
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {industries.map((ind: any, idx: number) => (
            <motion.div 
              key={idx}
              variants={itemVariants}
              className="group p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all hover:bg-zinc-800/50"
            >
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-blue-500/20">
                <ind.icon className="w-6 h-6 text-zinc-400 group-hover:text-blue-400 transition-colors" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-3 tracking-tight">{ind.name}</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">{ind.desc}</p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
