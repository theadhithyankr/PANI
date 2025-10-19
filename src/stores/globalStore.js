import { create } from 'zustand';
import { supabase } from '../clients/supabaseClient';

const useGlobalStore = create((set, get) => ({
  // State
  user: null,
  profile: null,
  loading: {
    user: false,
    profile: false
  },
  error: {
    user: null,
    profile: null
  },
  notifications: [],
  unreadNotifications: 0,

  // Actions
  setLoading: (key, loading) => 
    set(state => ({
      loading: { ...state.loading, [key]: loading }
    })),

  setError: (key, error) => 
    set(state => ({
      error: { ...state.error, [key]: error }
    })),

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  // Fetch user profile using new structure
  fetchUserProfile: async (userId) => {
    if (!userId) return;

    get().setLoading('profile', true);
    get().setError('profile', null);

    try {
      // First get the basic profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      let detailedProfile = null;

      // Get detailed profile based on user type
      if (profileData.user_type === 'job_seeker') {
        const { data: jobSeekerData, error: jobSeekerError } = await supabase
          .from('job_seeker_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (jobSeekerError && jobSeekerError.code !== 'PGRST116') throw jobSeekerError;
        detailedProfile = jobSeekerData;
      } else if (profileData.user_type === 'employer') {
        const { data: employerData, error: employerError } = await supabase
          .from('employer_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (employerError && employerError.code !== 'PGRST116') throw employerError;
        detailedProfile = employerData;
      }

      const combinedProfile = {
        ...profileData,
        ...detailedProfile
      };

      set({ profile: combinedProfile });
      return combinedProfile;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      get().setError('profile', err.message || 'Failed to fetch user profile');
      set({ profile: null });
      return null;
    } finally {
      get().setLoading('profile', false);
    }
  },

  // Update user profile
  updateUserProfile: async (userId, updates) => {
    try {
      const { profile } = get();
      if (!profile) return { success: false, error: 'No profile found' };

      let updateData = {};
      let tableName = 'profiles';

      // Determine which table to update based on user type
      if (profile.user_type === 'job_seeker') {
        tableName = 'job_seeker_profiles';
      } else if (profile.user_type === 'employer') {
        tableName = 'employer_profiles';
      }

      // Filter updates to only include relevant fields
      const allowedFields = {
        'profiles': ['full_name', 'avatar_url', 'phone', 'email_verified', 'phone_verified'],
        'job_seeker_profiles': ['full_name', 'current_location', 'experience_years', 'skills', 'preferred_job_types', 'preferred_locations', 'target_salary_range', 'availability_status'],
        'employer_profiles': ['full_name', 'position', 'department', 'company_id']
      };

      const fieldsToUpdate = allowedFields[tableName] || [];
      fieldsToUpdate.forEach(field => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });

      if (Object.keys(updateData).length === 0) {
        return { success: false, error: 'No valid fields to update' };
      }

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from(tableName)
        .update(updateData)
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
      console.error('Error updating user profile:', err);
      return { success: false, error: err.message };
    }
  },

  // Fetch notifications
  fetchNotifications: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const unreadCount = (data || []).filter(notification => !notification.read_at).length;

      set({ 
        notifications: data || [],
        unreadNotifications: unreadCount
      });

      return data || [];
    } catch (err) {
      console.error('Error fetching notifications:', err);
      return [];
    }
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      set(state => ({
        notifications: state.notifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read_at: new Date().toISOString() }
            : notification
        ),
        unreadNotifications: Math.max(0, state.unreadNotifications - 1)
      }));

      return { success: true };
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return { success: false, error: err.message };
    }
  },

  // Clear all data
  clearData: () => {
    set({
      user: null,
      profile: null,
      notifications: [],
      unreadNotifications: 0
    });
  },

  // Reset store to initial state
  reset: () => {
    set({
      user: null,
      profile: null,
      loading: {
        user: false,
        profile: false
      },
      error: {
        user: null,
        profile: null
      },
      notifications: [],
      unreadNotifications: 0
    });
  }
}));

export default useGlobalStore;