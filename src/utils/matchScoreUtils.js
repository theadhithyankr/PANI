/**
 * Shared utility functions for calculating match scores
 * Ensures consistency across all components
 */

/**
 * Calculate match score based on skills using consistent logic
 * @param {Array} userSkills - Array of user skills
 * @param {Array} jobSkills - Array of job required skills
 * @returns {number} Match score between 60-95
 */
export const calculateMatchScore = (userSkills, jobSkills) => {
  if (!userSkills.length || !jobSkills.length) return 85; // Default score if no skills specified
  
  const matchedSkills = userSkills.filter(skill => 
    jobSkills.some(jobSkill => 
      jobSkill.toLowerCase().includes(skill.toLowerCase()) || 
      skill.toLowerCase().includes(jobSkill.toLowerCase())
    )
  );
  
  const matchPercentage = (matchedSkills.length / jobSkills.length) * 100;
  // Ensure score is between 60-95 for realistic values
  return Math.max(60, Math.min(95, Math.round(matchPercentage)));
};

/**
 * Get match score color based on score
 * @param {number} score - Match score (0-100)
 * @returns {string} CSS classes for styling
 */
export const getMatchScoreColor = (score) => {
  if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

/**
 * Get match score label based on score
 * @param {number} score - Match score (0-100)
 * @returns {string} Human-readable label
 */
export const getMatchScoreLabel = (score) => {
  if (score >= 80) return 'Excellent Match';
  if (score >= 60) return 'Good Match';
  if (score >= 40) return 'Fair Match';
  return 'Poor Match';
};






















