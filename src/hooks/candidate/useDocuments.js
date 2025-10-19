import { useEffect, useMemo, useCallback } from 'react';
import useDocumentsStore from '../../stores/documentsStore';

/**
 * Hook to access documents from the Zustand store
 * @param {string} ownerId - The user's profile ID
 */
export const useDocuments = (ownerId) => {
  // Select specific state from the store
  const documents = useDocumentsStore(state => state.documents);
  const isLoading = useDocumentsStore(state => state.isLoading);
  const error = useDocumentsStore(state => state.error);
  const isUploading = useDocumentsStore(state => state.isUploading);
  const uploadProgress = useDocumentsStore(state => state.uploadProgress);
  const selectedDocument = useDocumentsStore(state => state.selectedDocument);
  const filters = useDocumentsStore(state => state.filters);
  const isInitialized = useDocumentsStore(state => state.isInitialized);

  // Select actions from the store
  const fetchDocuments = useDocumentsStore(state => state.fetchDocuments);
  const uploadDocument = useDocumentsStore(state => state.uploadDocument);
  const deleteDocument = useDocumentsStore(state => state.deleteDocument);
  const getDocumentUrl = useDocumentsStore(state => state.getDocumentUrl);
  const updateDocumentVerification = useDocumentsStore(state => state.updateDocumentVerification);
  const updateDocumentMetadata = useDocumentsStore(state => state.updateDocumentMetadata);
  const setSelectedDocument = useDocumentsStore(state => state.setSelectedDocument);
  const setFilters = useDocumentsStore(state => state.setFilters);
  const clearData = useDocumentsStore(state => state.clearData);

  // Fetch documents when ownerId changes
  useEffect(() => {
    if (ownerId) {
      fetchDocuments(ownerId);
    }
  }, [ownerId, fetchDocuments]);

  // Clear data when component unmounts or ownerId changes
  useEffect(() => {
    return () => {
      if (ownerId) {
        // Only clear if we're switching users
        const currentOwnerId = useDocumentsStore.getState().lastOwnerId;
        if (currentOwnerId && currentOwnerId !== ownerId) {
          clearData();
        }
      }
    };
  }, [ownerId, clearData]);

  // Memoized filtered documents
  const filteredDocuments = useMemo(() => {
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
  }, [documents, filters]);

  // Memoized document statistics
  const documentStats = useMemo(() => {
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
  }, [documents]);

  // Memoized documents by type
  const documentsByType = useMemo(() => {
    const byType = {};
    documents.forEach(doc => {
      if (!byType[doc.document_type]) {
        byType[doc.document_type] = [];
      }
      byType[doc.document_type].push(doc);
    });
    return byType;
  }, [documents]);

  // Wrapper functions for better error handling
  const handleUploadDocument = useCallback(async (file, documentType, metadata = {}) => {
    if (!ownerId) {
      throw new Error('Owner ID is required');
    }
    return await uploadDocument(file, ownerId, documentType, metadata);
  }, [ownerId, uploadDocument]);

  const handleDeleteDocument = useCallback(async (documentId) => {
    return await deleteDocument(documentId);
  }, [deleteDocument]);

  const handleGetDocumentUrl = useCallback(async (documentId) => {
    return await getDocumentUrl(documentId);
  }, [getDocumentUrl]);

  const handleUpdateDocumentVerification = useCallback(async (documentId, isVerified, verifyNotes = null) => {
    return await updateDocumentVerification(documentId, isVerified, verifyNotes);
  }, [updateDocumentVerification]);

  const handleUpdateDocumentMetadata = useCallback(async (documentId, metadata) => {
    return await updateDocumentMetadata(documentId, metadata);
  }, [updateDocumentMetadata]);

  return {
    // Data
    documents,
    filteredDocuments,
    documentStats,
    documentsByType,
    selectedDocument,
    
    // Loading and Error States
    isLoading,
    error,
    isUploading,
    uploadProgress,
    isInitialized,
    
    // Filters
    filters,
    
    // Actions
    uploadDocument: handleUploadDocument,
    deleteDocument: handleDeleteDocument,
    getDocumentUrl: handleGetDocumentUrl,
    updateDocumentVerification: handleUpdateDocumentVerification,
    updateDocumentMetadata: handleUpdateDocumentMetadata,
    setSelectedDocument,
    setFilters,
    clearData,
    
    // Utility functions
    getDocumentsByType: (documentType) => documentsByType[documentType] || [],
    hasDocuments: documents.length > 0,
    hasVerifiedDocuments: documents.some(doc => doc.is_verified),
    getDocumentById: (documentId) => documents.find(doc => doc.id === documentId)
  };
};

export default useDocuments; 