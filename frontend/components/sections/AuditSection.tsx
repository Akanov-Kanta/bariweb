"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import MagneticButton from "../ui/MagneticButton";

export default function AuditSection() {
  const [url, setUrl] = useState("");
  const router = useRouter();

  const handleAudit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic: Redirect to login immediately on audit request
    router.push("/login");
  };

  return (
    <section id="audit" className="section-container relative border-t border-neutral-900 bg-[#05050a] py-32 md:py-48">
      {/* Background Glow */}
      <div className="absolute right-0 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-lime-500/5 blur-[120px]" />
      <div className="absolute left-0 bottom-0 -z-10 h-[400px] w-[400px] rounded-full bg-white/5 blur-[100px]" />

      <div className="mx-auto w-full max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            Проверьте свой сайт на <span className="heading-accent">уязвимости</span>
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-lg text-neutral-400">
            Введите адрес вашего сайта, и наш ИИ проведет мгновенный аудит на соответствие Цифровому кодексу РК.
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleAudit}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mx-auto flex w-full max-w-2xl flex-col items-center gap-4 sm:flex-row"
        >
          <div className="relative w-full">
            <input
              type="url"
              placeholder="https://vash-site.kz"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/50 px-6 py-6 text-lg text-white outline-none transition-all focus:border-lime-500/50 focus:bg-neutral-900 focus:ring-4 focus:ring-lime-500/10 placeholder:text-neutral-600"
            />
          </div>
          <MagneticButton
            intensity={20}
            className="btn-primary w-full whitespace-nowrap px-10 py-6 text-lg tracking-wide sm:w-auto"
          >
            Запустить скан
          </MagneticButton>
        </motion.form>
      </div>
    </section>
  );
}
