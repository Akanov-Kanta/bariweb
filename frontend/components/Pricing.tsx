"use client";

import { Check } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function Pricing() {
  const { t } = useLanguage();
  const c = t.pricing;

  const plans = [
    {
      name: "Starter",
      price: "$299",
      description: c.plans.starter.desc,
      features: c.plans.starter.features,
      highlighted: false
    },
    {
      name: "Business",
      price: "$1,200",
      description: c.plans.business.desc,
      features: c.plans.business.features,
      highlighted: true
    },
    {
      name: "Enterprise / Gov",
      price: "$3,500",
      description: c.plans.enterprise.desc,
      features: c.plans.enterprise.features,
      highlighted: false
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-transparent relative">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
            {c.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">{c.titleHighlight}</span>
          </h2>
          <p className="text-lg text-zinc-400">
            {c.desc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="h-full"
            >
              <Card 
                className={`relative flex flex-col h-full bg-[#0a0a0a] transition-all duration-300 \${
                  plan.highlighted 
                    ? "border-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.15)] md:-translate-y-4" 
                    : "border-zinc-800"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                    {c.recommended}
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-zinc-400 min-h-[40px]">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4 flex items-baseline text-white">
                    <span className="text-5xl font-extrabold tracking-tight">{plan.price}</span>
                    <span className="ml-1 text-xl font-medium text-zinc-500">/{c.month}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-4 mt-6">
                    {plan.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <Check className="h-5 w-5 text-blue-400 shrink-0 mr-3" />
                        <span className="text-zinc-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant={plan.highlighted ? "glow" : "outline"} 
                    className="w-full text-md h-12"
                  >
                    {c.chooseBtn} {plan.name}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
