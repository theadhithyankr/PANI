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

      // Base payload (without file_name) to allow retry if column doesn't exist
      const basePayload = {
        owner_id: ownerId,
        document_type: documentType,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        metadata: {
          ...metadata,
          uploaded_at: new Date().toISOString(),
          original_name: file.name,
        },
      };

      let documentData;
      let dbError;

      // First attempt: include file_name
      ({ data: documentData, error: dbError } = await supabase
        .from('documents')
        .insert({
          ...basePayload,
          file_name: file.name,
        })
        .select()
        .single());

      if (dbError) {
        const msg = dbError.message || '';
        const isMissingColumn = msg.includes("schema cache") || msg.includes("file_name") || dbError.code === 'PGRST204' || dbError.code === 'PGRST301';
        if (isMissingColumn) {
          // Retry without file_name for environments where column isn't present yet
          const { data: retryData, error: retryErr } = await supabase
            .from('documents')
            .insert(basePayload)
            .select()
            .single();

          if (retryErr) {
            // Clean up uploaded file if DB insert fails
            await supabase.storage.from('documents').remove([filePath]);
            throw new Error(retryErr.message);
          }

          documentData = retryData;
        } else {
          // Clean up uploaded file if DB insert fails
          await supabase.storage.from('documents').remove([filePath]);
          throw new Error(dbError.message);
        }
      }

      // Ensure a display name exists in returned object for UI
      if (documentData && !documentData.file_name) {
        documentData.file_name = file.name;
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