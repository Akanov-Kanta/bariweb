import NoiseOverlay from "@/components/ui/NoiseOverlay";
import Navbar from "@/components/sections/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import ScrollTourSection from "@/components/sections/ScrollTourSection";
import BentoFeaturesSection from "@/components/sections/BentoFeaturesSection";
import IntegrationSection from "@/components/sections/IntegrationSection";
import PricingSection from "@/components/sections/PricingSection";
import Footer from "@/components/sections/Footer";

import TechStackSection from "@/components/sections/TechStackSection";
import AIPipelineSection from "@/components/sections/AIPipelineSection";
import AuditSection from "@/components/sections/AuditSection";
import { ROICalculator } from "@/components/ROICalculator";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#080808] text-white">
      <NoiseOverlay />
      
      <Navbar />
      <HeroSection />
      <TechStackSection />
      <ScrollTourSection />
      <AIPipelineSection />
      <BentoFeaturesSection />
      <IntegrationSection />
      <ROICalculator />
      <PricingSection />
      <AuditSection />
      <Footer />
    </main>
  );
}
