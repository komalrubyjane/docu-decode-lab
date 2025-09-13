import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, ArrowRight, RotateCcw, TreePine } from "lucide-react";

interface ScenarioChoice {
  id: string;
  text: string;
  consequence: string;
  risk: "low" | "medium" | "high";
  impact: string;
}

interface Scenario {
  id: string;
  title: string;
  description: string;
  situation: string;
  choices: ScenarioChoice[];
}

export const ScenarioSimulator = () => {
  const [currentScenario, setCurrentScenario] = useState<string>("employment");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [scenarioProgress, setScenarioProgress] = useState(0);

  const scenarios: Record<string, Scenario> = {
    employment: {
      id: "employment",
      title: "Employment Contract Termination",
      description: "Your employer wants to terminate your contract. What are your options?",
      situation: "You've been working at TechCorp for 2 years under an employment contract with a 30-day notice clause. Your manager just informed you that they want to terminate your employment. Based on your contract analysis, you have several options.",
      choices: [
        {
          id: "accept",
          text: "Accept the termination with 30-day notice",
          consequence: "You receive 30 days notice pay and can collect unemployment benefits. Clean exit with positive references.",
          risk: "low",
          impact: "Standard procedure with minimal legal complications."
        },
        {
          id: "negotiate",
          text: "Negotiate for better severance package",
          consequence: "Potential for additional compensation but may strain relationships. Success depends on your leverage.",
          risk: "medium",
          impact: "Could result in 1-3 months additional pay if successful."
        },
        {
          id: "legal",
          text: "Challenge the termination legally",
          consequence: "Expensive legal battle with uncertain outcomes. May damage your reputation in the industry.",
          risk: "high",
          impact: "Costs $10,000-50,000 in legal fees with 30% success rate."
        },
        {
          id: "counter",
          text: "Propose alternative arrangements (remote work, part-time)",
          consequence: "Shows flexibility and may preserve employment. Requires company buy-in and role suitability.",
          risk: "low",
          impact: "May preserve income stream while you search for new opportunities."
        }
      ]
    },
    privacy: {
      id: "privacy",
      title: "Data Privacy Breach Response",
      description: "A company has misused your personal data. How do you respond?",
      situation: "You discovered that SocialApp has been sharing your personal data with third parties without explicit consent, violating their privacy policy. You want to take action to protect your rights.",
      choices: [
        {
          id: "complaint",
          text: "File a complaint with data protection authority",
          consequence: "Official investigation may lead to company fines and policy changes. Free but slow process.",
          risk: "low",
          impact: "May take 6-18 months but could result in compensation and better practices."
        },
        {
          id: "lawsuit",
          text: "Join or initiate a class-action lawsuit",
          consequence: "Potential for significant monetary damages but requires proof of harm. Long legal process.",
          risk: "medium",
          impact: "Possible $100-1000 compensation per affected user if successful."
        },
        {
          id: "demand",
          text: "Send formal demand letter for data deletion and compensation",
          consequence: "Quick resolution possible but company may ignore. Sets up stronger legal position later.",
          risk: "low",
          impact: "May resolve quickly with $50-500 compensation for immediate deletion."
        },
        {
          id: "public",
          text: "Go public with social media campaign",
          consequence: "Public pressure may force quick action but could lead to defamation claims if overstated.",
          risk: "high",
          impact: "High visibility but legal risks if claims are exaggerated."
        }
      ]
    }
  };

  const scenario = scenarios[currentScenario];

  const handleChoiceSelect = (choiceId: string) => {
    setSelectedChoice(choiceId);
    setShowResult(true);
    setScenarioProgress(100);
  };

  const resetScenario = () => {
    setSelectedChoice(null);
    setShowResult(false);
    setScenarioProgress(0);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "success" as const;
      case "medium": return "warning" as const;
      case "high": return "destructive" as const;
      default: return "secondary" as const;
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "low": return <CheckCircle className="w-4 h-4" />;
      case "medium": return <AlertTriangle className="w-4 h-4" />;
      case "high": return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <section className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="legal-heading text-4xl md:text-5xl mb-6">
            Scenario <span className="text-secondary">Simulator</span>
          </h2>
          <p className="clause-text text-xl">
            Explore real-world legal scenarios and understand the consequences of different choices.
          </p>
        </div>

        {/* Scenario Selection */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2">
            <Button
              variant={currentScenario === "employment" ? "legal" : "outline"}
              onClick={() => {
                setCurrentScenario("employment");
                resetScenario();
              }}
            >
              Employment Contract
            </Button>
            <Button
              variant={currentScenario === "privacy" ? "legal" : "outline"}
              onClick={() => {
                setCurrentScenario("privacy");
                resetScenario();
              }}
            >
              Data Privacy
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Scenario Description */}
          <Card className="card-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="legal-heading text-2xl">{scenario.title}</CardTitle>
                <TreePine className="w-6 h-6 text-secondary" />
              </div>
              <CardDescription className="clause-text">
                {scenario.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="legal-heading text-sm mb-2">Situation:</h4>
                  <p className="clause-text text-sm leading-relaxed">
                    {scenario.situation}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="legal-heading text-sm">Scenario Progress</h4>
                    <span className="clause-text text-xs">{scenarioProgress}%</span>
                  </div>
                  <Progress value={scenarioProgress} className="h-2" />
                </div>

                {showResult && selectedChoice && (
                  <div className="space-y-4 animate-scale-in">
                    <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
                      <h4 className="legal-heading text-sm mb-2 flex items-center">
                        <CheckCircle className="w-4 h-4 text-success mr-2" />
                        Choice Made
                      </h4>
                      <p className="clause-text text-sm">
                        {scenario.choices.find(c => c.id === selectedChoice)?.text}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={resetScenario}
                      className="w-full"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Try Different Choice
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Choices or Results */}
          <div className="space-y-4">
            {!showResult ? (
              <>
                <h3 className="legal-heading text-xl mb-4">Choose Your Response:</h3>
                {scenario.choices.map((choice, index) => (
                  <Card 
                    key={choice.id} 
                    className="card-shadow hover:legal-shadow smooth-transition cursor-pointer group"
                    onClick={() => handleChoiceSelect(choice.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="legal-heading text-sm mb-2">{choice.text}</h4>
                          <Badge 
                            variant={getRiskColor(choice.risk)} 
                            className="text-xs"
                          >
                            {getRiskIcon(choice.risk)}
                            {choice.risk.toUpperCase()} RISK
                          </Badge>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-secondary smooth-transition" />
                      </div>
                      <p className="clause-text text-xs opacity-70">
                        Click to see the consequences of this choice
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <Card className="card-shadow animate-scale-in">
                <CardHeader>
                  <CardTitle className="legal-heading text-xl">Consequence Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const choice = scenario.choices.find(c => c.id === selectedChoice);
                    if (!choice) return null;

                    return (
                      <div className="space-y-6">
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="legal-heading text-sm mb-2">What Happens:</h4>
                          <p className="clause-text text-sm leading-relaxed mb-3">
                            {choice.consequence}
                          </p>
                          <Badge 
                            variant={getRiskColor(choice.risk)} 
                            className="text-xs"
                          >
                            {getRiskIcon(choice.risk)}
                            {choice.risk.toUpperCase()} RISK
                          </Badge>
                        </div>

                        <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
                          <h4 className="legal-heading text-sm mb-2">Expected Impact:</h4>
                          <p className="clause-text text-sm">
                            {choice.impact}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="legal-heading text-sm">Learn More:</h4>
                          <Button variant="clause" size="sm" className="w-full">
                            Understanding Your Rights
                          </Button>
                          <Button variant="outline" size="sm" className="w-full">
                            Similar Case Studies
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};