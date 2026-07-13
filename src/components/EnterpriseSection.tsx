"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { BarChart2, Link2, Lock, Zap } from "lucide-react";

const perks = [
  { icon: Link2, color: "#00C896", bg: "#E6FBF4", title: "One-line integration", desc: "Drop our widget into any product page with a single script tag. No backend changes needed." },
  { icon: BarChart2, color: "#FF5FA0", bg: "#FFF0F6", title: "Conversion analytics", desc: "Track try-on rates, size selections, and add-to-cart lift per product SKU in real time." },
  { icon: Lock, color: "#7B68EE", bg: "#F0EEFF", title: "SOC 2 compliant", desc: "Enterprise-grade security. All processing is ephemeral  no customer photos stored, ever." },
  { icon: Zap, color: "#00C896", bg: "#E6FBF4", title: "Dedicated SLA", desc: "99.99% uptime guarantee with a dedicated support engineer for Enterprise accounts." },
];

export default function EnterpriseSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="enterprise" ref={ref} className="section-pad bg-[#FBF7EF]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Code block */}
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <div className="rounded-2xl overflow-hidden border border-[#E8E8E8] shadow-sm">
              {/* Title bar */}
              <div className="bg-[#1E1E2E] px-5 py-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF5FA0]" />
                <span className="w-3 h-3 rounded-full bg-[#FFBB33]" />
                <span className="w-3 h-3 rounded-full bg-[#00C896]" />
                <span className="ml-3 text-[11px] text-[#666] font-mono">fitai-embed.js</span>
              </div>
              <div className="bg-[#13131F] p-6 font-mono text-[13px] leading-7">
                <div><span className="text-[#7B68EE]">import</span><span className="text-[#CDD6F4]"> FitAI </span><span className="text-[#7B68EE]">from</span><span className="text-[#A6E3A1]"> &apos;@fitai/widget&apos;</span><span className="text-[#CDD6F4]">;</span></div>
                <div className="mt-1"><span className="text-[#CDD6F4]"> </span></div>
                <div><span className="text-[#7B68EE]">const</span><span className="text-[#CDD6F4]"> widget = FitAI.</span><span className="text-[#89DCEB]">init</span><span className="text-[#CDD6F4]">{"({"}</span></div>
                <div><span className="text-[#CDD6F4]">  apiKey: </span><span className="text-[#A6E3A1]">&apos;fai_live_&apos;</span><span className="text-[#CDD6F4]">,</span></div>
                <div><span className="text-[#CDD6F4]">  productUrl: window.location.href,</span></div>
                <div><span className="text-[#CDD6F4]">  theme: </span><span className="text-[#A6E3A1]">&apos;minimal&apos;</span><span className="text-[#CDD6F4]">,</span></div>
                <div><span className="text-[#CDD6F4]">{"})"};</span></div>
                <div className="mt-1"> </div>
                <div><span className="text-[#6C7086]">{"// Attach to your \"Try on me\" button"}</span></div>
                <div><span className="text-[#CDD6F4]">widget.</span><span className="text-[#89DCEB]">mount</span><span className="text-[#CDD6F4]">(&apos;#try-on-btn&apos;);</span></div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <div className="badge-green">npm install @fitai/widget</div>
              <span className="text-[12px] text-[#999]">or use our CDN</span>
            </div>
          </motion.div>

          {/* Right */}
          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <div className="badge-pink mb-5">For brands</div>
            <h2 className="headline-section mb-4 text-[58px] leading-[0.96] text-[#150B08] md:text-[78px]">
              A fitting room for every product page
            </h2>
            <p className="mb-10 text-[20px] leading-relaxed text-[#5E5149]">
              FitAI integrates with Shopify, WooCommerce, Magento, and custom commerce stacks. Keep your store beautiful, then add fit confidence where shoppers need it.
            </p>

            <div className="space-y-5">
              {perks.map((p, i) => {
                const Icon = p.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.25 + 0.1 * i }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: p.bg }}>
                      <Icon className="w-5 h-5" style={{ color: p.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-[14px] text-[#0D0D0D] mb-1">{p.title}</p>
                      <p className="text-[13px] text-[#666] leading-relaxed">{p.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-10 flex gap-3">
              <button className="btn-green">Book a demo</button>
              <button className="btn-outline">Read the docs</button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
