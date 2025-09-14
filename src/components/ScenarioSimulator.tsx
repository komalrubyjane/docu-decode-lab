import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, ArrowRight, RotateCcw, TreePine, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [customScenarios, setCustomScenarios] = useState<Record<string, Scenario>>(() => {
    // Load custom scenarios from localStorage on component mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('customScenarios');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  const [isCreatingScenario, setIsCreatingScenario] = useState(false);
  const [editingScenario, setEditingScenario] = useState<string | null>(null);
  const [newScenario, setNewScenario] = useState<Partial<Scenario>>({
    title: '',
    description: '',
    situation: '',
    choices: []
  });
  const [newChoice, setNewChoice] = useState<Partial<ScenarioChoice>>({
    text: '',
    consequence: '',
    risk: 'low',
    impact: ''
  });
  const { toast } = useToast();

  // Save custom scenarios to localStorage whenever they change
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('customScenarios', JSON.stringify(customScenarios));
    }
  }, [customScenarios]);

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

  const allScenarios = { ...scenarios, ...customScenarios };
  const scenario = allScenarios[currentScenario];

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

  const addChoice = () => {
    if (!newChoice.text || !newChoice.consequence || !newChoice.impact) {
      toast({
        title: "Missing Information",
        description: "Please fill in all choice fields.",
        variant: "destructive",
      });
      return;
    }

    const choice: ScenarioChoice = {
      id: `choice_${Date.now()}`,
      text: newChoice.text!,
      consequence: newChoice.consequence!,
      risk: newChoice.risk as "low" | "medium" | "high",
      impact: newChoice.impact!
    };

    setNewScenario(prev => ({
      ...prev,
      choices: [...(prev.choices || []), choice]
    }));

    setNewChoice({
      text: '',
      consequence: '',
      risk: 'low',
      impact: ''
    });

    toast({
      title: "Choice Added",
      description: "Choice has been added to the scenario.",
    });
  };

  const removeChoice = (choiceId: string) => {
    setNewScenario(prev => ({
      ...prev,
      choices: prev.choices?.filter(c => c.id !== choiceId) || []
    }));
  };

  const saveScenario = () => {
    if (!newScenario.title || !newScenario.description || !newScenario.situation || !newScenario.choices?.length) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and add at least one choice.",
        variant: "destructive",
      });
      return;
    }

    const scenarioId = editingScenario || `custom_${Date.now()}`;
    const scenario: Scenario = {
      id: scenarioId,
      title: newScenario.title,
      description: newScenario.description,
      situation: newScenario.situation,
      choices: newScenario.choices
    };

    setCustomScenarios(prev => ({
      ...prev,
      [scenarioId]: scenario
    }));

    setNewScenario({
      title: '',
      description: '',
      situation: '',
      choices: []
    });
    setEditingScenario(null);
    setIsCreatingScenario(false);

    toast({
      title: "Scenario Saved",
      description: "Your custom scenario has been saved successfully.",
    });
  };

  const deleteScenario = (scenarioId: string) => {
    setCustomScenarios(prev => {
      const newScenarios = { ...prev };
      delete newScenarios[scenarioId];
      return newScenarios;
    });

    if (currentScenario === scenarioId) {
      setCurrentScenario("employment");
      resetScenario();
    }

    toast({
      title: "Scenario Deleted",
      description: "The scenario has been deleted.",
    });
  };

  const editScenario = (scenarioId: string) => {
    const scenario = customScenarios[scenarioId];
    if (scenario) {
      setNewScenario(scenario);
      setEditingScenario(scenarioId);
      setIsCreatingScenario(true);
    }
  };

  return (
    <section id="simulator" className="py-20 bg-background">
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
        <div className="flex flex-col items-center mb-8">
          <div className="flex flex-wrap gap-2 justify-center mb-4">
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
            {Object.values(customScenarios).map((scenario) => (
              <Button
                key={scenario.id}
                variant={currentScenario === scenario.id ? "legal" : "outline"}
                onClick={() => {
                  setCurrentScenario(scenario.id);
                  resetScenario();
                }}
                className="relative group"
              >
                {scenario.title}
                <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteScenario(scenario.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Button>
            ))}
          </div>
          
          <Dialog open={isCreatingScenario} onOpenChange={setIsCreatingScenario}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Create Custom Scenario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingScenario ? 'Edit Scenario' : 'Create Custom Scenario'}
                </DialogTitle>
                <DialogDescription>
                  Create your own legal scenario with multiple choice options and consequences.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Scenario Title *</Label>
                    <Input
                      id="title"
                      value={newScenario.title || ''}
                      onChange={(e) => setNewScenario(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Contract Dispute Resolution"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Input
                      id="description"
                      value={newScenario.description || ''}
                      onChange={(e) => setNewScenario(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the scenario"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="situation">Situation Details *</Label>
                  <Textarea
                    id="situation"
                    value={newScenario.situation || ''}
                    onChange={(e) => setNewScenario(prev => ({ ...prev, situation: e.target.value }))}
                    placeholder="Describe the legal situation in detail..."
                    rows={4}
                  />
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Add Choices</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="choice-text">Choice Text *</Label>
                      <Input
                        id="choice-text"
                        value={newChoice.text || ''}
                        onChange={(e) => setNewChoice(prev => ({ ...prev, text: e.target.value }))}
                        placeholder="What action would you take?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="choice-risk">Risk Level</Label>
                      <select
                        id="choice-risk"
                        value={newChoice.risk || 'low'}
                        onChange={(e) => setNewChoice(prev => ({ ...prev, risk: e.target.value as "low" | "medium" | "high" }))}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="low">Low Risk</option>
                        <option value="medium">Medium Risk</option>
                        <option value="high">High Risk</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="choice-consequence">Consequence *</Label>
                    <Textarea
                      id="choice-consequence"
                      value={newChoice.consequence || ''}
                      onChange={(e) => setNewChoice(prev => ({ ...prev, consequence: e.target.value }))}
                      placeholder="What happens as a result of this choice?"
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="choice-impact">Expected Impact *</Label>
                    <Input
                      id="choice-impact"
                      value={newChoice.impact || ''}
                      onChange={(e) => setNewChoice(prev => ({ ...prev, impact: e.target.value }))}
                      placeholder="e.g., Costs $500-1000, takes 2-4 weeks"
                    />
                  </div>
                  
                  <Button onClick={addChoice} className="w-full">
                    Add Choice
                  </Button>
                </div>
                
                {newScenario.choices && newScenario.choices.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Current Choices:</h4>
                    <div className="space-y-2">
                      {newScenario.choices.map((choice, index) => (
                        <div key={choice.id} className="p-3 border rounded-lg flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{choice.text}</p>
                            <p className="text-sm text-muted-foreground">{choice.consequence}</p>
                            <Badge variant={getRiskColor(choice.risk)} className="mt-1">
                              {choice.risk.toUpperCase()} RISK
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeChoice(choice.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreatingScenario(false);
                      setEditingScenario(null);
                      setNewScenario({
                        title: '',
                        description: '',
                        situation: '',
                        choices: []
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={saveScenario}>
                    {editingScenario ? 'Update Scenario' : 'Save Scenario'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
                          <Button 
                            variant="clause" 
                            size="sm" 
                            className="w-full group"
                            onClick={() => {
                              // Open a modal or navigate to educational content
                              window.open('https://www.nolo.com/legal-encyclopedia', '_blank');
                            }}
                          >
                            Understanding Your Rights
                            <ArrowRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full group"
                            onClick={() => {
                              // Scroll to other scenarios or show related content
                              resetScenario();
                              setCurrentScenario(currentScenario === 'employment' ? 'privacy' : 'employment');
                            }}
                          >
                            Similar Case Studies
                            <ArrowRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" />
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