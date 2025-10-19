import { useState, useCallback } from 'react';
import useOpenRouterChat from '../common/useOpenRouterChat';

const useDynamicAIAssessment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { sendMessage } = useOpenRouterChat();

  const generateAssessment = useCallback(async (candidate, onComplete, language = 'en', jobInfo = null) => {
    if (!candidate) return;

    setIsLoading(true);
    setError(null);

    const generatePrompt = (c, lang, job) => {
        const profile = c.profile || {};
        const skills = c.skills ? c.skills.join(', ') : 'not specified';
        const summary = c.summary || c.ai_generated_summary || 'No summary provided.';
        const targetLanguage = lang === 'de' ? 'German' : 'English';
        
        // Extract job information
        const jobTitle = job?.title || c.bestJobMatch?.title || 'General Position';
        const jobLocation = job?.location || c.bestJobMatch?.location || 'Germany';
        const jobType = job?.job_type || c.bestJobMatch?.job_type || 'Not specified';
        const experienceLevel = job?.experience_level || c.bestJobMatch?.experience_level || 'Not specified';
        
        // Extract job requirements
        const jobRequirements = job?.requirements || c.bestJobMatch?.requirements || [];
        const requirementsText = Array.isArray(jobRequirements) 
          ? jobRequirements.join('\n- ') 
          : jobRequirements || 'No specific requirements listed';

        return `
          As an expert AI recruitment assistant for the German market, your task is to analyze the following candidate's profile for a specific job position. The overall match score is ${c.matchScore}%. Provide a detailed, realistic, and objective assessment in ${targetLanguage}. The candidate is looking for opportunities in Germany.

          **JOB POSITION CONTEXT:**
          - **Job Title:** ${jobTitle}
          - **Location:** ${jobLocation}
          - **Job Type:** ${jobType}
          - **Experience Level:** ${experienceLevel}
          
          **JOB REQUIREMENTS:**
          ${jobRequirements.length > 0 ? `- ${requirementsText}` : 'No specific requirements provided'}

          **CANDIDATE DETAILS:**
          - **ID:** ${c.id}
          - **Name:** ${c.name}
          - **Headline:** ${c.headline || 'N/A'}
          - **Experience:** ${c.experience_years || 'N/A'} years
          - **Current Location:** ${c.current_location || 'N/A'}
          - **Willing to Relocate:** ${c.willing_to_relocate ? 'Yes' : 'No'}
          - **Skills:** ${skills}
          - **Summary:** ${summary}
          
          Please provide specific insights about how this candidate would fit the "${jobTitle}" role, considering the specific job requirements listed above, location, and experience level. Focus on their suitability for this specific position and how well they meet each requirement.

          Your response MUST be a single, valid JSON object and nothing else. Do not include any introductory text, explanations, or markdown formatting like \`\`\`json.

          {
            "culturalFit": {
              "insights": [
                "A brief, one-sentence insight about their cultural suitability for this specific ${jobTitle} role in a German workplace.",
                "Another one-sentence insight about their potential team collaboration in this position.",
                "A third one-sentence insight on their adaptability to the ${jobTitle} role and German work culture."
              ]
            },
            "technicalAlignment": {
              "insights": [
                "A one-sentence analysis of how their skills align with the specific ${jobTitle} position requirements listed above.",
                "A one-sentence comment on their practical experience relevant to this ${jobTitle} role and its requirements.",
                "A final one-sentence technical insight about their fit for this specific position and requirement fulfillment."
              ]
            },
            "relocationReadiness": {
              "insights": [
                "A one-sentence assessment of their readiness to relocate for this ${jobTitle} position in ${jobLocation}.",
                "A one-sentence comment on potential relocation timeline factors for this specific role.",
                "A one-sentence insight about their motivation for this ${jobTitle} opportunity."
              ]
            },
            "riskFactors": [
              { "type": "low", "message": "A potential low-level risk specific to this ${jobTitle} position or its requirements." },
              { "type": "medium", "message": "A potential medium-level risk that might need attention for this role or requirement gaps." }
            ]
          }
        `;
      };
      
    const prompt = generatePrompt(candidate, language, jobInfo);

    try {
        const response = await sendMessage([{ type: 'user', content: prompt }]);
        
        console.log("Raw AI Response:", response.content);

        const cleanedResponse = response.content.replace(/```json/g, '').replace(/```/g, '').trim();
        
        if (!cleanedResponse) {
          throw new Error("AI returned an empty response.");
        }

        const parsedAssessment = JSON.parse(cleanedResponse);
        
        if (onComplete) {
            onComplete(parsedAssessment);
        }

    } catch (err) {
      console.error("Failed to generate or parse AI assessment:", err);
      let errorMessage = "Failed to generate AI insights. Please try again.";
      if (err instanceof SyntaxError) {
        errorMessage = "AI returned an invalid format. Please try regenerating."
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [sendMessage]);

  return { isLoading, error, generateAssessment };
};

export default useDynamicAIAssessment; 