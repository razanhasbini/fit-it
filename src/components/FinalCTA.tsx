"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

export default function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="section-pad bg-[#FBF7EF]">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#BFEFE1] bg-[#C8F6DF] px-6 py-3">
            <Sparkles className="h-4 w-4 text-[#00A87C]" />
            <span className="text-[12px] font-black uppercase tracking-[0.22em] text-[#150B08]">Your next fitting room</span>
          </div>

          <h2 className="headline-section mb-8 text-[70px] leading-[0.94] text-[#150B08] md:text-[112px]">
            Wear it first.
            <br />
            <span className="italic text-[#FF6FA8]">Buy it better.</span>
          </h2>

          <p className="mx-auto mb-10 max-w-2xl text-[23px] leading-relaxed text-[#5E5149]">
            Add a softer, smarter fitting experience to every product page. Less
            return anxiety, more confidence, more outfits that actually leave the closet.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-10">
            <button className="btn-green inline-flex items-center gap-2 text-base px-8 py-4">
              Start for free <ArrowRight className="w-4 h-4" />
            </button>
            <button className="btn-outline text-base px-8 py-4">
              Book a demo
            </button>
          </div>

          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#A19489]">
            Private sessions - instant setup - made for fashion
          </p>
        </motion.div>
      </div>
    </section>
  );
}
