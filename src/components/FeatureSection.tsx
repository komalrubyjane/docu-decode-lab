import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Search, Lightbulb, GitBranch, Users, Award, ArrowRight } from "lucide-react";
import analyzeIcon from "@/assets/analyze-icon.png";
import learnIcon from "@/assets/learn-icon.png";
import simulateIcon from "@/assets/simulate-icon.png";

export const FeatureSection = () => {
  const features = [
    {
      icon: <img src={analyzeIcon} alt="Analyze" className="w-12 h-12" />,
      title: "Document Analysis",
      description: "Upload any legal document and get instant clause-by-clause breakdowns in plain language.",
      capabilities: ["Contract analysis", "Terms of service breakdown", "Privacy policy explanation", "Legal jargon translation"]
    },
    {
      icon: <img src={learnIcon} alt="Learn" className="w-12 h-12" />,
      title: "Interactive Learning",
      description: "Understand your rights and responsibilities through guided explanations and quizzes.",
      capabilities: ["Key terms glossary", "Interactive quizzes", "Progress tracking", "Personalized insights"]
    },
    {
      icon: <img src={simulateIcon} alt="Simulate" className="w-12 h-12" />,
      title: "Scenario Simulation",
      description: "Explore real-world scenarios to see how legal clauses apply in practice.",
      capabilities: ["Decision trees", "Outcome prediction", "Risk assessment", "Comparative analysis"]
    }
  ];

  return (
    <section id="features" className="py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="legal-heading text-4xl md:text-5xl mb-6">
            Make Legal Documents <span className="text-secondary">Accessible</span>
          </h2>
          <p className="clause-text text-xl max-w-3xl mx-auto">
            Our comprehensive platform transforms complex legal language into clear, actionable insights
            that empower you to make informed decisions.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="card-shadow hover:legal-shadow smooth-transition group">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 group-hover:animate-float">
                  {feature.icon}
                </div>
                <CardTitle className="legal-heading text-2xl">{feature.title}</CardTitle>
                <CardDescription className="clause-text text-base">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {feature.capabilities.map((capability, capIndex) => (
                    <li key={capIndex} className="flex items-center clause-text">
                      <div className="w-2 h-2 bg-secondary rounded-full mr-3"></div>
                      {capability}
                    </li>
                  ))}
                </ul>
                <Button 
                  variant="legal" 
                  className="w-full group"
                  onClick={() => {
                    if (index === 0) {
                      // Navigate to document upload
                      document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' });
                    } else if (index === 1) {
                      // Navigate to document analysis for learning
                      document.getElementById('analysis')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      // Navigate to scenario simulator
                      document.getElementById('simulator')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  Explore Feature
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Statistics Section */}
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div className="animate-scale-in">
            <div className="legal-heading text-4xl text-secondary mb-2">98%</div>
            <p className="clause-text">User Satisfaction</p>
          </div>
          <div className="animate-scale-in">
            <div className="legal-heading text-4xl text-secondary mb-2">50K+</div>
            <p className="clause-text">Documents Analyzed</p>
          </div>
          <div className="animate-scale-in">
            <div className="legal-heading text-4xl text-secondary mb-2">15min</div>
            <p className="clause-text">Average Learning Time</p>
          </div>
          <div className="animate-scale-in">
            <div className="legal-heading text-4xl text-secondary mb-2">24/7</div>
            <p className="clause-text">Available Support</p>
          </div>
        </div>
      </div>
    </section>
  );
};