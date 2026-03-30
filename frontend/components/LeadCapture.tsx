"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function LeadCapture() {
  const { t } = useLanguage();
  const c = t.lead;
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      alert(`Анализ запущен для: \${url}. Мы свяжемся с вами с результатами аудита.`);
      setUrl("");
    }
  };

  return (
    <section id="audit" className="py-24 bg-transparent relative border-t border-zinc-900 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           transition={{ duration: 0.5 }}
           className="max-w-2xl mx-auto space-y-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            {c.title}
          </h2>
          <p className="text-lg text-zinc-400">
            {c.desc}
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mt-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
              <Input 
                type="url" 
                placeholder={c.placeholder} 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="pl-10 h-14 bg-zinc-900/50 border-zinc-800 text-base"
                aria-label={c.placeholder}
              />
            </div>
            <Button type="submit" variant="glow" size="lg" className="h-14 px-8 text-md font-medium cursor-pointer">
              {c.btn}
            </Button>
          </form>
          <p className="text-xs text-zinc-600 mt-4">
            {c.terms1} <a href="#" className="underline hover:text-zinc-400">{c.terms2}</a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
