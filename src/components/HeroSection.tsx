"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Camera, Link2, Ruler, ScanLine, Sparkles, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const MODELS = [
  { src: "/woman.jpg", label: "Woman" },
  { src: "/man.jpg", label: "Man" },
];

const COLOR_OPTIONS = ["Noir", "Pearl", "Emerald", "Blush"];
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL"];
const MARQUEE_BRANDS = [
  "COS",
  "ARKET",
  "GANNI",
  "AGOLDE",
  "TOTEME",
  "FARFETCH",
  "COS",
  "ARKET",
  "GANNI",
  "AGOLDE",
  "TOTEME",
  "FARFETCH",
];

export default function HeroSection() {
  const [activeModel, setActiveModel] = useState(0);
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const [flowStep, setFlowStep] = useState<"details" | "camera">("details");
  const [selectedColor, setSelectedColor] = useState("Noir");
  const [selectedSize, setSelectedSize] = useState("M");
  const [isHeroImageHovered, setIsHeroImageHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setActiveModel((p) => (p + 1) % MODELS.length), 3800);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isFlowOpen || flowStep !== "camera" || !videoRef.current) return;

    let stream: MediaStream | null = null;

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((mediaStream) => {
        stream = mediaStream;
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      })
      .catch(() => {
        stream = null;
      });

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [isFlowOpen, flowStep]);

  return (
    <section id="tryon" className="flex min-h-screen flex-col overflow-hidden rounded-[20px] border border-[#E8DFD1] bg-[radial-gradient(circle_at_8%_4%,#DDF9E9_0%,transparent_28%),linear-gradient(90deg,#FBF7EF_0%,#FBF7EF_70%,#FFE2F0_100%)] pt-20">
      <div className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 px-6 py-12 md:px-10 lg:grid-cols-[minmax(0,1fr)_520px] xl:px-12">

        {/*  Left: Copy  */}
        <div className="max-w-[640px]">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="badge-green mb-7"
          >
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#62D2A6" }} />
            New season - AI try-on live
          </motion.div>

          <motion.h1
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="headline-hero mb-6 text-[58px] leading-[0.94] text-[#150B08] md:text-[82px] lg:text-[96px] xl:text-[108px]"
          >
            One outfit.
            <br />
            <span className="italic" style={{ color: "#FF6FA8" }}>Every</span>{" "}
            <span className="italic" style={{ color: "#62D2A6" }}>body.</span>
          </motion.h1>

          <motion.p
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.22 }}
            className="mb-8 max-w-[560px] text-[18px] leading-relaxed text-[#5E5149] md:text-[22px]"
          >
            Paste any clothing link. Stand in front of your camera. See the fit,
            the drape, the colour - on the only model that matters.
          </motion.p>

          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.42 }}
            className="mb-7 flex flex-wrap gap-4"
          >
            <button className="btn-green" onClick={() => setIsFlowOpen(true)}>
              Try it now <ArrowRight className="w-4 h-4" />
            </button>
            <a href="#how-it-works" className="btn-outline">
              See how it works
            </a>
          </motion.div>

          <motion.p
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.58 }}
            className="mb-10 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#A19489]"
          >
            Works with favourite stores - no account needed
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.72 }}
            className="hidden gap-10 border-t border-[#E8DFD1] pt-8"
          >
            {[
              { v: "98.7%", l: "Fit accuracy", c: "#00C896" },
              { v: "76%", l: "Fewer returns", c: "#FF5FA0" },
              { v: "10k+", l: "Stores", c: "#7B68EE" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-2xl font-black" style={{ color: s.c }}>{s.v}</div>
                <div className="text-[12px] text-[#999] mt-0.5">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/*  Right: Fashion Photo Slider  */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[480px] lg:-mt-10 lg:translate-x-6 xl:translate-x-10"
        >
          <div className="absolute -left-3 -top-3 h-[calc(100%+20px)] w-[calc(100%+14px)] rounded-[36px] bg-[#BDF4D9]" />
          <div className="absolute -right-4 bottom-5 top-8 w-8 rounded-r-[36px] bg-[#FFE2F0]" />
          <motion.div
            className="slider-card relative overflow-hidden rounded-[30px]"
            onMouseEnter={() => setIsHeroImageHovered(true)}
            onMouseLeave={() => setIsHeroImageHovered(false)}
            whileHover={{ y: -6, rotate: 0.4 }}
            transition={{ duration: 0.25 }}
          >
            <div className="absolute left-[-20px] top-8 z-20 hidden rounded-full bg-white px-4 py-3 text-[14px] font-black text-[#3B312B] shadow-[0_18px_45px_rgba(58,37,23,0.14)] md:flex md:items-center md:gap-2">
              <span className="h-3 w-3 rounded-full bg-[#62D2A6]" />
              Size M - your fit
            </div>
            {/* Photo area */}
            <div className="relative h-[480px] overflow-hidden bg-[#F9F5EE] md:h-[550px] lg:h-[600px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeModel}
                  className="absolute inset-0"
                  initial={{ opacity: 0, x: 34, scale: 1.02 }}
                  animate={{ opacity: 1, x: 0, scale: isHeroImageHovered ? 1.035 : 1 }}
                  exit={{ opacity: 0, x: -34, scale: 0.99 }}
                  transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Image
                    src={MODELS[activeModel].src}
                    alt={`${MODELS[activeModel].label} wearing the outfit`}
                    fill
                    className="object-cover object-top"
                    priority
                    draggable={false}
                  />
                  {/* Gradient overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-24"
                    style={{ background: "linear-gradient(to top, rgba(249,248,246,0.9) 0%, transparent 100%)" }} />
                </motion.div>
              </AnimatePresence>
              <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                {MODELS.map((model, i) => (
                  <button
                    key={model.src}
                    type="button"
                    aria-label={`Show ${model.label} preview`}
                    onClick={() => setActiveModel(i)}
                    className="h-2.5 rounded-full transition-all"
                    style={{
                      width: activeModel === i ? 28 : 10,
                      background: i === 0 ? "#FF5FA0" : "#00C896",
                      opacity: activeModel === i ? 1 : 0.45,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isFlowOpen && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0D0D0D]/55 px-4 py-6 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="AI try-on setup"
              className="relative grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-[#F0DDE5] bg-[#FFF8FA] shadow-[0_30px_120px_rgba(62,18,35,0.28)] lg:grid-cols-[0.92fr_1.08fr]"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.28 }}
            >
              <button
                type="button"
                aria-label="Close try-on flow"
                onClick={() => {
                  setIsFlowOpen(false);
                  setFlowStep("details");
                }}
                className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-[#F0DDE5] bg-white/90 text-[#2A151D] shadow-[0_8px_30px_rgba(62,18,35,0.14)] transition hover:scale-105 hover:bg-[#FFF0F6]"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative min-h-[520px] overflow-hidden bg-[#FFF7F9] text-[#2A151D]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,95,160,0.22),transparent_34%),radial-gradient(circle_at_88%_80%,rgba(0,200,150,0.16),transparent_36%),linear-gradient(135deg,#FFF8FA_0%,#FFFFFF_46%,#EFFCF7_100%)]" />
                <div className="absolute left-8 right-8 top-28 h-px bg-gradient-to-r from-transparent via-[#E9C7D4] to-transparent" />
                <div className="absolute bottom-12 left-8 h-28 w-28 rounded-full border border-[#FF5FA0]/20" />
                <div className="absolute -right-10 top-24 h-48 w-48 rounded-full border border-[#00C896]/18" />
                <div className="relative flex h-full flex-col justify-between p-8">
                  <div>
                    <div className="mb-5 inline-flex rounded-full border border-[#BFEFE1] bg-white/75 px-5 py-2 text-[11px] font-black uppercase tracking-widest text-[#00A87C] shadow-[0_10px_35px_rgba(0,200,150,0.12)]">
                      Private fitting room
                    </div>
                    <h2 className="headline-section max-w-sm text-4xl leading-tight text-[#2A151D]">
                      A made-for-you fitting, before you buy.
                    </h2>
                    <p className="mt-5 max-w-[340px] text-[15px] leading-relaxed text-[#7B5A65]">
                      Bring any piece from any boutique. We read the garment, learn your proportions, then let you preview the fit like a mirror in a couture studio.
                    </p>
                  </div>

                  <div className="space-y-3 text-sm text-[#5F4A50]">
                    {[
                      "Paste the piece and we collect its size chart, colors, fabric notes, and product imagery.",
                      "Share your height, weight, usual size, and optional measurements for a cleaner fit profile.",
                      "Step into camera view and change size or color while the garment stays placed on you.",
                    ].map((item, i) => (
                      <div key={item} className="flex gap-3 rounded-[20px] border border-white/80 bg-white/68 p-4 shadow-[0_18px_50px_rgba(62,18,35,0.07)] backdrop-blur">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF0F6] text-xs font-black text-[#FF5FA0] ring-1 ring-[#FFD2E4]">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 text-[#2A151D] md:p-8">
                {flowStep === "details" ? (
                  <div>
                    <div className="mb-7 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E6FBF4] shadow-[0_12px_32px_rgba(0,200,150,0.12)]">
                        <Ruler className="h-5 w-5 text-[#00A87C]" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#C28CA4]">Atelier notes</p>
                        <h3 className="text-xl font-black">Your piece and fit profile</h3>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block">
                        <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-[#9A6B7C]">Clothing link</span>
                        <div className="relative">
                          <Link2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#AAA]" />
                          <input className="url-input bg-white" placeholder="Paste a dress, jacket, denim, or shoe page..." type="url" />
                        </div>
                      </label>

                      <div className="grid grid-cols-2 gap-3">
                        <label>
                          <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-[#9A6B7C]">Height</span>
                          <input className="url-input px-4" placeholder="175 cm" />
                        </label>
                        <label>
                          <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-[#9A6B7C]">Weight</span>
                          <input className="url-input px-4" placeholder="72 kg" />
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <label>
                          <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-[#9A6B7C]">Fit model</span>
                          <select className="url-input px-4">
                            <option>Woman</option>
                            <option>Man</option>
                            <option>Custom</option>
                          </select>
                        </label>
                        <label>
                          <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-[#9A6B7C]">Usual size</span>
                          <select className="url-input px-4">
                            {SIZE_OPTIONS.map((size) => (
                              <option key={size}>{size}</option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <label>
                        <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-[#9A6B7C]">Optional exact measurements</span>
                        <input className="url-input px-4" placeholder="Bust/chest, waist, hips, inseam, shoulders..." />
                      </label>
                    </div>

                    <button className="btn-pink mt-6 w-full justify-center" onClick={() => setFlowStep("camera")}>
                      Open fitting mirror <Camera className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF0F6]">
                        <ScanLine className="h-5 w-5 text-[#FF5FA0]" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#C28CA4]">Fitting mirror</p>
                        <h3 className="text-xl font-black">Style it on your body</h3>
                      </div>
                    </div>

                    <div className="relative mb-5 h-[330px] overflow-hidden rounded-[22px] bg-[#F7EFEF]">
                      <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                      <div className="absolute inset-6 rounded-[42%] border border-[#00C896]/45 shadow-[0_0_60px_rgba(0,200,150,0.16)]" />
                      <div className="absolute left-1/2 top-[36%] h-32 w-40 -translate-x-1/2 rounded-[42px] border border-[#FF5FA0]/55 bg-[#FF5FA0]/10 backdrop-blur-[1px]" />
                      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/82 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#2A151D] shadow-sm backdrop-blur">
                        <Sparkles className="h-3.5 w-3.5 text-[#00C896]" />
                        Draping preview
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#777]">Size</p>
                      <div className="flex gap-2">
                        {SIZE_OPTIONS.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`size-pill${selectedSize === size ? " active" : ""}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#777]">Color</p>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_OPTIONS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`pin-pill${selectedColor === color ? " active" : ""}`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/*  Brand strip  */}
      <div className="border-y border-[#E8DFD1] bg-[#F4ECDE]/80 py-6">
        <div className="brand-marquee overflow-hidden">
          <div className="brand-marquee-track flex w-max items-center gap-10">
            {MARQUEE_BRANDS.map((b, i) => (
              <div key={`${b}-${i}`} className="flex shrink-0 items-center gap-10">
                <span className="font-display text-3xl font-black text-[#74695F] md:text-4xl">{b}</span>
                <span className="text-3xl text-[#FF6FA8]">✦</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
