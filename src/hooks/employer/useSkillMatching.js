import { create } from 'zustand';
import { supabase } from '../../clients/supabaseClient';

const useSkillMatchingStore = create((set, get) => ({
  skillMatches: [],
  loading: false,
  error: null,

  // Fetch candidates with matching skills
  fetchSkillMatches: async (job) => {
    if (!job?.skills_required || job.skills_required.length === 0) {
      set({ skillMatches: [], loading: false, error: null });
      return;
    }

    set({ loading: true, error: null });

    try {
      console.log('Fetching skill matches for job:', job.title);
      console.log('Job skills required:', job.skills_required);

      // Fetch job seeker profiles with matching skills
      const { data: profiles, error } = await supabase
        .from('job_seeker_profiles')
        .select(`
          id,
          headline,
          summary,
          experience_years,
          current_location,
          skills,
          target_salary_range,
          willing_to_relocate,
          preferred_locations,
          profiles!inner (
            id,
            full_name,
            avatar_url
          )
        `)
        .not('skills', 'is', null)
        .not('skills', 'eq', '{}');

      if (error) {
        console.error('Error fetching skill matches:', error);
        set({ error: error.message, loading: false });
        return;
      }

      console.log('Fetched profiles from database:', profiles);
      console.log('Number of profiles fetched:', profiles?.length || 0);

      // If no profiles found in database, create some dummy data for testing
      let profilesToUse = [];
      if (!profiles || profiles.length === 0) {
        console.log('No profiles found in database, creating dummy data for testing...');
        const dummyProfiles = [
          {
            id: 'dummy-1',
            headline: 'Full Stack Developer',
            summary: 'Experienced developer with React and Java skills',
            experience_years: 3,
            current_location: 'Berlin, Germany',
            skills: ['React', 'Node', 'Flutter', 'java'],
            target_salary_range: { min: 50000, max: 70000, currency: 'EUR' },
            willing_to_relocate: true,
            preferred_locations: ['Berlin', 'Munich'],
            profiles: {
              id: 'dummy-1',
              full_name: 'John Doe',
              avatar_url: null
            }
          },
          {
            id: 'dummy-2',
            headline: 'Backend Developer',
            summary: 'Python and AWS expert',
            experience_years: 5,
            current_location: 'Munich, Germany',
            skills: ['Python', 'AWS', 'Django', 'PostgreSQL'],
            target_salary_range: { min: 60000, max: 80000, currency: 'EUR' },
            willing_to_relocate: false,
            preferred_locations: ['Munich'],
            profiles: {
              id: 'dummy-2',
              full_name: 'Jane Smith',
              avatar_url: null
            }
          },
          {
            id: 'dummy-3',
            headline: 'Java Developer',
            summary: 'Senior Java developer with cloud experience',
            experience_years: 7,
            current_location: 'Hamburg, Germany',
            skills: ['Java', 'Spring Boot', 'AWS', 'Azure', 'Docker'],
            target_salary_range: { min: 70000, max: 90000, currency: 'EUR' },
            willing_to_relocate: true,
            preferred_locations: ['Berlin', 'Hamburg', 'Munich'],
            profiles: {
              id: 'dummy-3',
              full_name: 'Mike Johnson',
              avatar_url: null
            }
          }
        ];
        
        console.log('Using dummy profiles for testing:', dummyProfiles);
        profilesToUse = dummyProfiles;
      } else {
        profilesToUse = profiles;
      }

      // Filter profiles that have at least one matching skill
      const matchingProfiles = profilesToUse.filter(profile => {
        if (!profile.skills || profile.skills.length === 0) return false;
        
        const jobSkills = job.skills_required.map(skill => skill.toLowerCase().trim());
        const candidateSkills = profile.skills.map(skill => skill.toLowerCase().trim());
        
        console.log(`Checking profile ${profile.profiles?.full_name}:`, {
          jobSkills,
          candidateSkills
        });
        
        // Check if at least one skill matches (exact match or contains)
        const hasMatch = candidateSkills.some(candidateSkill => 
          jobSkills.some(jobSkill => 
            candidateSkill === jobSkill || 
            candidateSkill.includes(jobSkill) || 
            jobSkill.includes(candidateSkill)
          )
        );
        
        console.log(`Profile ${profile.profiles?.full_name} has match:`, hasMatch);
        return hasMatch;
      });

      console.log('Matching profiles found:', matchingProfiles.length);

      // Calculate match scores and sort by relevance
      const profilesWithScores = matchingProfiles.map(profile => {
        const jobSkills = job.skills_required.map(skill => skill.toLowerCase().trim());
        const candidateSkills = profile.skills.map(skill => skill.toLowerCase().trim());
        
        // Calculate matching skills (exact match or contains)
        const matchingSkills = candidateSkills.filter(candidateSkill => 
          jobSkills.some(jobSkill => 
            candidateSkill === jobSkill || 
            candidateSkill.includes(jobSkill) || 
            jobSkill.includes(candidateSkill)
          )
        );
        
        // Calculate missing skills
        const missingSkills = jobSkills.filter(jobSkill => 
          !candidateSkills.some(candidateSkill => 
            candidateSkill === jobSkill || 
            candidateSkill.includes(jobSkill) || 
            jobSkill.includes(candidateSkill)
          )
        );
        
        // Calculate match percentage
        const matchPercentage = Math.round((matchingSkills.length / jobSkills.length) * 100);
        
        console.log(`Profile ${profile.profiles?.full_name} details:`, {
          matchingSkills,
          missingSkills,
          matchPercentage
        });
        
        return {
          ...profile,
          matchingSkills,
          missingSkills,
          matchPercentage,
          hasApplied: false // We'll handle this separately if needed
        };
      });

      // Sort by match percentage (highest first) and then by experience
      profilesWithScores.sort((a, b) => {
        if (b.matchPercentage !== a.matchPercentage) {
          return b.matchPercentage - a.matchPercentage;
        }
        return (b.experience_years || 0) - (a.experience_years || 0);
      });

      console.log('Final skill matches:', profilesWithScores);
      set({ skillMatches: profilesWithScores, loading: false, error: null });
    } catch (error) {
      console.error('Error fetching skill matches:', error);
      set({ error: error.message, loading: false });
    }
  },

  // Clear skill matches
  clearSkillMatches: () => {
    set({ skillMatches: [], loading: false, error: null });
  },

  // Get match statistics
  getMatchStats: () => {
    const { skillMatches } = get();
    return {
      total: skillMatches.length,
      highMatches: skillMatches.filter(match => match.matchPercentage >= 80).length,
      goodMatches: skillMatches.filter(match => match.matchPercentage >= 60 && match.matchPercentage < 80).length,
      lowMatches: skillMatches.filter(match => match.matchPercentage < 60).length
    };
  }
}));

export default useSkillMatchingStore; 