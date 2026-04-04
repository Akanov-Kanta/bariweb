"use client";

import { motion } from "framer-motion";
import { Mic, Brain, Search, Cpu, ArrowRight } from "lucide-react";

export default function AIPipelineSection() {
  const steps = [
    {
      title: "Голос пользователя",
      subtitle: "Speech-to-text",
      icon: <Mic className="h-6 w-6" />,
      desc: "Распознавание казахской и русской речи в реальном времени.",
    },
    {
      title: "Анализ намерения",
      subtitle: "KazLLM / Qwen",
      icon: <Brain className="h-6 w-6" />,
      desc: "Определение цели пользователя и планирование действий.",
    },
    {
      title: "Поиск элементов",
      subtitle: "RAGFlow + Milvus",
      icon: <Search className="h-6 w-6" />,
      desc: "Мгновенная навигация по структуре сайта через векторный поиск.",
    },
    {
      title: "Автономное действие",
      subtitle: "Web Component UI",
      icon: <Cpu className="h-6 w-6" />,
      desc: "Выполнение задачи: от заполнения форм до оформления заказов.",
    },
  ];

  return (
    <section className="section-container bg-[#080808] py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-20 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white md:text-5xl">
            Как мыслит <span className="heading-accent">ИИ-агент</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-neutral-400">
            Под капотом Bariweb работает сложная сеть AI-агентов, обеспечивающая бесшовную доступность.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Connector Arrow for desktop */}
              {index < steps.length - 1 && (
                <div className="absolute left-[calc(100%_-_1rem)] top-12 z-10 hidden lg:block">
                  <ArrowRight className="h-8 w-8 text-neutral-800 transition-colors group-hover:text-lime-500/50" />
                </div>
              )}
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="h-full rounded-3xl border border-neutral-800 bg-[#0a0a0f] p-8 transition-all hover:border-lime-500/30 hover:shadow-[0_0_30px_rgba(200,255,0,0.05)]"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-lime-400 group-hover:bg-lime-500 group-hover:text-black transition-colors">
                  {step.icon}
                </div>
                <h3 className="mb-1 text-xl font-bold text-white leading-tight">
                  {step.title}
                </h3>
                <div className="mb-4 text-[11px] font-bold uppercase tracking-wider text-lime-500/70">
                  {step.subtitle}
                </div>
                <p className="text-sm leading-relaxed text-neutral-400">
                  {step.desc}
                </p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
