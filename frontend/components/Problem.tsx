"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { CalendarClock, Users, AlertTriangle, ShieldX } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function Problem() {
  const { t } = useLanguage();

  const icons = [
    <CalendarClock key="1" className="w-8 h-8 text-blue-500 mb-4" />,
    <Users key="2" className="w-8 h-8 text-cyan-500 mb-4" />,
    <AlertTriangle key="3" className="w-8 h-8 text-red-500 mb-4" />,
    <ShieldX key="4" className="w-8 h-8 text-purple-500 mb-4" />
  ];

  const classNames = [
    "md:col-span-2 md:row-span-1 bg-gradient-to-br from-zinc-900 to-black border-zinc-800",
    "md:col-span-1 md:row-span-2 bg-zinc-950 border-zinc-800 flex flex-col justify-between",
    "md:col-span-1 md:row-span-1 bg-black border-zinc-800",
    "md:col-span-1 md:row-span-1 bg-zinc-950 border-zinc-800"
  ];

  const bentoItems = t.problem.cards.map((card: any, i: number) => ({
    title: card.title,
    description: card.desc,
    icon: icons[i],
    className: classNames[i]
  }));

  return (
    <section id="problem" className="py-24 bg-transparent relative">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-2xl reveal-glitch">
            <span className="section-label inline-block font-mono text-xs uppercase tracking-widest text-red-500/80 mb-4">
              {t.problem.label}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
              {t.problem.title1} <span data-text={t.problem.titleGlitch} className="glitch-word text-red-500">{t.problem.titleGlitch}</span>
            </h2>
            <p className="text-lg text-zinc-400">
              {t.problem.desc}
            </p>
          </div>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[250px]"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {bentoItems.map((item: any, i: number) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className={item.className}
            >
              <Card className="h-full w-full bg-transparent border-none shadow-none rounded-none flex flex-col justify-center">
                <CardHeader>
                  {item.icon}
                  <CardTitle className="text-2xl font-bold text-white mb-2">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-zinc-400 text-base leading-relaxed">
                    {item.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-16 text-right text-[10px] text-red-500/60 font-mono uppercase tracking-widest blink-cursor">
          &gt; SYSTEM: CRITICAL NON-COMPLIANCE DETECTED
        </div>
      </div>
    </section>
  );
}
