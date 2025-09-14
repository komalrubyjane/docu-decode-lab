import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { FeatureSection } from "@/components/FeatureSection";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DocumentViewer } from "@/components/DocumentViewer";
import { ScenarioSimulator } from "@/components/ScenarioSimulator";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | undefined>();

  return (
    <AuthProvider>
      <div className="min-h-screen">
        <HeroSection />
        <FeatureSection />
        <DocumentUpload onAnalysisComplete={setCurrentAnalysisId} />
        <DocumentViewer analysisId={currentAnalysisId} />
        <ScenarioSimulator />
      
      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <h3 className="legal-heading text-2xl">
              Legal<span className="text-secondary">Learn</span>
            </h3>
          </div>
          <p className="clause-text text-primary-foreground/80 mb-6">
            Making legal literacy accessible, engaging, and practical for everyone.
          </p>
          <div className="flex justify-center space-x-6 text-sm">
            <a href="#" className="hover:text-secondary smooth-transition hover:scale-105 inline-block">Privacy Policy</a>
            <a href="#" className="hover:text-secondary smooth-transition hover:scale-105 inline-block">Terms of Service</a>
            <a href="#contact" className="hover:text-secondary smooth-transition hover:scale-105 inline-block">Contact</a>
            <a href="#about" className="hover:text-secondary smooth-transition hover:scale-105 inline-block">About</a>
          </div>
          <div className="mt-6 pt-6 border-t border-primary-foreground/20">
            <p className="clause-text text-primary-foreground/60 text-xs">
              © 2024 LegalLearn. All rights reserved. This platform provides educational content and should not be considered legal advice.
            </p>
          </div>
        </div>
      </footer>
        <Toaster />
      </div>
    </AuthProvider>
  );
};

export default Index;