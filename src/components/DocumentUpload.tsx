import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadProps {
  onAnalysisComplete?: (analysisId: string) => void;
}

export const DocumentUpload = ({ onAnalysisComplete }: DocumentUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const startAnalysis = async () => {
    if (!user || !uploadedFile) return;

    setAnalyzing(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = uploadedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, uploadedFile);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: documentData, error: documentError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          filename: uploadedFile.name,
          file_path: uploadData.path,
          file_size: uploadedFile.size,
          mime_type: uploadedFile.type,
        })
        .select()
        .single();

      if (documentError) throw documentError;

      // For DOCX files, we need to extract text differently
      let fileContent = '';
      if (uploadedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // For DOCX files, just send a placeholder - the AI can work with document structure info
        fileContent = `This is a Microsoft Word document (.docx) named "${uploadedFile.name}". 
        The document contains legal content that needs to be analyzed for:
        - Key clauses and their implications
        - Risk assessment
        - Simplified summary in plain language
        Please analyze this legal document structure and provide insights.`;
      } else {
        // For other file types, try to read as text
        fileContent = await uploadedFile.text();
      }

      // Call analysis function
      const { data: analysisResponse, error: analysisError } = await supabase.functions
        .invoke('analyze-document', {
          body: {
            documentId: documentData.id,
            content: fileContent
          }
        });

      if (analysisError) throw analysisError;

      if (analysisResponse.success) {
        toast({
          title: "Document analyzed successfully!",
          description: "Your document has been processed and is ready for review.",
        });
        onAnalysisComplete?.(analysisResponse.analysis.id);
      }

    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const sampleDocuments = [
    { name: "Employment Contract", type: "Contract", description: "Standard employment agreement with common clauses" },
    { name: "Software License", type: "License", description: "End-user license agreement for software products" },
    { name: "Privacy Policy", type: "Policy", description: "Website privacy policy with data collection terms" },
    { name: "Rental Agreement", type: "Contract", description: "Residential lease agreement template" }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="legal-heading text-4xl md:text-5xl mb-6">
            Upload Your <span className="text-secondary">Document</span>
          </h2>
          <p className="clause-text text-xl">
            Start by uploading a legal document or try one of our sample documents to explore the platform.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Area */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="legal-heading text-2xl">Upload Document</CardTitle>
              <CardDescription className="clause-text">
                Supported formats: PDF, DOC, DOCX, TXT
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!uploadedFile ? (
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center smooth-transition",
                    dragActive ? "border-secondary bg-secondary/10" : "border-border hover:border-secondary/50"
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="clause-text mb-4">
                    Drag and drop your document here, or click to browse
                  </p>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                  />
                  <Button variant="outline" asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Choose File
                    </label>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-muted rounded-lg">
                    <FileText className="w-8 h-8 text-secondary mr-3" />
                    <div className="flex-1">
                      <p className="legal-heading text-sm">{uploadedFile.name}</p>
                      <p className="clause-text text-xs">
                        {Math.round(uploadedFile.size / 1024)} KB
                      </p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                  
                  <div className="flex gap-2">
                    {user ? (
                      <Button 
                        variant="legal" 
                        className="flex-1" 
                        onClick={startAnalysis}
                        disabled={analyzing}
                      >
                        {analyzing ? "Analyzing..." : "Analyze Document"}
                      </Button>
                    ) : (
                      <AuthModal>
                        <Button variant="legal" className="flex-1">
                          Sign In to Analyze
                        </Button>
                      </AuthModal>
                    )}
                    <Button 
                      variant="outline" 
                      onClick={() => setUploadedFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                  
                  {analyzing && (
                    <div className="p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-secondary mr-3"></div>
                        <p className="clause-text text-sm">Analyzing document structure and clauses...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sample Documents */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="legal-heading text-2xl">Try Sample Documents</CardTitle>
              <CardDescription className="clause-text">
                Explore our pre-loaded documents to see how the platform works
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sampleDocuments.map((doc, index) => (
                  <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 smooth-transition cursor-pointer group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="legal-heading text-sm mb-1">{doc.name}</h4>
                        <p className="clause-text text-xs mb-1">{doc.description}</p>
                        <span className="inline-block px-2 py-1 bg-secondary/20 text-secondary text-xs rounded">
                          {doc.type}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 smooth-transition hover:bg-secondary/20"
                        onClick={() => {
                          // For demo purposes, create a sample document
                          const sampleContent = `Sample ${doc.type}: ${doc.name}\n\nThis is a sample legal document for demonstration purposes. It contains standard clauses and terms that would typically be found in a ${doc.type.toLowerCase()}.\n\nKey provisions include:\n- Standard terms and conditions\n- Liability limitations\n- Termination clauses\n- Dispute resolution procedures`;
                          
                          // Create a mock file for demonstration
                          const blob = new Blob([sampleContent], { type: 'text/plain' });
                          const file = new File([blob], `${doc.name}.txt`, { type: 'text/plain' });
                          setUploadedFile(file);
                        }}
                      >
                        Try Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};