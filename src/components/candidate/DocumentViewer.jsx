import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, Eye, FileText, Image as ImageIcon, File, CheckCircle, AlertTriangle, Clock, Calendar as CalendarIcon, ServerCrash } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { useDocuments } from '../../hooks/candidate/useDocuments';

const DocumentViewer = ({ document, onClose, viewerRole = 'candidate' }) => {
  const { t } = useTranslation();
  const { getDocumentUrl, updateDocumentMetadata } = useDocuments();
  const [documentUrl, setDocumentUrl] = useState(document?.file_url || null);
  const [isLoading, setIsLoading] = useState(!document?.file_url);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [metadata, setMetadata] = useState(document?.metadata || {});

  useEffect(() => {
    if (document && !document.file_url) {
      loadDocumentUrl();
    } else {
      setDocumentUrl(document.file_url);
      setIsLoading(false);
    }
    if (document) {
      setMetadata(document.metadata || {});
    }
  }, [document]);

  const loadDocumentUrl = async () => {
    if (!document) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const url = await getDocumentUrl(document.id);
      setDocumentUrl(url);
    } catch (err) {
      setError('Failed to load document');
      console.error('Error loading document URL:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (documentUrl) {
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = document.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="w-6 h-6 text-blue-500" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="w-6 h-6 text-red-500" />;
    } else {
      return <File className="w-6 h-6 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(t('locale'), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!document) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 z-20 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex-1 flex min-h-0">
          {/* Document Preview */}
          <main className="flex-1 p-8 bg-gray-50 flex items-center justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-lg font-medium">Loading document...</p>
              </div>
            ) : error || !documentUrl ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <ServerCrash className="w-16 h-16 text-red-400 mb-4" />
                <p className="text-xl font-semibold text-gray-700 mb-2">Failed to load document</p>
                <p className="max-w-xs mb-6">A preview could not be generated for this file. Please try again later.</p>
                <Button variant="outline" size="sm" onClick={loadDocumentUrl}>
                  Retry
                </Button>
              </div>
            ) : (
              <div className="w-full h-full bg-white rounded-xl shadow-inner border border-gray-200">
                {document.file_type.startsWith('image/') ? (
                  <img 
                    src={documentUrl} 
                    alt={document.file_name}
                    className="max-w-full max-h-full object-contain mx-auto"
                  />
                ) : document.file_type.includes('pdf') ? (
                  <iframe
                    src={`${documentUrl}#toolbar=0&navpanes=0`}
                    className="w-full h-full border-0 rounded-xl"
                    title={document.file_name}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
                    <FileText className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-xl font-semibold text-gray-700 mb-2">Preview not available</p>
                    <p className="max-w-xs mb-6">This file type cannot be previewed. You can still access its details.</p>
                    {viewerRole === 'candidate' && (
                        <Button variant="primary" onClick={handleDownload}>
                          <Download className="w-4 h-4 mr-2" />
                          Download to View
                        </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>

          {/* Document Details Sidebar */}
          <aside className="w-96 bg-white border-l border-gray-200 p-8 overflow-y-auto">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 pt-1">{getFileIcon(document.file_type)}</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 break-words">{document.file_name}</h1>
                <p className="text-sm text-gray-500 mt-1">{formatFileSize(document.file_size)}</p>
              </div>
            </div>

            {viewerRole === 'candidate' &&
              <Button variant="primary" size="lg" className="w-full mb-8" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            }
            
            <div className="space-y-6">
              {/* Verification Status */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Status</h3>
                {document.is_verified ? (
                  <Badge variant="success" size="lg" className="w-full justify-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="warning" size="lg" className="w-full justify-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Pending Verification
                  </Badge>
                )}
              </div>

              {/* Basic Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <File className="w-4 h-4 text-gray-400 mr-3" />
                    <div>
                      <span className="text-gray-500">Document Type: </span>
                      <strong className="text-gray-800 capitalize">{document.document_type.replace('_', ' ')}</strong>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 text-gray-400 mr-3" />
                    <div>
                      <span className="text-gray-500">Created: </span>
                      <strong className="text-gray-800">{formatDate(document.created_at)}</strong>
                    </div>
                  </div>
                   <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-400 mr-3" />
                     <div>
                      <span className="text-gray-500">Last Updated: </span>
                      <strong className="text-gray-800">{formatDate(document.updated_at)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              {viewerRole === 'candidate' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Metadata</h3>
                    <button onClick={() => setIsEditing(!isEditing)} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border">
                    {Object.keys(metadata).length > 0 ? (
                      isEditing ? <span>Editing not yet implemented.</span> : 
                      Object.entries(metadata).map(([key, value]) => <p key={key}><strong>{key}:</strong> {String(value)}</p>)
                    ) : (
                      <span className="text-gray-400 italic">No metadata added</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer; 