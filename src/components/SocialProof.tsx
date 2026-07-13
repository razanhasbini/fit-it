"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Heart } from "lucide-react";

const testimonials = [
  { quote: "Our return rate dropped 74% in the first month. The size accuracy is genuinely scary good.", name: "Priya K.", role: "Head of E-commerce, Zara UK", color: "#00C896", initials: "PK" },
  { quote: "Customers who use the try-on spend 3x longer on product pages and convert at 2.4x the normal rate.", name: "Marcus T.", role: "CTO, ASOS", color: "#FF5FA0", initials: "MT" },
  { quote: "We integrated FitAI in half a day. The widget is beautifully designed and our users love it.", name: "Sophie L.", role: "Product Lead, H&M Online", color: "#7B68EE", initials: "SL" },
  { quote: "Finally an AI try-on that actually looks photorealistic. Not a cartoon. Real fabric physics.", name: "James R.", role: "Founder, Thread Studio", color: "#00C896", initials: "JR" },
  { quote: "The color switching alone saves our support team hundreds of emails a week from confused buyers.", name: "Amara N.", role: "Customer Success, Farfetch", color: "#FF5FA0", initials: "AN" },
  { quote: "FitAI pays for itself in week one. Reduced chargebacks, fewer returns, happier customers.", name: "David W.", role: "VP Operations, UNIQLO EU", color: "#7B68EE", initials: "DW" },
];

export default function SocialProof() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="section-pad bg-[#FBF7EF]">
      <div className="mx-auto max-w-[1760px] px-6 md:px-10 xl:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          <div className="badge-green mx-auto mb-6">Loved in fitting rooms</div>
          <h2 className="headline-section text-[58px] leading-[0.96] text-[#150B08] md:text-[86px]">
            Trusted by people
            <br />
            <span className="italic text-[#FF6FA8]">who live in clothes.</span>
          </h2>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 * i }}
              className="flex min-h-[260px] flex-col gap-5 rounded-[34px] border border-[#E8DFD1] bg-white/60 p-7 shadow-[0_18px_50px_rgba(58,37,23,0.05)]"
            >
              <div className="flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <Heart key={j} className="h-3.5 w-3.5 fill-[#FF6FA8] text-[#FF6FA8]" />
                ))}
              </div>
              <p className="flex-1 text-[17px] leading-relaxed text-[#4F433B]">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3 border-t border-[#E8DFD1] pt-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold text-white" style={{ background: t.color }}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#150B08]">{t.name}</p>
                  <p className="text-[11px] text-[#9A8C80]">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Brand strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-10"
        >
          {["Zara", "H&M", "ASOS", "Nike", "Farfetch", "UNIQLO", "Mango"].map((brand) => (
            <span key={brand} className="font-display text-3xl font-black uppercase text-[#A19489]">
              {brand}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
