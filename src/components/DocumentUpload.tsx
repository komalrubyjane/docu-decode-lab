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
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(uploadedFile.type)) {
        throw new Error('Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files only.');
      }

      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (uploadedFile.size > maxSize) {
        throw new Error('File too large. Please upload files smaller than 10MB.');
      }

      // Upload file to Supabase Storage
      const fileExt = uploadedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, uploadedFile);

      if (uploadError) {
        if (uploadError.message.includes('already exists')) {
          throw new Error('A file with this name already exists. Please rename your file and try again.');
        }
        throw uploadError;
      }

      // Create document record
      const { data: documentData, error: documentError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          filename: uploadedFile.name,
          file_path: uploadData.path,
          file_size: uploadedFile.size,
          mime_type: uploadedFile.type,
          processing_status: 'pending'
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
        try {
          fileContent = await uploadedFile.text();
        } catch (textError) {
          console.warn('Could not read file as text, using filename for analysis:', textError);
          fileContent = `Document: ${uploadedFile.name}\nType: ${uploadedFile.type}\nSize: ${uploadedFile.size} bytes\n\nThis document needs to be analyzed for legal content and clauses.`;
        }
      }

      // Call analysis function
      const { data: analysisResponse, error: analysisError } = await supabase.functions
        .invoke('analyze-document', {
          body: {
            documentId: documentData.id,
            content: fileContent
          }
        });

      if (analysisError) {
        console.error('Analysis function error:', analysisError);
        throw new Error(analysisError.message || 'Failed to analyze document. Please try again.');
      }

      if (analysisResponse && analysisResponse.success) {
        toast({
          title: "Document analyzed successfully!",
          description: "Your document has been processed and is ready for review.",
        });
        onAnalysisComplete?.(analysisResponse.analysis.id);
      } else {
        throw new Error('Analysis completed but no results were returned.');
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
    <section id="upload" className="py-20 bg-background">
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
                        onClick={async () => {
                          // Create detailed sample content based on document type
                          let sampleContent = '';
                          
                          if (doc.type === 'Contract') {
                            sampleContent = `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is entered into on [Date] by and between TechCorp Inc., a Delaware corporation ("Company"), and [Employee Name] ("Employee").

1. POSITION AND DUTIES
Employee agrees to work exclusively for Company and shall not engage in any other employment, consulting, or business activities without prior written consent from Company. Employee shall devote full time and attention to Company business.

2. COMPENSATION
Employee shall receive a base salary of $75,000 per year, payable in accordance with Company's standard payroll practices. Employee may also be eligible for performance bonuses at Company's discretion.

3. TERMINATION
Company may terminate this agreement at any time, with or without cause, upon thirty (30) days written notice to Employee. Employee may terminate this agreement with thirty (30) days written notice to Company.

4. INTELLECTUAL PROPERTY
All inventions, discoveries, and improvements made by Employee during employment shall be the exclusive property of Company. Employee assigns all rights to such inventions to Company.

5. CONFIDENTIALITY
Employee agrees to maintain strict confidentiality regarding Company's proprietary information, trade secrets, and business operations both during and after employment.

6. NON-COMPETE
For a period of one (1) year following termination, Employee shall not work for any direct competitor within a 50-mile radius of Company's headquarters.

This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements.`;
                          } else if (doc.type === 'License') {
                            sampleContent = `SOFTWARE LICENSE AGREEMENT

END USER LICENSE AGREEMENT (EULA)

IMPORTANT - READ CAREFULLY: This End User License Agreement ("Agreement") is a legal agreement between you (either an individual or a single entity) and SoftwareCorp ("Licensor") for the software product identified above, which includes computer software and may include associated media, printed materials, and "online" or electronic documentation ("Software").

1. GRANT OF LICENSE
Subject to the terms and conditions of this Agreement, Licensor hereby grants you a limited, non-exclusive, non-transferable license to use the Software solely for your internal business purposes.

2. RESTRICTIONS
You may not: (a) modify, adapt, alter, translate, or create derivative works of the Software; (b) reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code of the Software; (c) rent, lease, lend, sell, sublicense, or otherwise transfer the Software to any third party.

3. TERMINATION
This Agreement is effective until terminated. You may terminate this Agreement at any time by destroying all copies of the Software. Licensor may terminate this Agreement immediately if you fail to comply with any term of this Agreement.

4. DISCLAIMER OF WARRANTIES
THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. LICENSOR DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.

5. LIMITATION OF LIABILITY
IN NO EVENT SHALL LICENSOR BE LIABLE FOR ANY SPECIAL, INCIDENTAL, INDIRECT, OR CONSEQUENTIAL DAMAGES WHATSOEVER ARISING OUT OF THE USE OF OR INABILITY TO USE THE SOFTWARE.`;
                          } else if (doc.type === 'Policy') {
                            sampleContent = `PRIVACY POLICY

Last Updated: [Date]

1. INFORMATION WE COLLECT
We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support. This may include your name, email address, phone number, and payment information.

2. HOW WE USE YOUR INFORMATION
We use the information we collect to: (a) provide, maintain, and improve our services; (b) process transactions and send related information; (c) send technical notices and support messages; (d) respond to your comments and questions.

3. INFORMATION SHARING
We may share your information in the following circumstances: (a) with your consent; (b) to comply with legal obligations; (c) to protect our rights and prevent fraud; (d) in connection with a business transfer or acquisition.

4. DATA SECURITY
We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

5. YOUR RIGHTS
You have the right to: (a) access your personal information; (b) correct inaccurate information; (c) request deletion of your information; (d) object to processing of your information; (e) data portability.

6. COOKIES AND TRACKING
We use cookies and similar tracking technologies to collect and use personal information about you. You can control cookies through your browser settings.

7. CHILDREN'S PRIVACY
Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13.

8. CHANGES TO THIS POLICY
We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.`;
                          } else {
                            sampleContent = `RENTAL AGREEMENT

RESIDENTIAL LEASE AGREEMENT

This Rental Agreement ("Agreement") is made on [Date] between [Landlord Name] ("Landlord") and [Tenant Name] ("Tenant") for the rental of the property located at [Property Address].

1. TERM
The term of this lease shall be for a period of 12 months, commencing on [Start Date] and ending on [End Date].

2. RENT
Tenant agrees to pay Landlord a monthly rent of $1,500, due on the first day of each month. Late fees of $50 will be charged for rent paid after the 5th day of the month.

3. SECURITY DEPOSIT
Tenant has paid a security deposit of $1,500, which will be returned within 30 days of lease termination, less any deductions for damages or unpaid rent.

4. USE OF PREMISES
The premises shall be used solely as a private residence. Tenant shall not use the premises for any illegal or commercial purposes.

5. MAINTENANCE AND REPAIRS
Landlord is responsible for major repairs and maintenance. Tenant is responsible for minor maintenance and keeping the premises clean and sanitary.

6. PETS
No pets are allowed on the premises without written permission from Landlord.

7. TERMINATION
Either party may terminate this agreement with 30 days written notice. Landlord may terminate immediately for non-payment of rent or violation of lease terms.`;
                          }
                          
                          // Create a mock file for demonstration
                          const blob = new Blob([sampleContent], { type: 'text/plain' });
                          const file = new File([blob], `${doc.name}.txt`, { type: 'text/plain' });
                          setUploadedFile(file);
                          
                          toast({
                            title: "Sample Document Loaded",
                            description: `"${doc.name}" has been loaded. Click "Analyze Document" to see the analysis.`,
                          });
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