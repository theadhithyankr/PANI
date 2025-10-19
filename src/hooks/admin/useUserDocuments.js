import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../clients/supabaseClient';

export const useUserDocuments = (userId) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDocuments = useCallback(async () => {
    if (!userId) {
      setDocuments([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      setError(err);
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDocuments();
  }, [userId, fetchDocuments]);

  const updateDocumentVerification = async (documentId, is_verified, verify_notes = '') => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({ is_verified, verify_notes })
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;
      
      setDocuments(prevDocs =>
        prevDocs.map(doc => (doc.id === documentId ? data : doc))
      );
    } catch (err) {
      console.error("Error updating document verification:", err);
      throw err;
    }
  };

  const downloadDocument = async (filePath, fileName) => {
    try {
      // Create a signed URL for the file
      const { data: urlData, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600); // URL valid for 1 hour

      if (error) throw error;

      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = urlData.signedUrl;
      a.download = fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error.message);
      throw error;
    }
  };

  return { documents, loading, error, updateDocumentVerification, downloadDocument };
}; 