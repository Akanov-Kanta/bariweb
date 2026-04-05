"use client";

import { motion } from "framer-motion";
import { Eye, Volume2, Brain } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function EndUsers() {
  const { t } = useLanguage();

  const icons = [
    <Eye key="1" className="w-6 h-6 text-white" />,
    <Volume2 key="2" className="w-6 h-6 text-white" />,
    <Brain key="3" className="w-6 h-6 text-white" />
  ];

  const colors = [
    { color: "bg-blue-600", tagColor: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { color: "bg-purple-600", tagColor: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    { color: "bg-green-600", tagColor: "bg-green-500/20 text-green-400 border-green-500/30" }
  ];

  const personas = t.endUsers.personas.map((p: any, i: number) => ({
    ...p,
    icon: icons[i],
    ...colors[i]
  }));

  return (
    <section className="py-24 bg-transparent relative border-t border-zinc-900">
      <div className="container mx-auto px-4 md:px-6">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
            {t.endUsers.title}
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            {t.endUsers.desc}
          </p>
        </div>

        {/* TOP METRICS */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-8 mb-16 divide-y md:divide-y-0 md:divide-x divide-white/10 max-w-5xl mx-auto">
          {t.endUsers.metrics.map((m: any, i: number) => (
            <div key={i} className="flex-1 text-center py-6 md:py-0 px-4">
              <div className="text-5xl md:text-6xl font-light text-white mb-2 tracking-tight">{m.val}</div>
              <div className="text-sm text-zinc-400">{m.label}</div>
            </div>
          ))}
        </div>

        {/* USER CARDS */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } }, hidden: {} }}
        >
          {personas.map((p: any, idx: number) => (
            <motion.div
              key={idx}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="group bg-white/[0.04] border border-white/10 rounded-2xl p-6 hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg \${p.color}`}>
                    {p.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">{p.name}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{p.status}</p>
                  </div>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed italic opacity-80 mb-6">
                  &quot;{p.quote}&quot;
                </p>
              </div>
              <div className="mt-auto">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border \${p.tagColor}`}>
                  {p.tag}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
