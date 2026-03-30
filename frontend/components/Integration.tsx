"use client";

import { motion } from "framer-motion";
import { Copy, Terminal } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function Integration() {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const codeSnippet = `<script src="https://cdn.accesslayer.kz/v1/widget.js" data-client-id="YOUR_ID"></script>`;

  const copyCode = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="integration" className="py-24 bg-transparent relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="section-label inline-block font-mono text-xs uppercase tracking-widest text-blue-500/80 mb-4">
            {t.integration.label}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
            {t.integration.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">{t.integration.titleHighlight}</span>
          </h2>
          <p className="text-lg text-zinc-400">
            {t.integration.desc}
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800"
          >
            <h3 className="font-bold text-lg text-white mb-2">{t.integration.step1Title}</h3>
            <p className="text-zinc-500 text-sm">{t.integration.step1Desc}</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800"
          >
            <h3 className="font-bold text-lg text-white mb-2">{t.integration.step2Title}</h3>
            <p className="text-zinc-500 text-sm">{t.integration.step2Desc}</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 border-blue-500/30"
          >
            <h3 className="font-bold text-lg text-white mb-2">{t.integration.step3Title}</h3>
            <p className="text-blue-400/80 text-sm">{t.integration.step3Desc}</p>
          </motion.div>
        </div>

        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="rounded-xl overflow-hidden border border-zinc-800 bg-[#0a0a0a] shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="ml-4 flex items-center gap-2 text-xs font-mono text-zinc-500">
                  <Terminal className="w-3 h-3" /> index.html
                </div>
              </div>
              <button 
                onClick={copyCode}
                className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-xs font-mono cursor-pointer"
              >
                {copied ? <span className="text-green-400">Скопировано!</span> : <><Copy className="w-3 h-3" /> Копировать</>}
              </button>
            </div>
            <div className="p-6 overflow-x-auto text-sm md:text-base font-mono leading-relaxed">
              <pre>
                <code className="text-zinc-300">
                  <span className="text-zinc-500">1</span>  &lt;<span className="text-pink-400">head</span>&gt;{"\n"}
                  <span className="text-zinc-500">2</span>    &lt;<span className="text-pink-400">meta</span> <span className="text-yellow-300">charset</span>=<span className="text-green-400">&quot;UTF-8&quot;</span> /&gt;{"\n"}
                  <span className="text-zinc-500">3</span>    &lt;<span className="text-pink-400">title</span>&gt;My Awesome Website&lt;/<span className="text-pink-400">title</span>&gt;{"\n"}
                  <span className="text-zinc-500">4</span>    {"\n"}
                  <span className="text-zinc-500">5</span>    <span className="text-zinc-500">{"<!-- AccessLayer Script -->"}</span>{"\n"}
                  <span className="text-zinc-500">6</span>    &lt;<span className="text-blue-400">script</span>{"\n"}
                  <span className="text-zinc-500">7</span>      <span className="text-yellow-300">src</span>=<span className="text-green-400">&quot;https://cdn.accesslayer.kz/v1/widget.js&quot;</span>{"\n"}
                  <span className="text-zinc-500">8</span>      <span className="text-yellow-300">data-client-id</span>=<span className="text-green-400">&quot;YOUR_ID&quot;</span>{"\n"}
                  <span className="text-zinc-500">9</span>    &gt;&lt;/<span className="text-blue-400">script</span>&gt;{"\n"}
                  <span className="text-zinc-500">10</span> &lt;/<span className="text-pink-400">head</span>&gt;
                </code>
              </pre>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
