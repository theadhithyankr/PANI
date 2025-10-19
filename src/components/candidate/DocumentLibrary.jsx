import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { 
  Plus, Search, Filter, Download, Eye, Trash2, FileText, 
  Image as ImageIcon, File, CheckCircle, AlertTriangle, 
  Clock, Calendar as CalendarIcon, ServerCrash, XCircle 
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Input from '../common/Input';
import Select from '../common/Select';
import DocumentViewer from './DocumentViewer';
import useDocumentsStore from '../../store/documentsStore';
import { AuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/common/useToast';

const DocumentLibrary = () => {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [selectedUploadType, setSelectedUploadType] = useState('resume');
  const fileInputRef = useRef(null);
  const { user } = useContext(AuthContext);
  
  const { 
    documents, 
    isLoading, 
    error, 
    fetchDocuments,
    uploadDocument, 
    deleteDocument, 
    getDocumentUrl,
    
  } = useDocumentsStore();
  
  const { error: showError } = useToast();

  // Document types for filtering
  const documentTypes = [
    { value: 'resume', label: 'Resume' },
    { value: 'cover_letter', label: 'Cover Letter' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'portfolio', label: 'Portfolio' },
    { value: 'reference', label: 'Reference' },
    { value: 'other', label: 'Other' }
  ];

  const handleDocumentTypeChange = (value) => {
    setDocumentTypeFilter(value);
  };

  const handleVerificationChange = (value) => {
    setVerificationFilter(value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDocumentTypeFilter('all');
    setVerificationFilter('all');
  };

  const hasActiveFilters = searchTerm || documentTypeFilter !== 'all' || verificationFilter !== 'all';

  const getDocumentIcon = (type) => {
    switch (type) {
      case 'resume':
        return <FileText className="w-8 h-8 text-blue-500" />;
      case 'cover_letter':
        return <FileText className="w-8 h-8 text-green-500" />;
      case 'certificate':
        return <FileText className="w-8 h-8 text-purple-500" />;
      case 'portfolio':
        return <ImageIcon className="w-8 h-8 text-orange-500" />;
      case 'reference':
        return <FileText className="w-8 h-8 text-red-500" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const getDocumentTypeColor = (type) => {
    switch (type) {
      case 'resume':
        return 'bg-blue-100 text-blue-800';
      case 'cover_letter':
        return 'bg-green-100 text-green-800';
      case 'certificate':
        return 'bg-purple-100 text-purple-800';
      case 'portfolio':
        return 'bg-orange-100 text-orange-800';
      case 'reference':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Fetch user's documents on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      fetchDocuments(user.id);
    }
  }, [user?.id, fetchDocuments]);

  // Compute filtered documents locally based on component filters
  const filteredDocuments = useMemo(() => {
    let list = documents;
    if (documentTypeFilter && documentTypeFilter !== 'all') {
      list = list.filter(doc => doc.document_type === documentTypeFilter);
    }
    if (verificationFilter !== 'all') {
      const isVerified = verificationFilter === 'verified';
      list = list.filter(doc => !!doc.is_verified === isVerified);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(doc => (
        (doc.file_name || '').toLowerCase().includes(term) ||
        (doc.document_type || '').toLowerCase().includes(term) ||
        (doc.metadata?.description || '').toLowerCase().includes(term)
      ));
    }
    return list;
  }, [documents, documentTypeFilter, verificationFilter, searchTerm]);

  const handleUpload = async (file) => {
    try {
      if (!user?.id) {
        throw new Error('You must be logged in to upload documents');
      }
      await uploadDocument(file, user.id, selectedUploadType || 'resume');
      setShowUpload(false);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const onClickUpload = () => {
    setShowUpload(true);
  };

  const handleDelete = async (document) => {
    try {
      await deleteDocument(document.id);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const url = await getDocumentUrl(doc.id);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      showError('Failed to download document. Please try again.');
    }
  };

  const handleView = (document) => {
    setSelectedDocument(document);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Document Library</h2>
        </div>
        <Card className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading documents...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Document Library</h2>
        <Button variant="primary" onClick={onClickUpload}>
          <Plus className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-center text-red-700">
            <XCircle className="w-5 h-5 mr-2" />
            <p>{error}</p>
          </div>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={handleSearchChange}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div>
              <Select
                value={documentTypeFilter}
                onChange={handleDocumentTypeChange}
                options={[
                  { value: 'all', label: 'All Types' },
                  ...documentTypes
                ]}
              />
            </div>
            <div>
              <Select
                value={verificationFilter}
                onChange={handleVerificationChange}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'verified', label: 'Verified' },
                  { value: 'unverified', label: 'Unverified' }
                ]}
              />
            </div>
          </div>
          
          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {searchTerm && (
                  <Badge variant="info" size="sm" className="flex items-center">
                    Search: "{searchTerm}"
                    <button 
                      onClick={() => handleSearchChange({ target: { value: '' } })}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {documentTypeFilter !== 'all' && (
                  <Badge variant="info" size="sm" className="flex items-center">
                    Type: {documentTypes.find(t => t.value === documentTypeFilter)?.label}
                    <button 
                      onClick={() => handleDocumentTypeChange('all')}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {verificationFilter !== 'all' && (
                  <Badge variant="info" size="sm" className="flex items-center">
                    Status: {verificationFilter === 'verified' ? 'Verified' : 'Unverified'}
                    <button 
                      onClick={() => handleVerificationChange('all')}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Upload Modal */}
      {showUpload && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Upload New Document</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowUpload(false)}>
              ✕
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Type
              </label>
              <Select
                value={selectedUploadType}
                onChange={(value) => setSelectedUploadType(value)}
                options={documentTypes}
              />
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleUpload(file);
                    // reset the input so selecting the same file again re-triggers
                    e.target.value = '';
                  }
                }}
              />
              <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
                Select File
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Document Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-bold text-blue-600">{documents.length}</div>
          <p className="text-sm text-gray-600">Total Documents</p>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-green-600">{documents.filter(doc => doc.is_verified).length}</div>
          <p className="text-sm text-gray-600">Verified</p>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{documents.filter(doc => !doc.is_verified).length}</div>
          <p className="text-sm text-gray-600">Pending Verification</p>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-purple-600">{documentTypes.length}</div>
          <p className="text-sm text-gray-600">Document Types</p>
        </Card>
      </div>

      {/* Document Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {documentTypes.slice(0, 4).map((type) => {
          const typeDocuments = documents.filter(doc => doc.document_type === type.value);
          return (
            <Card key={type.value} className="text-center hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleDocumentTypeChange(type.value)}>
              <div className="text-2xl mb-2">{getDocumentIcon(type.value)}</div>
              <h3 className="font-medium text-gray-900 mb-1">{type.label}</h3>
              <p className="text-sm text-gray-500">{typeDocuments.length} files</p>
              {typeDocuments.some(doc => doc.is_verified) && (
                <div className="mt-2">
                  <Badge variant="success" size="sm">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {filteredDocuments.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Documents ({filteredDocuments.length})
              </h3>
              {hasActiveFilters && (
                <p className="text-sm text-gray-600">
                  Showing {filteredDocuments.length} of {documents.length} documents
                </p>
              )}
            </div>
            {filteredDocuments.map((document) => (
              <Card key={document.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      {getDocumentIcon(document.document_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{document.file_name}</h4>
                        {document.is_verified ? (
                          <Badge variant="success" size="sm">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatFileSize(document.file_size || 0)}</span>
                        <span>•</span>
                        <span>Uploaded {formatDate(document.created_at)}</span>
                        <Badge variant={getDocumentTypeColor(document.document_type)} size="sm">
                          {documentTypes.find(t => t.value === document.document_type)?.label || 'Other'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleView(document)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(document)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(document)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </>
        ) : (
          <Card className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {hasActiveFilters ? 'No documents match your filters' : 'No documents found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {hasActiveFilters
                ? 'Try adjusting your search terms or filters to see more documents.'
                : 'Upload your resume, cover letters, and other documents to get started.'}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Button variant="primary" onClick={() => setShowUpload(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Upload Your First Document
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Document Checklist */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Document Checklist</h3>
        <div className="space-y-3">
          {documentTypes.slice(0, 6).map((type) => {
            const typeDocuments = documents.filter(doc => doc.document_type === type.value);
            const hasDocument = typeDocuments.length > 0;
            const hasVerified = typeDocuments.some(doc => doc.is_verified);
            
            return (
              <div key={type.value} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    hasVerified ? 'bg-green-500' : hasDocument ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}>
                    {hasVerified && <span className="text-white text-xs">✓</span>}
                    {hasDocument && !hasVerified && <span className="text-white text-xs">!</span>}
                  </div>
                  <span className="font-medium">{type.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {hasDocument && (
                    <span className="text-sm text-gray-500">
                      {typeDocuments.length} file{typeDocuments.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {hasVerified && (
                    <Badge variant="success" size="sm">Verified</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      {/* showDeleteConfirm is not defined in the original file,
          so this part of the code will be commented out or removed
          if the delete confirmation functionality is not fully implemented. */}
      {/* {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Document</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{showDeleteConfirm.file_name}"? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="danger" 
                onClick={() => handleDelete(showDeleteConfirm)}
              >
                Delete
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )} */}

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer 
          document={selectedDocument} 
          onClose={() => setSelectedDocument(null)} 
        />
      )}
    </div>
  );
};

export default DocumentLibrary;
