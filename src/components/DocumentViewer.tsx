import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Info, CheckCircle, HelpCircle, BookOpen, Lightbulb } from "lucide-react";

export const DocumentViewer = () => {
  const [selectedClause, setSelectedClause] = useState<number | null>(null);
  const [highlightedTerms, setHighlightedTerms] = useState<string[]>([]);

  const documentContent = [
    {
      id: 1,
      type: "title",
      content: "EMPLOYMENT AGREEMENT",
      risk: "low",
      explanation: "This is the main title of your employment contract."
    },
    {
      id: 2,
      type: "clause",
      content: "This Employment Agreement (\"Agreement\") is entered into on [Date] by and between [Company Name], a [State] corporation (\"Company\"), and [Employee Name] (\"Employee\").",
      risk: "low",
      explanation: "This is a standard opening clause that identifies the parties involved in the contract and when it was signed."
    },
    {
      id: 3,
      type: "clause",
      content: "Employee agrees to work exclusively for Company and shall not engage in any other employment, consulting, or business activities without prior written consent from Company.",
      risk: "high",
      explanation: "⚠️ IMPORTANT: This clause restricts your ability to work elsewhere or start side businesses. You need written permission for any other work activities.",
      keyTerms: ["exclusively", "written consent"]
    },
    {
      id: 4,
      type: "clause",
      content: "Company may terminate this agreement at any time, with or without cause, upon thirty (30) days written notice to Employee.",
      risk: "medium",
      explanation: "This means your employer can fire you for any reason (or no reason) with just 30 days notice. This is called 'at-will employment'.",
      keyTerms: ["terminate", "without cause"]
    },
    {
      id: 5,
      type: "clause",
      content: "All inventions, discoveries, and improvements made by Employee during employment shall be the exclusive property of Company.",
      risk: "high",
      explanation: "⚠️ CRITICAL: Anything you create while employed belongs to the company, even if done on your own time. This could include personal projects!",
      keyTerms: ["inventions", "exclusive property"]
    }
  ];

  const riskColors = {
    low: "success" as const,
    medium: "warning" as const,
    high: "destructive" as const
  };

  const riskIcons = {
    low: <CheckCircle className="w-4 h-4" />,
    medium: <AlertTriangle className="w-4 h-4" />,
    high: <AlertTriangle className="w-4 h-4" />
  };

  return (
    <section className="py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="legal-heading text-4xl md:text-5xl mb-6">
            Interactive Document <span className="text-secondary">Analysis</span>
          </h2>
          <p className="clause-text text-xl">
            Click on any clause to see detailed explanations and understand your rights.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Document Content */}
          <div className="lg:col-span-2">
            <Card className="card-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="legal-heading text-2xl">Sample Employment Contract</CardTitle>
                  <Badge variant="outline" className="text-secondary border-secondary">
                    AI Analyzed
                  </Badge>
                </div>
                <CardDescription className="clause-text">
                  Click on highlighted clauses to see explanations and risk assessments.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {documentContent.map((section) => (
                  <div key={section.id} className="space-y-2">
                    {section.type === "title" ? (
                      <h3 className="legal-heading text-xl text-center font-bold">
                        {section.content}
                      </h3>
                    ) : (
                      <div
                        className={`p-4 rounded-lg border-l-4 cursor-pointer smooth-transition ${
                          selectedClause === section.id 
                            ? "bg-secondary/10 border-secondary highlight-shadow" 
                            : "bg-background hover:bg-muted/50 border-muted-foreground/20"
                        }`}
                        onClick={() => setSelectedClause(selectedClause === section.id ? null : section.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Badge 
                            variant={riskColors[section.risk as keyof typeof riskColors]} 
                            className="text-xs"
                          >
                            {riskIcons[section.risk as keyof typeof riskIcons]}
                            {section.risk.toUpperCase()} RISK
                          </Badge>
                          <HelpCircle className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="clause-text leading-relaxed">
                          {section.content}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Explanation Panel */}
          <div className="space-y-6">
            {selectedClause ? (
              <Card className="explanation-panel card-shadow animate-scale-in">
                <CardHeader>
                  <CardTitle className="legal-heading text-xl flex items-center">
                    <Lightbulb className="w-5 h-5 text-secondary mr-2" />
                    Clause Explanation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const clause = documentContent.find(c => c.id === selectedClause);
                    if (!clause) return null;
                    
                    return (
                      <div className="space-y-4">
                        <p className="clause-text text-sm leading-relaxed">
                          {clause.explanation}
                        </p>
                        
                        {clause.keyTerms && (
                          <div>
                            <h4 className="legal-heading text-sm mb-2">Key Terms:</h4>
                            <div className="flex flex-wrap gap-2">
                              {clause.keyTerms.map((term, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {term}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <Button variant="clause" size="sm" className="w-full">
                          <BookOpen className="w-4 h-4 mr-2" />
                          Learn More About This
                        </Button>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            ) : (
              <Card className="card-shadow">
                <CardContent className="p-8 text-center">
                  <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="clause-text">
                    Select a clause from the document to see detailed explanations and risk assessments.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Document Statistics */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="legal-heading text-lg">Document Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="clause-text text-sm">High Risk Clauses</span>
                  <Badge variant="destructive">2</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="clause-text text-sm">Medium Risk Clauses</span>
                  <Badge variant="warning">1</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="clause-text text-sm">Low Risk Clauses</span>
                  <Badge variant="success">2</Badge>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="legal-heading text-sm">Overall Risk Score</span>
                    <Badge variant="warning" className="text-sm">MEDIUM</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="legal-heading text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="legal" size="sm" className="w-full">
                  Generate Summary
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Export Analysis
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Get Legal Review
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};