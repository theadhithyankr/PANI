import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../clients/supabaseClient';

const useCandidateDocuments = (candidateId) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDocuments = useCallback(async () => {
    if (!candidateId) {
      setDocuments([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', candidateId);

      if (error) {
        throw error;
      }

      const documentsWithUrls = await Promise.all(data.map(async (doc) => {
        const { data: urlData, error: urlError } = await supabase
          .storage
          .from('documents')
          .createSignedUrl(doc.file_path, 3600); // URL valid for 1 hour

        if (urlError) {
          console.error('Error creating signed URL for', doc.file_path, urlError);
          return {
            ...doc,
            file_url: null, // Handle error case
          };
        }
        
        return {
          ...doc,
          file_url: urlData.signedUrl,
        };
      }));

      setDocuments(documentsWithUrls || []);
    } catch (e) {
      setError(e.message);
      console.error("Error fetching documents:", e);
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return { documents, loading, error, refetch: fetchDocuments };
};

export default useCandidateDocuments; 