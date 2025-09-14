import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const groqApiKey = Deno.env.get('OPENAI_API_KEY'); // Using same env var name for simplicity
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!groqApiKey) {
      throw new Error('Groq API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { documentId, content } = await req.json();
    console.log('Analyzing document:', documentId);

    // Update document status to processing
    await supabase
      .from('documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId);

    // Analyze document with Groq
    const analysisPrompt = `
You are a legal document expert. Analyze the following legal document and provide:

1. A simplified summary in plain language (2-3 paragraphs)
2. Risk assessment with levels (low, medium, high) and explanations
3. Key clauses with their implications
4. Important terms that need attention

Document content:
${content}

Respond ONLY with valid JSON in this exact format (no markdown, no backticks, no additional text):
{
  "simplified_summary": "Plain language summary...",
  "risk_assessment": {
    "overall_risk": "medium",
    "risk_factors": [
      {
        "level": "high",
        "clause": "Exclusivity clause text...",
        "explanation": "This restricts your ability to...",
        "key_terms": ["exclusively", "written consent"]
      }
    ]
  },
  "key_clauses": [
    {
      "id": 1,
      "content": "Clause text...",
      "risk": "high",
      "explanation": "Plain language explanation...",
      "key_terms": ["term1", "term2"]
    }
  ]
}
`;

    // Retry logic for rate limits
    let retries = 3;
    let response;
    
    while (retries > 0) {
      try {
        console.log(`Attempting Groq API call (${4 - retries}/3)`);
        
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              { 
                role: 'system', 
                content: 'You are a legal expert who explains complex legal documents in simple terms. Always respond with valid JSON only, no markdown formatting.' 
              },
              { role: 'user', content: analysisPrompt }
            ],
            max_tokens: 2000,
            temperature: 0.1,
          }),
        });

        if (response.ok) {
          console.log('Groq API call successful');
          break;
        } else if (response.status === 429) {
          console.log(`Rate limited, retrying in ${(4 - retries) * 2} seconds...`);
          await new Promise(resolve => setTimeout(resolve, (4 - retries) * 2000));
          retries--;
        } else {
          throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error(`API attempt failed:`, error);
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!response || !response.ok) {
      throw new Error('Failed to get response from Groq API after retries');
    }

    const aiResponse = await response.json();
    console.log('Groq response received:', JSON.stringify(aiResponse, null, 2));

    if (!aiResponse.choices || !aiResponse.choices[0] || !aiResponse.choices[0].message) {
      throw new Error('Invalid Groq API response structure');
    }

    let analysisResult;
    try {
      const responseContent = aiResponse.choices[0].message.content.trim();
      console.log('Raw AI response content:', responseContent);
      
      // Remove any markdown formatting if present
      const cleanContent = responseContent.replace(/```json\n?|\n?```/g, '').trim();
      console.log('Cleaned content:', cleanContent);
      
      analysisResult = JSON.parse(cleanContent);
      console.log('Parsed analysis result:', JSON.stringify(analysisResult, null, 2));
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      console.error('Response content was:', aiResponse.choices[0].message.content);
      throw new Error(`Invalid AI response format: ${e.message}`);
    }

    // Store analysis in database
    const { data: analysisData, error: analysisError } = await supabase
      .from('document_analyses')
      .insert({
        document_id: documentId,
        original_content: content,
        simplified_summary: analysisResult.simplified_summary,
        risk_assessment: analysisResult.risk_assessment,
        key_clauses: analysisResult.key_clauses
      })
      .select()
      .single();

    if (analysisError) {
      console.error('Database error:', analysisError);
      throw analysisError;
    }

    // Update document status to completed
    await supabase
      .from('documents')
      .update({ processing_status: 'completed' })
      .eq('id', documentId);

    console.log('Analysis completed successfully');

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-document function:', error);

    // Update document status to failed if documentId exists
    try {
      if (req.method === 'POST') {
        const requestBody = await req.clone().json();
        const documentId = requestBody?.documentId;
        
        if (documentId) {
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          
          await supabase
            .from('documents')
            .update({ processing_status: 'failed' })
            .eq('id', documentId);
        }
      }
    } catch (e) {
      console.error('Failed to update document status:', e);
    }

    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});