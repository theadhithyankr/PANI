import { create } from 'zustand';
import { supabase } from '../clients/supabaseClient';

const useJobSeekerStore = create((set, get) => ({
  // State
  profile: null,
  loading: {
    profile: false,
    skills: false,
    preferences: false
  },
  error: {
    profile: null,
    skills: null,
    preferences: null
  },

  // Actions
  setLoading: (key, loading) => 
    set(state => ({
      loading: { ...state.loading, [key]: loading }
    })),

  setError: (key, error) => 
    set(state => ({
      error: { ...state.error, [key]: error }
    })),

  setProfile: (profile) => set({ profile }),

  // Fetch job seeker profile using new structure
  fetchProfile: async (userId) => {
    if (!userId) return;

    get().setLoading('profile', true);
    get().setError('profile', null);

    try {
      const { data, error } = await supabase
        .from('job_seeker_profiles')
        .select(`
          *,
          profiles:id (
            id,
            user_type,
            full_name,
            avatar_url,
            phone,
            email_verified,
            phone_verified
          )
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;

      set({ profile: data });
      return data;
    } catch (err) {
      console.error('Error fetching job seeker profile:', err);
      get().setError('profile', err.message || 'Failed to fetch profile');
      set({ profile: null });
      return null;
    } finally {
      get().setLoading('profile', false);
    }
  },

  // Update profile
  updateProfile: async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('job_seeker_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      set(state => ({
        profile: { ...state.profile, ...data }
      }));

      return { success: true, profile: data };
    } catch (err) {
      console.error('Error updating profile:', err);
      return { success: false, error: err.message };
    }
  },

  // Update skills
  updateSkills: async (userId, skills) => {
    get().setLoading('skills', true);
    get().setError('skills', null);

    try {
      const { data, error } = await supabase
        .from('job_seeker_profiles')
        .update({
          skills: skills,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      set(state => ({
        profile: { ...state.profile, skills: skills }
      }));

      return { success: true, skills: skills };
    } catch (err) {
      console.error('Error updating skills:', err);
      get().setError('skills', err.message || 'Failed to update skills');
      return { success: false, error: err.message };
    } finally {
      get().setLoading('skills', false);
    }
  },

  // Update preferences
  updatePreferences: async (userId, preferences) => {
    get().setLoading('preferences', true);
    get().setError('preferences', null);

    try {
      const { data, error } = await supabase
        .from('job_seeker_profiles')
        .update({
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      set(state => ({
        profile: { ...state.profile, ...preferences }
      }));

      return { success: true, preferences: preferences };
    } catch (err) {
      console.error('Error updating preferences:', err);
      get().setError('preferences', err.message || 'Failed to update preferences');
      return { success: false, error: err.message };
    } finally {
      get().setLoading('preferences', false);
    }
  },

  // Clear all data
  clearData: () => {
    set({
      profile: null
    });
  },

  // Reset store to initial state
  reset: () => {
    set({
      profile: null,
      loading: {
        profile: false,
        skills: false,
        preferences: false
      },
      error: {
        profile: null,
        skills: null,
        preferences: null
      }
    });
  }
}));

export default useJobSeekerStore;