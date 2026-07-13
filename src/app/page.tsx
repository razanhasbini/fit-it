import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import TechSection from "@/components/TechSection";
import DemoSection from "@/components/DemoSection";
import EnterpriseSection from "@/components/EnterpriseSection";
import SocialProof from "@/components/SocialProof";
import PricingSection from "@/components/PricingSection";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="overflow-x-hidden bg-[#FBF7EF] text-[#150B08]">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <TechSection />
      <DemoSection />
      <EnterpriseSection />
      <SocialProof />
      <PricingSection />
      <FinalCTA />
      <Footer />
    </main>
  );
}
