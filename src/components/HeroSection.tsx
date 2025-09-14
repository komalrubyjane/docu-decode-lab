import { Button } from "@/components/ui/button";
import { ArrowRight, Scale, Shield, BookOpen } from "lucide-react";
import heroImage from "@/assets/hero-legal-documents.jpg";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Legal documents with highlighted clauses"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-gradient opacity-90"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <div className="animate-fade-in">
          <div className="flex items-center justify-center mb-6">
            <Scale className="w-12 h-12 text-secondary mr-3 animate-float" />
            <h1 className="legal-heading text-5xl md:text-7xl text-primary-foreground">
              Legal<span className="text-secondary">Learn</span>
            </h1>
          </div>
          
          <h2 className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto animate-slide-up">
            Transform complex legal documents into clear, understandable insights. 
            Learn your rights, understand your responsibilities, and make informed decisions.
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-scale-in">
            <Button 
              variant="hero" 
              size="lg" 
              className="text-lg group"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Start Learning 
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="accent" 
              size="lg" 
              className="text-lg group"
              onClick={() => {
                document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Upload Document 
              <BookOpen className="ml-2 group-hover:scale-110 transition-transform" />
            </Button>
          </div>
        </div>
        
        {/* Feature highlights */}
        <div className="grid md:grid-cols-3 gap-8 mt-16 animate-slide-up">
          <div className="card-shadow bg-card/90 backdrop-blur-sm p-6 rounded-xl smooth-transition hover:scale-105">
            <Shield className="w-8 h-8 text-secondary mx-auto mb-4" />
            <h3 className="legal-heading text-lg mb-2">Secure & Private</h3>
            <p className="clause-text text-sm">Your documents stay private. We never store or share your sensitive legal information.</p>
          </div>
          
          <div className="card-shadow bg-card/90 backdrop-blur-sm p-6 rounded-xl smooth-transition hover:scale-105">
            <BookOpen className="w-8 h-8 text-secondary mx-auto mb-4" />
            <h3 className="legal-heading text-lg mb-2">AI-Powered Analysis</h3>
            <p className="clause-text text-sm">Advanced AI breaks down complex legal language into plain English explanations.</p>
          </div>
          
          <div className="card-shadow bg-card/90 backdrop-blur-sm p-6 rounded-xl smooth-transition hover:scale-105">
            <Scale className="w-8 h-8 text-secondary mx-auto mb-4" />
            <h3 className="legal-heading text-lg mb-2">Real Scenarios</h3>
            <p className="clause-text text-sm">Interactive simulations show real-world consequences of legal decisions.</p>
          </div>
        </div>
      </div>
    </section>
  );
};