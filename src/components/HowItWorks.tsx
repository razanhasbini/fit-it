"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    number: "01",
    title: "Paste the link",
    description:
      "Drop any product URL from your favourite store. We read the cut, fabric, colourway, and available sizes.",
    bg: "#C8F6DF",
  },
  {
    number: "02",
    title: "Step into frame",
    description:
      "Use your phone or laptop camera. Your silhouette is mapped quickly, with fitting details kept private.",
    bg: "#FFE2F0",
  },
  {
    number: "03",
    title: "Style, swap, decide",
    description:
      "Switch colour and size in real time. Save the looks you love to your private lookbook.",
    bg: "#F4ECDE",
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" ref={ref} className="section-pad bg-[#FBF7EF]">
      <div className="mx-auto max-w-[1760px] px-6 md:px-10 xl:px-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-14 grid gap-7 md:grid-cols-[1fr_0.75fr] md:items-end"
        >
          <div>
            <div className="mb-5 text-[14px] font-medium uppercase tracking-[0.3em] text-[#5E5149]">
              The process
            </div>
            <h2 className="headline-section text-[46px] leading-[0.96] text-[#150B08] md:text-[68px] lg:text-[76px]">
              Less guessing,
              <br />
              <span className="italic text-[#FF6FA8]">more wearing.</span>
            </h2>
          </div>
          <p className="max-w-[500px] text-[18px] leading-relaxed text-[#5E5149] md:text-[20px]">
            Built with stylists, fit technicians and a touch of obsession. Three
            steps from curiosity to checkout.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 32 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.12 * i }}
              className="min-h-[260px] rounded-[34px] p-8 shadow-[0_18px_50px_rgba(58,37,23,0.05)]"
              style={{ background: step.bg }}
            >
              <div className="mb-14 flex items-center justify-between">
                <span className="font-display text-3xl font-black text-[#150B08]">
                  {step.number}
                </span>
                <span className="h-px w-16 bg-[#150B08]/18" />
              </div>
              <h3 className="font-display mb-4 text-3xl font-black leading-none text-[#150B08] md:text-4xl">
                {step.title}
              </h3>
              <p className="text-[16px] leading-relaxed text-[#4F433B] md:text-[17px]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
