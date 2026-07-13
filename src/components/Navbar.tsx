"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Try-On", href: "#tryon" },
  { label: "Enterprise", href: "#enterprise" },
  { label: "Pricing", href: "#pricing" },
];

export default function Navbar() {
  const { scrollY } = useScroll();
  const shadow = useTransform(scrollY, [0, 60], ["0 0 0 0px rgba(0,0,0,0)", "0 1px 0 0px #E8DFD1"]);

  return (
    <motion.nav
      className="fixed left-3 right-3 top-3 z-50 rounded-full border border-[#E8DFD1] bg-[#FBF7EF]/88 backdrop-blur-md"
      style={{ boxShadow: shadow }}
      initial={false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#62D2A6] bg-[#C8F6DF]">
            <span className="text-sm font-black text-[#150B08]">F</span>
          </div>
          <span className="font-display text-[19px] font-black text-[#150B08]">
            Fit<span style={{ color: "#FF5FA0" }}>AI</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#756960] transition-colors hover:text-[#150B08]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link href="#pricing" className="hidden text-[13px] font-semibold text-[#756960] transition-colors hover:text-[#150B08] md:block">
            Sign in
          </Link>
          <Link href="#tryon" className="rounded-full bg-[#62D2A6] px-5 py-2.5 text-[13px] font-black text-[#150B08] shadow-[0_12px_28px_rgba(0,200,150,0.14)]">
            Try it now
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
