/**
 * Unified job-candidate match score utilities
 * Returns a 0-100 integer percentage using consistent weights across the app.
 */

/**
 * Compute weighted experience score (0-100)
 */
function getExperienceMatchScore(jobExperienceLevel, candidateYears) {
  if (!jobExperienceLevel || candidateYears === null || candidateYears === undefined) return 0;
  const level = String(jobExperienceLevel).toLowerCase();
  const years = Number(candidateYears) || 0;
  if (level.includes('entry')) return years <= 2 ? 100 : years <= 3 ? 80 : 40;
  if (level.includes('mid')) return years >= 2 && years <= 5 ? 100 : years === 1 || years === 6 ? 70 : 40;
  if (level.includes('senior')) return years >= 5 ? 100 : years >= 4 ? 80 : 50;
  return 60;
}

/**
 * Compute location score (0-100)
 */
function getLocationMatchScore(candidate, job) {
  if (!candidate?.current_location || !job?.location) return 0;
  const cand = String(candidate.current_location).toLowerCase();
  const jobLoc = String(job.location).toLowerCase();
  if (cand === jobLoc) return 100;
  return cand.includes(jobLoc) || jobLoc.includes(cand) ? 80 : 40;
}

/**
 * Compute salary score (0-100)
 */
function getSalaryMatchScore(candidateRange, jobRange) {
  if (!candidateRange || !jobRange) return 0;
  const cMin = Number(candidateRange.min) || 0;
  const cMax = Number(candidateRange.max) || cMin;
  const jMin = Number(jobRange.min) || 0;
  const jMax = Number(jobRange.max) || jMin;
  if (cMin === 0 && cMax === 0 && jMin === 0 && jMax === 0) return 60;
  // Full overlap or candidate within job range
  if (cMin >= jMin && cMax <= jMax) return 100;
  // Partial overlap
  const overlap = Math.max(0, Math.min(cMax, jMax) - Math.max(cMin, jMin));
  const candidateSpan = Math.max(1, cMax - cMin);
  const ratio = Math.max(0, Math.min(1, overlap / candidateSpan));
  return Math.round(60 + ratio * 40);
}

/**
 * Compute language score (0-100)
 */
function getLanguageMatchScore(preferredLanguage, candidateLanguages) {
  if (!preferredLanguage) return 0;
  if (!candidateLanguages || candidateLanguages.length === 0) return 0;
  const target = String(preferredLanguage).toLowerCase();
  const has = candidateLanguages.some((l) => String(l).toLowerCase().includes(target) || target.includes(String(l).toLowerCase()));
  return has ? 100 : 40;
}

/**
 * Compute skills score (0-100)
 */
function getSkillsMatchScore(jobSkills, userSkills) {
  if (!jobSkills || jobSkills.length === 0) return 0;
  if (!userSkills || userSkills.length === 0) return 0;
  const matched = jobSkills.filter((req) =>
    userSkills.some((s) => String(req).toLowerCase().includes(String(s).toLowerCase()) || String(s).toLowerCase().includes(String(req).toLowerCase()))
  );
  return Math.round((matched.length / jobSkills.length) * 100);
}

/**
 * Compute preference match (job type) score (0-100)
 */
function getJobTypePreferenceScore(candidatePreferredTypes, jobType) {
  if (!candidatePreferredTypes || candidatePreferredTypes.length === 0 || !jobType) return 0;
  return candidatePreferredTypes.includes(jobType) ? 100 : 40;
}

/**
 * Compute unified match score (0-100 integer)
 * Weights: skills 0.4, experience 0.2, language 0.2, location 0.1, salary 0.1
 */
export function computeUnifiedMatchScore({ candidate, job }) {
  const weights = { skills: 0.4, experience: 0.2, language: 0.2, location: 0.1, salary: 0.1 };

  const skills = getSkillsMatchScore(job?.skills_required, candidate?.skills);
  const experience = getExperienceMatchScore(job?.experience_level, candidate?.experience_years);
  const language = getLanguageMatchScore(job?.preferred_language, candidate?.languages);
  const location = getLocationMatchScore(candidate, job);
  const salary = getSalaryMatchScore(candidate?.target_salary_range, job?.salary_range);

  const score = skills * weights.skills + experience * weights.experience + language * weights.language + location * weights.location + salary * weights.salary;
  return Math.round(score);
}

export const UnifiedMatchHelpers = {
  getSkillsMatchScore,
  getExperienceMatchScore,
  getLanguageMatchScore,
  getLocationMatchScore,
  getSalaryMatchScore,
  getJobTypePreferenceScore,
};

export default computeUnifiedMatchScore;


