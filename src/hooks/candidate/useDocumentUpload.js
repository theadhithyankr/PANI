import { useState } from 'react';
import { supabase } from '../../clients/supabaseClient';

export const useDocumentUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadDocument = async (file, ownerId, documentType, metadata = {}) => {
    if (!file || !ownerId) {
      throw new Error('File and owner ID are required');
    }

    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Generate a unique file path
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const fileName = `${ownerId}/${documentType}/${timestamp}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(Math.round(percent));
          },
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Create document record in the database
      const { data: documentData, error: dbError } = await supabase
        .from('documents')
        .insert({
          owner_id: ownerId,
          document_type: documentType,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          metadata: {
            ...metadata,
            uploaded_at: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (dbError && dbError.code !== 'PGRST116') {
        // If database insert fails, delete the uploaded file
        await supabase.storage.from('documents').remove([filePath]);
        throw new Error(dbError.message);
      }

      if (!documentData) {
        // If no document data returned, delete the uploaded file
        await supabase.storage.from('documents').remove([filePath]);
        throw new Error('Failed to create document record');
      }

      return documentData;
    } catch (error) {
      setUploadError(error.message);
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteDocument = async (documentId, filePath) => {
    try {
      // Delete from storage
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([filePath]);

        if (storageError) {
          throw new Error(storageError.message);
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (dbError) {
        throw new Error(dbError.message);
      }

      return true;
    } catch (error) {
      setUploadError(error.message);
      throw error;
    }
  };

  const getDocumentUrl = async (filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600); // URL valid for 1 hour

      if (error) {
        throw new Error(error.message);
      }

      return data.signedUrl;
    } catch (error) {
      setUploadError(error.message);
      throw error;
    }
  };

  return {
    uploadDocument,
    deleteDocument,
    getDocumentUrl,
    uploading,
    uploadError,
    uploadProgress,
  };
}; 