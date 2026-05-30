import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Hero } from "@/components/marketing/Hero";
import { EsportsMarquee } from "@/components/marketing/EsportsMarquee";
import { CredibilitySection } from "@/components/marketing/CredibilitySection";
import { ScoutScenarioSection } from "@/components/marketing/ScoutScenarioSection";
import { GallerySection } from "@/components/marketing/GallerySection";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
import { UseCasesSection } from "@/components/marketing/UseCasesSection";
import { ComparisonSection } from "@/components/marketing/ComparisonSection";
import { FinalCtaSection } from "@/components/marketing/FinalCtaSection";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "ProCard — Verified esports identity for competitive players",
  description:
    "Live ranks from Riot and Faceit. Team history, socials, and status — built for players who get scouted.",
  openGraph: {
    title: "ProCard",
    description: "Your verified esports identity. One link.",
    type: "website",
  },
};

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-surface-0">
      <MarketingNav />
      <Hero />
      <EsportsMarquee />
      <CredibilitySection />
      <ScoutScenarioSection />
      <GallerySection />
      <HowItWorksSection />
      <UseCasesSection />
      <ComparisonSection />
      <FinalCtaSection />
      <MarketingFooter />
    </main>
  );
}
