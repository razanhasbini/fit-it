"use client";

const links = {
  Product: ["How it works", "Demo", "Pricing", "Changelog"],
  Developers: ["Documentation", "API Reference", "SDKs", "Status"],
  Company: ["About", "Blog", "Careers", "Press"],
  Legal: ["Privacy", "Terms", "Cookie Policy", "Security"],
};

export default function Footer() {
  return (
    <footer className="border-t border-[#E8DFD1] bg-[#F4ECDE]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="font-black text-xl mb-3">
              <span style={{ color: "#00A87C" }}>Fit</span><span className="text-[#150B08]">AI</span>
            </div>
            <p className="text-[13px] text-[#999] leading-relaxed">
              A private fitting room for fashion retail. See it on you before you buy.
            </p>
          </div>

          {Object.entries(links).map(([heading, items]) => (
            <div key={heading}>
              <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-[#150B08]">{heading}</p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-[13px] text-[#999] hover:text-[#00C896] transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-[#E8E8E8] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-[#CACACA]"> 2025 FitAI, Inc. All rights reserved.</p>
          <p className="text-[12px] text-[#CACACA]">Made with love for fashion & technology.</p>
        </div>
      </div>
    </footer>
  );
}
