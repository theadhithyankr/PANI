import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../clients/supabaseClient';

export const useAllDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          profile:profiles!documents_owner_id_fkey (
            full_name,
            avatar_url,
            user_type
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = data.map(doc => ({ 
        ...doc, 
        ...doc.profile, 
        profile: undefined,
        file_name: doc.file_name || doc.metadata?.original_name || (doc.file_path ? doc.file_path.split('/').pop() : '')
      }));
      setDocuments(formattedData || []);

    } catch (err) {
      setError(err);
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllDocuments();
  }, [fetchAllDocuments]);

  const updateDocumentVerification = async (documentId, is_verified, verify_notes = '') => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({ is_verified, verify_notes, updated_at: new Date().toISOString() })
        .eq('id', documentId)
        .select(`
          *,
          profile:profiles!documents_owner_id_fkey (
            full_name,
            avatar_url,
            user_type
          )
        `)
        .single();
        
      if (error) throw error;

      const formattedData = { ...data, ...data.profile, profile: undefined };
      setDocuments(prevDocs =>
        prevDocs.map(doc => (doc.id === documentId ? formattedData : doc))
      );
      return formattedData;
    } catch (err) {
      console.error("Error updating document verification:", err);
      throw err;
    }
  };

  return { documents, loading, error, fetchAllDocuments, updateDocumentVerification };
};