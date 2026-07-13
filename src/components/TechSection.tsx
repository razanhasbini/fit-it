"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Eye, Layers, Ruler, Shield } from "lucide-react";

const features = [
  {
    icon: Ruler,
    title: "Measured from the garment",
    desc: "Size charts, fabric notes, product imagery, and colour options are translated into a fitting profile.",
    bg: "#FFF8FA",
    color: "#FF5FA0",
  },
  {
    icon: Eye,
    title: "Styled on your silhouette",
    desc: "Camera landmarks help place the piece on the body you actually have, not a sample model.",
    bg: "#EFFCF7",
    color: "#00A87C",
  },
  {
    icon: Layers,
    title: "Drape, not just overlay",
    desc: "The preview is designed around hem length, shoulder width, waist placement, and garment fall.",
    bg: "#F4ECDE",
    color: "#74695F",
  },
  {
    icon: Shield,
    title: "Private by design",
    desc: "Your fitting session is treated like a dressing room: temporary, personal, and yours.",
    bg: "#FFF0F6",
    color: "#E04080",
  },
];

export default function TechSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="section-pad bg-[#FBF7EF]">
      <div className="mx-auto max-w-[1760px] px-6 md:px-10 xl:px-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-14 grid gap-8 rounded-[56px] border border-[#E8DFD1] bg-white/52 p-8 md:grid-cols-[0.9fr_1.1fr] md:p-12"
        >
          <div>
            <div className="mb-5 inline-flex rounded-full border border-[#FFD2E4] bg-[#FFF0F6] px-5 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#E04080]">
              The fitting craft
            </div>
            <h2 className="headline-section text-[58px] leading-[0.96] text-[#150B08] md:text-[82px]">
              Quietly precise,
              <br />
              <span className="italic text-[#62D2A6]">beautifully simple.</span>
            </h2>
          </div>
          <p className="self-end text-[22px] leading-relaxed text-[#5E5149]">
            The intelligence sits behind the mirror. The experience stays soft:
            a link, a body profile, a live fitting, and fast changes when a
            colour or size catches your eye.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 28 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.08 * i }}
                className="rounded-[34px] border border-[#E8DFD1] p-7 shadow-[0_18px_50px_rgba(58,37,23,0.05)]"
                style={{ background: feature.bg }}
              >
                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-full bg-white">
                  <Icon className="h-5 w-5" style={{ color: feature.color }} />
                </div>
                <h3 className="font-display mb-3 text-3xl font-black leading-none text-[#150B08]">
                  {feature.title}
                </h3>
                <p className="text-[15px] leading-relaxed text-[#5E5149]">
                  {feature.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
