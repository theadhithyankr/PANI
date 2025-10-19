import React, { useState, useMemo } from 'react';
import { Search, Loader, AlertTriangle, UserCircle, Eye } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

import { useAllDocuments } from '../../hooks/admin/useAllDocuments';
import { useToast } from '../../hooks/common/useToast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import InitialsAvatar from '../../components/common/InitialsAvatar';
import DocumentViewerModal from '../../components/admin/DocumentViewerModal';

const DocumentTableRow = ({ document, onReview }) => {
    return (
      <tr className="border-b border-gray-200 hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
                <InitialsAvatar user={document} size="md" />
                <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{document.full_name}</div>
                    <div className="text-sm text-gray-500 capitalize">{document.user_type?.replace('_', ' ')}</div>
                </div>
            </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <p className="font-medium text-gray-800">{document.file_name}</p>
          <p className="text-sm text-gray-500 capitalize">{document.document_type}</p>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <div className="flex flex-col">
            <span>{format(new Date(document.created_at), 'MMM d, yyyy')}</span>
            <span className="text-xs">{formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}</span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
           <Badge variant={document.is_verified ? 'success' : 'warning'}>
            {document.is_verified ? 'Verified' : 'Not Verified'}
          </Badge>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <Button size="sm" variant="outline" onClick={() => onReview(document)}>
              <Eye className="w-4 h-4 mr-2" />
              Review
            </Button>
        </td>
      </tr>
    );
};


const DocumentManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const { documents, loading, error, updateDocumentVerification } = useAllDocuments();
  const { addToast } = useToast();

  const handleReview = (doc) => {
    setSelectedDocument(doc);
    setIsViewerOpen(true);
  };

  const handleUpdateDocument = async (docId, isVerified, notes) => {
    const updatedDocument = await updateDocumentVerification(docId, isVerified, notes);
    if (updatedDocument) {
      setSelectedDocument(updatedDocument);
    }
  };

  const filteredDocuments = useMemo(() => {
    return documents
      .filter(doc => {
        if (statusFilter !== 'all') {
            const isVerified = statusFilter === 'verified';
            if(doc.is_verified !== isVerified) return false;
        }
        if (searchTerm && !(
            doc.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            doc.file_name.toLowerCase().includes(searchTerm.toLowerCase())
        )) {
          return false;
        }
        return true;
      });
  }, [documents, searchTerm, statusFilter]);

  return (
    <>
      <div className="space-y-6">
          <div>
              <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
              <p className="text-gray-600 mt-1">Verify and manage all user-uploaded documents.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                type="text"
                placeholder="Search by user name or file name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-5 h-5" />}
                className="w-full"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="verified">Verified</option>
                <option value="unverified">Not Verified</option>
              </select>
            </div>
          </div>
          
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Uploaded</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification Status</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-10">
                      <div className="flex justify-center items-center">
                        <Loader className="w-8 h-8 animate-spin text-primary" />
                        <span className="ml-4 text-lg text-gray-600">Loading Documents...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="5" className="text-center py-10">
                      <div className="flex flex-col justify-center items-center text-red-600">
                        <AlertTriangle className="w-8 h-8" />
                        <span className="ml-4 text-lg mt-2">Error fetching documents.</span>
                        <p className="text-sm">{error.message}</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredDocuments.length > 0 ? (
                    filteredDocuments.map(doc => (
                      <DocumentTableRow key={doc.id} document={doc} onReview={handleReview} />
                    ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-10">
                      <p className="text-lg text-gray-600">No documents found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </div>
      <DocumentViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        document={selectedDocument}
        onUpdateDocument={handleUpdateDocument}
      />
    </>
  );
};

export default DocumentManagementPage; 