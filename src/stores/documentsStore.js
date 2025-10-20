import { create } from 'zustand';
import { supabase } from '../clients/supabaseClient';

const useDocumentsStore = create((set, get) => ({
  // State
  documents: [],
  isLoading: false,
  error: null,
  uploadProgress: 0,
  isUploading: false,
  selectedDocument: null,
  filters: {
    documentType: 'all',
    searchTerm: '',
    isVerified: null
  },
  isInitialized: false,
  lastOwnerId: null,

  // Actions
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  setIsUploading: (isUploading) => set({ isUploading }),
  setSelectedDocument: (document) => set({ selectedDocument: document }),
  setFilters: (filters) => set(state => ({
    filters: { ...state.filters, ...filters }
  })),

  // Fetch documents for a specific owner
  fetchDocuments: async (ownerId) => {
    if (!ownerId) return;

    // Prevent multiple simultaneous fetches for the same user
    if (get().isInitialized && ownerId === get().lastOwnerId) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Normalize docs to ensure file_name is present for UI
      const normalized = (documents || []).map((doc) => ({
        ...doc,
        file_name: doc.file_name || doc.metadata?.original_name || (doc.file_path ? doc.file_path.split('/').pop() : ''),
      }));

      set({ 
        documents: normalized, 
        isLoading: false, 
        isInitialized: true,
        lastOwnerId: ownerId 
      });

      return normalized;
    } catch (err) {
      console.error('Error fetching documents:', err);
      set({ 
        error: err.message || 'Failed to fetch documents', 
        isLoading: false,
        documents: [] 
      });
      return [];
    }
  },

  // Upload document to S3 and create database record
  uploadDocument: async (file, ownerId, documentType, metadata = {}) => {
    if (!file || !ownerId || !documentType) {
      throw new Error('File, owner ID, and document type are required');
    }

    set({ isUploading: true, uploadProgress: 0, error: null });

    try {
      // Generate unique file path
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const fileName = `${ownerId}/${documentType}/${timestamp}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      // Upload file to Supabase Storage (S3)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            set({ uploadProgress: Math.round(percent) });
          },
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Base payload without file_name to support environments where column is missing
      const basePayload = {
        owner_id: ownerId,
        document_type: documentType,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        is_verified: false,
        metadata: {
          ...metadata,
          uploaded_at: new Date().toISOString(),
          original_name: file.name,
          content_type: file.type
        }
      };

      let documentData;
      let dbError;

      // Attempt insert with file_name first
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
        const isMissingColumn = msg.includes('schema cache') || msg.includes('file_name') || dbError.code === 'PGRST204' || dbError.code === 'PGRST301';
        if (isMissingColumn) {
          // Retry without file_name
          const { data: retryData, error: retryErr } = await supabase
            .from('documents')
            .insert(basePayload)
            .select()
            .single();

          if (retryErr) {
            await supabase.storage.from('documents').remove([filePath]);
            throw new Error(retryErr.message);
          }
          documentData = retryData;
        } else {
          await supabase.storage.from('documents').remove([filePath]);
          throw new Error(dbError.message);
        }
      }

      // Ensure file_name present for UI
      if (documentData && !documentData.file_name) {
        documentData.file_name = file.name;
      }

      // Add to local state
      set(state => ({
        documents: [documentData, ...state.documents],
        isUploading: false,
        uploadProgress: 0
      }));

      return documentData;
    } catch (err) {
      console.error('Error uploading document:', err);
      set({ 
        error: err.message || 'Failed to upload document', 
        isUploading: false,
        uploadProgress: 0 
      });
      throw err;
    }
  },

  // Get filtered documents
  getFilteredDocuments: () => {
    const { documents, filters } = get();
    let filtered = documents;

    // Filter by document type
    if (filters.documentType && filters.documentType !== 'all') {
      filtered = filtered.filter(doc => doc.document_type === filters.documentType);
    }

    // Filter by verification status
    if (filters.isVerified !== null) {
      filtered = filtered.filter(doc => doc.is_verified === filters.isVerified);
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(doc => {
        const name = (doc.file_name || doc.metadata?.original_name || (doc.file_path ? doc.file_path.split('/').pop() : '')).toLowerCase();
        const type = (doc.document_type || '').toLowerCase();
        const description = (doc.metadata?.description || '').toLowerCase();
        return name.includes(searchTerm) || type.includes(searchTerm) || description.includes(searchTerm);
      });
    }

    return filtered;
  },

  // Get document download URL from S3
  getDocumentUrl: async (documentId) => {
    try {
      const document = get().documents.find(doc => doc.id === documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      const { data: urlData, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(document.file_path, 3600); // 1 hour expiry

      if (error) throw error;

      return urlData.signedUrl;
    } catch (err) {
      console.error('Error getting document URL:', err);
      throw err;
    }
  },

  // Delete document from S3 and database
  deleteDocument: async (documentId) => {
    try {
      const document = get().documents.find(doc => doc.id === documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Delete from database first
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      // Delete from S3 storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);

      if (storageError) {
        console.warn('Failed to delete file from storage:', storageError);
        // Don't throw error here as the database record is already deleted
      }

      // Remove from local state
      set(state => ({
        documents: state.documents.filter(doc => doc.id !== documentId)
      }));

      return true;
    } catch (err) {
      console.error('Error deleting document:', err);
      set({ error: err.message || 'Failed to delete document' });
      throw err;
    }
  },

  // Update document verification status
  updateDocumentVerification: async (documentId, isVerified, verifyNotes = null) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({
          is_verified: isVerified,
          verify_notes: verifyNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      set(state => ({
        documents: state.documents.map(doc => 
          doc.id === documentId ? { ...doc, ...data } : doc
        )
      }));

      return data;
    } catch (err) {
      console.error('Error updating document verification:', err);
      set({ error: err.message || 'Failed to update document verification' });
      throw err;
    }
  },

  // Update document metadata
  updateDocumentMetadata: async (documentId, metadata) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({
          metadata: metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      set(state => ({
        documents: state.documents.map(doc => 
          doc.id === documentId ? { ...doc, ...data } : doc
        )
      }));

      return data;
    } catch (err) {
      console.error('Error updating document metadata:', err);
      set({ error: err.message || 'Failed to update document metadata' });
      throw err;
    }
  },

  // Get filtered documents
  getFilteredDocuments: () => {
    const { documents, filters } = get();
    let filtered = documents;

    // Filter by document type
    if (filters.documentType && filters.documentType !== 'all') {
      filtered = filtered.filter(doc => doc.document_type === filters.documentType);
    }

    // Filter by verification status
    if (filters.isVerified !== null) {
      filtered = filtered.filter(doc => doc.is_verified === filters.isVerified);
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.file_name.toLowerCase().includes(searchTerm) ||
        doc.document_type.toLowerCase().includes(searchTerm) ||
        (doc.metadata?.description && doc.metadata.description.toLowerCase().includes(searchTerm))
      );
    }

    return filtered;
  },

  // Get documents by type
  getDocumentsByType: (documentType) => {
    return get().documents.filter(doc => doc.document_type === documentType);
  },

  // Get document statistics
  getDocumentStats: () => {
    const documents = get().documents;
    const stats = {
      total: documents.length,
      verified: documents.filter(doc => doc.is_verified).length,
      unverified: documents.filter(doc => !doc.is_verified).length,
      byType: {}
    };

    // Count by document type
    documents.forEach(doc => {
      if (!stats.byType[doc.document_type]) {
        stats.byType[doc.document_type] = 0;
      }
      stats.byType[doc.document_type]++;
    });

    return stats;
  },

  // Clear all data
  clearData: () => {
    set({
      documents: [],
      selectedDocument: null,
      isInitialized: false,
      lastOwnerId: null,
      filters: {
        documentType: 'all',
        searchTerm: '',
        isVerified: null
      }
    });
  },

  // Reset store state
  reset: () => {
    set({
      documents: [],
      isLoading: false,
      error: null,
      uploadProgress: 0,
      isUploading: false,
      selectedDocument: null,
      filters: {
        documentType: 'all',
        searchTerm: '',
        isVerified: null
      },
      isInitialized: false,
      lastOwnerId: null
    });
  }
}));

export default useDocumentsStore;