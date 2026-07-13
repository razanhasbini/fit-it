"use client";

import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { useRef, useState } from "react";

const looks = [
  { src: "/woman.jpg", label: "Blush cotton tee", fit: "Size M - relaxed" },
  { src: "/man.jpg", label: "Cream streetwear tee", fit: "Size L - easy fit" },
];

export default function DemoSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [activeLook, setActiveLook] = useState(0);

  return (
    <section ref={ref} className="section-pad bg-[#FBF7EF]">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 md:px-10 lg:grid-cols-[1fr_420px] xl:px-12">
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="self-center"
        >
          <div className="mb-6 text-[18px] font-medium uppercase tracking-[0.34em] text-[#5E5149]">
            The fitting mirror
          </div>
          <h2 className="headline-section mb-8 text-[64px] leading-[0.94] text-[#150B08] md:text-[92px]">
            See the piece,
            <br />
            <span className="italic text-[#FF6FA8]">then make it yours.</span>
          </h2>
          <p className="max-w-[560px] text-[23px] leading-relaxed text-[#5E5149]">
            The same garment can feel entirely different with a size shift, a
            colour change, or a different silhouette. Preview those decisions
            before the checkout page ever opens.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            {looks.map((look, i) => (
              <button
                key={look.label}
                onClick={() => setActiveLook(i)}
                className={`pin-pill${activeLook === i ? " active" : ""}`}
              >
                {look.label}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 32 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative"
        >
          <div className="absolute -left-3 -top-3 h-full w-full rounded-[36px] bg-[#C8F6DF]" />
          <div className="absolute -right-3 bottom-5 top-5 w-8 rounded-r-[36px] bg-[#FFE2F0]" />
          <div className="slider-card relative overflow-hidden rounded-[30px]">
            <div className="relative h-[310px] bg-[#F9F5EE]">
              <Image
                src={looks[activeLook].src}
                alt={looks[activeLook].label}
                fill
                className="object-cover object-top"
                sizes="(min-width: 1024px) 54vw, 100vw"
              />
              <div className="absolute left-4 top-4 rounded-full bg-white/90 px-4 py-2 text-[12px] font-black text-[#150B08] shadow-[0_18px_45px_rgba(58,37,23,0.14)]">
                {looks[activeLook].fit}
              </div>
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
                {looks.map((look, i) => (
                  <button
                    key={look.src}
                    aria-label={`Show ${look.label}`}
                    onClick={() => setActiveLook(i)}
                    className="h-2.5 rounded-full transition-all"
                    style={{
                      width: activeLook === i ? 30 : 10,
                      background: i === 0 ? "#FF6FA8" : "#62D2A6",
                      opacity: activeLook === i ? 1 : 0.45,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
