"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    monthly: 0,
    yearly: 0,
    desc: "Perfect for indie brands testing the waters.",
    color: "#00C896",
    btnClass: "btn-outline",
    features: ["500 try-ons / month", "5 product links", "Basic analytics", "Email support", "FitAI branding"],
  },
  {
    name: "Growth",
    monthly: 79,
    yearly: 63,
    desc: "For growing DTC brands ready to scale.",
    color: "#FF5FA0",
    btnClass: "btn-pink",
    badge: "Most popular",
    features: ["10,000 try-ons / month", "Unlimited product links", "Full analytics dashboard", "Priority support", "White-label option", "Shopify & WooCommerce plugin"],
  },
  {
    name: "Enterprise",
    monthly: null,
    yearly: null,
    desc: "Custom volume, SLAs, and dedicated engineering support.",
    color: "#7B68EE",
    btnClass: "btn-outline",
    features: ["Unlimited try-ons", "Custom integrations", "SOC 2 compliance", "99.99% uptime SLA", "Dedicated account manager", "On-premise option available"],
  },
];

export default function PricingSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [yearly, setYearly] = useState(false);

  return (
    <section ref={ref} className="section-pad bg-[#FBF7EF]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="badge-green mx-auto mb-4">Pricing</div>
          <h2 className="headline-section mb-6 text-[58px] leading-[0.96] text-[#150B08] md:text-[86px]">
            Choose your fitting room
          </h2>
          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-white border border-[#E8E8E8] rounded-full px-5 py-2">
            <span className={`text-[13px] font-semibold ${!yearly ? "text-[#0D0D0D]" : "text-[#999]"}`}>Monthly</span>
            <button
              onClick={() => setYearly(!yearly)}
              className="w-10 h-6 rounded-full transition-colors relative"
              style={{ background: yearly ? "#00C896" : "#E8E8E8" }}
            >
              <span
                className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm"
                style={{ left: yearly ? "22px" : "4px" }}
              />
            </button>
            <span className={`text-[13px] font-semibold ${yearly ? "text-[#0D0D0D]" : "text-[#999]"}`}>
              Yearly <span className="text-[#00C896]">20%</span>
            </span>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 28 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.1 * i }}
              className={`relative flex flex-col rounded-[34px] border bg-white/64 p-7 shadow-[0_18px_50px_rgba(58,37,23,0.05)] ${plan.badge ? "border-[#FF5FA0]" : "border-[#E8DFD1]"}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#FF5FA0] text-white text-[11px] font-bold uppercase tracking-widest rounded-full px-4 py-1">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className="font-bold text-[15px] mb-1" style={{ color: plan.color }}>{plan.name}</p>
                <div className="flex items-end gap-1 mb-2">
                  {plan.monthly === null ? (
                    <span className="text-3xl font-black text-[#0D0D0D]">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-black text-[#0D0D0D]">
                        ${yearly ? plan.yearly : plan.monthly}
                      </span>
                      {plan.monthly > 0 && <span className="text-[13px] text-[#999] mb-1">/mo</span>}
                    </>
                  )}
                </div>
                <p className="text-[13px] text-[#666]">{plan.desc}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-[13px] text-[#444]">
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: plan.color }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button className={plan.btnClass === "btn-pink" ? "btn-pink w-full justify-center" : "btn-outline w-full justify-center"}>
                {plan.monthly === null ? "Contact sales" : plan.monthly === 0 ? "Start free" : "Get started"}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
