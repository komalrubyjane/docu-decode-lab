import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Info, CheckCircle, HelpCircle, BookOpen, Lightbulb, Download, FileText, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// Animated counter component
const AnimatedCounter = ({ value, duration = 1000 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setCount(Math.floor(progress * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return <span className="font-bold">{count}</span>;
};

// Document Statistics Component
const DocumentStatistics = ({ analysis, documentContent, forceUpdate }: { 
  analysis: any; 
  documentContent: any[]; 
  forceUpdate: number;
}) => {
  // Calculate statistics from real analysis data
  const clauses = Array.isArray(documentContent) ? documentContent : [];
  console.log('DocumentStatistics - Analysis:', analysis);
  console.log('DocumentStatistics - Document content:', documentContent);
  console.log('DocumentStatistics - Clauses array:', clauses);
  console.log('DocumentStatistics - Force update:', forceUpdate);
  
  // If we have analysis data, try to get risk assessment from it
  let riskAssessment = null;
  if (analysis && analysis.risk_assessment) {
    riskAssessment = analysis.risk_assessment;
    console.log('DocumentStatistics - Risk assessment from analysis:', riskAssessment);
  }
  
  // Calculate risk counts from clauses
  const highRisk = clauses.filter((clause: any) => {
    if (!clause) return false;
    const risk = clause.risk || clause.risk_level || clause.riskLevel;
    return risk && (risk.toLowerCase() === 'high' || risk === 'HIGH');
  }).length;
  
  const mediumRisk = clauses.filter((clause: any) => {
    if (!clause) return false;
    const risk = clause.risk || clause.risk_level || clause.riskLevel;
    return risk && (risk.toLowerCase() === 'medium' || risk === 'MEDIUM');
  }).length;
  
  const lowRisk = clauses.filter((clause: any) => {
    if (!clause) return false;
    const risk = clause.risk || clause.risk_level || clause.riskLevel;
    return risk && (risk.toLowerCase() === 'low' || risk === 'LOW');
  }).length;
  
  // If no clauses have risk data, try to get from risk_assessment
  let finalHighRisk = highRisk;
  let finalMediumRisk = mediumRisk;
  let finalLowRisk = lowRisk;
  
  if (highRisk === 0 && mediumRisk === 0 && lowRisk === 0 && riskAssessment) {
    // Try to extract risk counts from risk_assessment
    if (Array.isArray(riskAssessment.risk_factors)) {
      finalHighRisk = riskAssessment.risk_factors.filter((factor: any) => 
        factor.level && factor.level.toLowerCase() === 'high'
      ).length;
      finalMediumRisk = riskAssessment.risk_factors.filter((factor: any) => 
        factor.level && factor.level.toLowerCase() === 'medium'
      ).length;
      finalLowRisk = riskAssessment.risk_factors.filter((factor: any) => 
        factor.level && factor.level.toLowerCase() === 'low'
      ).length;
    }
  }
  
  // If still no data, show a message that analysis is in progress
  if (finalHighRisk === 0 && finalMediumRisk === 0 && finalLowRisk === 0) {
    console.log('DocumentStatistics - No risk data found, showing analysis in progress');
    return (
      <div className="space-y-4">
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-secondary mx-auto mb-2"></div>
          <p className="clause-text text-sm">Analyzing document risks...</p>
        </div>
      </div>
    );
  }
  
  // Calculate overall risk
  let overallRisk = 'LOW';
  if (finalHighRisk > 0) overallRisk = 'HIGH';
  else if (finalMediumRisk > 0) overallRisk = 'MEDIUM';
  
  console.log('DocumentStatistics - Final risk counts:', { 
    highRisk: finalHighRisk, 
    mediumRisk: finalMediumRisk, 
    lowRisk: finalLowRisk, 
    overallRisk 
  });
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center animate-fade-in">
        <span className="clause-text text-sm">High Risk Clauses</span>
        <Badge variant="destructive" className="animate-scale-in">
          <AnimatedCounter value={finalHighRisk} />
        </Badge>
      </div>
      <div className="flex justify-between items-center animate-fade-in">
        <span className="clause-text text-sm">Medium Risk Clauses</span>
        <Badge variant="warning" className="animate-scale-in">
          <AnimatedCounter value={finalMediumRisk} />
        </Badge>
      </div>
      <div className="flex justify-between items-center animate-fade-in">
        <span className="clause-text text-sm">Low Risk Clauses</span>
        <Badge variant="success" className="animate-scale-in">
          <AnimatedCounter value={finalLowRisk} />
        </Badge>
      </div>
      <div className="pt-4 border-t animate-fade-in">
        <div className="flex justify-between items-center">
          <span className="legal-heading text-sm">Overall Risk Score</span>
          <Badge 
            variant={overallRisk === 'HIGH' ? 'destructive' : overallRisk === 'MEDIUM' ? 'warning' : 'success'} 
            className="text-sm animate-scale-in"
          >
            {overallRisk}
          </Badge>
        </div>
      </div>
    </div>
  );
};

interface DocumentViewerProps {
  analysisId?: string;
}

export const DocumentViewer = ({ analysisId }: DocumentViewerProps) => {
  const [selectedClause, setSelectedClause] = useState<number | null>(null);
  const [highlightedTerms, setHighlightedTerms] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (analysisId) {
      loadAnalysis();
    }
  }, [analysisId]);

  // Force re-render when analysis changes
  useEffect(() => {
    if (analysis) {
      console.log('Analysis updated:', analysis);
    }
  }, [analysis]);

  const loadAnalysis = async () => {
    if (!analysisId) return;
    
    setLoading(true);
    try {
      console.log('Loading analysis for ID:', analysisId);
      const { data, error } = await supabase
        .from('document_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('Loaded analysis data:', data);
      setAnalysis(data);
      
      // Force a re-render
      setForceUpdate(prev => prev + 1);
    } catch (error) {
      console.error('Error loading analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const { toast } = useToast();

  const handleGenerateSummary = async () => {
    if (!analysis) return;
    
    try {
      // Generate a more detailed summary using AI
      const { data, error } = await supabase.functions
        .invoke('analyze-document', {
          body: {
            documentId: analysis.document_id,
            content: analysis.original_content,
            action: 'generate_summary'
          }
        });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Summary Generated",
          description: "A detailed summary has been generated and added to your analysis.",
        });
        // Reload analysis to get updated data
        loadAnalysis();
      }
    } catch (error: any) {
      console.error('Error generating summary:', error);
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportAnalysis = () => {
    if (!analysis) return;

    const exportData = {
      document: {
        filename: analysis.document_id,
        analysisDate: analysis.analysis_date,
        summary: analysis.simplified_summary,
      },
      riskAssessment: analysis.risk_assessment,
      keyClauses: analysis.key_clauses,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legal-analysis-${analysis.document_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Analysis Exported",
      description: "Your document analysis has been downloaded as a JSON file.",
    });
  };

  const handleGetLegalReview = () => {
    if (!analysis) return;

    // Open a new window with legal review options
    const reviewWindow = window.open('', '_blank', 'width=800,height=600');
    if (reviewWindow) {
      reviewWindow.document.write(`
        <html>
          <head>
            <title>Legal Review Options</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .option { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
              .option h3 { margin-top: 0; color: #2563eb; }
              .option p { margin: 10px 0; }
              .button { 
                background: #2563eb; color: white; padding: 10px 20px; 
                border: none; border-radius: 4px; cursor: pointer; 
                text-decoration: none; display: inline-block;
              }
              .button:hover { background: #1d4ed8; }
            </style>
          </head>
          <body>
            <h1>Legal Review Options</h1>
            <p>Based on your document analysis, here are your options for professional legal review:</p>
            
            <div class="option">
              <h3>1. Free Legal Consultation</h3>
              <p>Get a free 30-minute consultation with a qualified attorney to discuss your document.</p>
              <a href="https://www.avvo.com/free-legal-advice" target="_blank" class="button">Find Free Consultation</a>
            </div>
            
            <div class="option">
              <h3>2. Document Review Service</h3>
              <p>Professional document review starting at $150 for basic contracts.</p>
              <a href="https://www.legalzoom.com/document-review" target="_blank" class="button">Get Document Review</a>
            </div>
            
            <div class="option">
              <h3>3. Local Attorney Search</h3>
              <p>Find a local attorney specializing in your type of legal matter.</p>
              <a href="https://www.avvo.com/find-a-lawyer" target="_blank" class="button">Find Local Attorney</a>
            </div>
            
            <div class="option">
              <h3>4. Legal Aid Society</h3>
              <p>Free or low-cost legal assistance for qualifying individuals.</p>
              <a href="https://www.lsc.gov/find-legal-aid" target="_blank" class="button">Find Legal Aid</a>
            </div>
            
            <p><strong>Note:</strong> This analysis is for educational purposes only and does not constitute legal advice.</p>
          </body>
        </html>
      `);
    }

    toast({
      title: "Legal Review Options",
      description: "A new window has opened with legal review options for your document.",
    });
  };

  const documentContent = analysis?.key_clauses || [];
  
  // Debug logging to see what data we have
  console.log('=== DOCUMENT VIEWER DEBUG ===');
  console.log('Analysis ID:', analysisId);
  console.log('Analysis data:', analysis);
  console.log('Document content (key_clauses):', documentContent);
  console.log('Analysis key_clauses:', analysis?.key_clauses);
  console.log('Analysis risk_assessment:', analysis?.risk_assessment);
  console.log('Analysis simplified_summary:', analysis?.simplified_summary);
  console.log('================================');
  
  // If we have analysis but no key_clauses, show a message
  if (analysis && (!analysis.key_clauses || analysis.key_clauses.length === 0)) {
    console.log('Analysis exists but no key_clauses found:', analysis);
  }

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

  if (loading) {
    return (
      <section className="py-20 bg-muted">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
          <p className="clause-text">Loading document analysis...</p>
        </div>
      </section>
    );
  }

  if (!analysis && !analysisId) {
    return (
      <section className="py-20 bg-muted">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Info className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="legal-heading text-2xl mb-4">No Document Analyzed</h3>
          <p className="clause-text">Upload and analyze a document to see the interactive analysis here.</p>
          <div className="mt-6">
            <Button 
              variant="legal" 
              onClick={() => document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Upload Document
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (analysis && documentContent.length === 0) {
    return (
      <section className="py-20 bg-muted">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Info className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="legal-heading text-2xl mb-4">Analysis in Progress</h3>
          <p className="clause-text">Your document is being analyzed. Please wait a moment and refresh the page.</p>
          <div className="mt-4 space-x-2">
            <Button 
              variant="legal" 
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
            <Button 
              variant="outline" 
              onClick={() => loadAnalysis()}
            >
              Retry Analysis
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="analysis" className="py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="legal-heading text-4xl md:text-5xl mb-6">
            Interactive Document <span className="text-secondary">Analysis</span>
          </h2>
          <p className="clause-text text-xl">
            Click on any clause to see detailed explanations and understand your rights.
          </p>
          {analysis && (
            <div className="mt-6 p-4 bg-background rounded-lg border max-w-4xl mx-auto">
              <h3 className="legal-heading text-lg mb-2">Document Summary</h3>
              <p className="clause-text text-sm">{analysis.simplified_summary}</p>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Document Content */}
          <div className="lg:col-span-2">
            <Card className="card-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="legal-heading text-2xl">
                    {analysis ? 'Your Document Analysis' : 'Sample Employment Contract'}
                  </CardTitle>
                  <Badge variant="outline" className="text-secondary border-secondary">
                    AI Analyzed
                  </Badge>
                </div>
                <CardDescription className="clause-text">
                  Click on highlighted clauses to see explanations and risk assessments.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {documentContent.map((section, index) => (
                  <div key={section.id} className="space-y-2 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    {section.type === "title" ? (
                      <h3 className="legal-heading text-xl text-center font-bold animate-slide-in-right">
                        {section.content}
                      </h3>
                    ) : (
                      <div
                        className={`p-4 rounded-lg border-l-4 cursor-pointer smooth-transition animate-scale-in ${
                          selectedClause === section.id 
                            ? "bg-secondary/10 border-secondary highlight-shadow" 
                            : "bg-background hover:bg-muted/50 border-muted-foreground/20"
                        }`}
                        onClick={() => setSelectedClause(selectedClause === section.id ? null : section.id)}
                        style={{ animationDelay: `${index * 0.1}s` }}
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
              <Card className="explanation-panel card-shadow animate-bounce-in">
                <CardHeader>
                  <CardTitle className="legal-heading text-xl flex items-center animate-slide-in-right">
                    <Lightbulb className="w-5 h-5 text-secondary mr-2 animate-pulse" />
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
                        
                        {(clause.key_terms || clause.keyTerms) && (
                          <div>
                            <h4 className="legal-heading text-sm mb-2">Key Terms:</h4>
                            <div className="flex flex-wrap gap-2">
                              {(clause.key_terms || clause.keyTerms || []).map((term: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {term}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <Button 
                          variant="clause" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            // Open educational content about the selected clause
                            const clause = documentContent.find(c => c.id === selectedClause);
                            if (clause) {
                              const searchTerm = encodeURIComponent(clause.key_terms?.[0] || clause.content.split(' ')[0]);
                              window.open(`https://www.nolo.com/legal-encyclopedia?q=${searchTerm}`, '_blank');
                            }
                          }}
                        >
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
                <DocumentStatistics 
                  analysis={analysis} 
                  documentContent={documentContent} 
                  forceUpdate={forceUpdate}
                />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="legal-heading text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="legal" 
                  size="sm" 
                  className="w-full"
                  onClick={handleGenerateSummary}
                  disabled={!analysis}
                >
                  Generate Summary
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleExportAnalysis}
                  disabled={!analysis}
                >
                  Export Analysis
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleGetLegalReview}
                  disabled={!analysis}
                >
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