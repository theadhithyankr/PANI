import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
    X, FileText, ImageIcon, File as FileIcon, CheckCircle, AlertTriangle, 
    Clock, Calendar as CalendarIcon, ServerCrash, Download, Loader, Save 
} from 'lucide-react';

import { supabase } from '../../clients/supabaseClient';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { useToast } from '../../hooks/common/useToast';

const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    if (fileType.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    return <FileIcon className="w-8 h-8 text-gray-500" />;
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
      year: 'numeric', month: 'long', day: 'numeric',
    });
};

const DocumentViewerModal = ({ document, isOpen, onClose, onUpdateDocument }) => {
    const { addToast } = useToast();
    const [documentUrl, setDocumentUrl] = useState(null);
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);
    const [error, setError] = useState(null);
    const [verifyNotes, setVerifyNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && document) {
            loadDocumentUrl();
            setVerifyNotes(document.verify_notes || '');
        } else {
            setDocumentUrl(null);
            setError(null);
            setIsLoadingUrl(false);
        }
    }, [document, isOpen]);

    const loadDocumentUrl = async () => {
        if (!document?.file_path) return;
        setIsLoadingUrl(true);
        setError(null);
        try {
            const { data, error: urlError } = await supabase.storage.from('documents').createSignedUrl(document.file_path, 3600);
            if (urlError) throw urlError;
            setDocumentUrl(data.signedUrl);
        } catch (err) {
            setError('Failed to load document preview.');
            console.error('Error creating signed URL:', err);
            addToast('Failed to load document preview.', { appearance: 'error' });
        } finally {
            setIsLoadingUrl(false);
        }
    };
    
    const handleVerification = async (is_verified) => {
        setIsSaving(true);
        const action = is_verified ? 'approve' : 'reject';
        try {
            await onUpdateDocument(document.id, is_verified, verifyNotes);
            addToast(`Document successfully ${is_verified ? 'approved' : 'rejected'}.`, { appearance: 'success' });
        } catch (err) {
            addToast(`Failed to ${action} document. Please try again.`, { appearance: 'error' });
            console.error(`Failed to ${action} document:`, err);
        } finally {
            setIsSaving(false);
        }
    };

    if (!document) return null;

    const fileType = document.file_type || '';

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 w-full max-w-6xl h-[90vh] flex flex-col">
                                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-20"><X className="w-6 h-6" /></button>
                                
                                <div className="flex-1 flex min-h-0">
                                    <main className="flex-1 p-6 bg-gray-50 flex items-center justify-center">
                                        {isLoadingUrl ? (
                                            <div className="flex flex-col items-center"><Loader className="w-10 h-10 animate-spin text-primary mb-4" /><p>Loading document...</p></div>
                                        ) : error || !documentUrl ? (
                                            <div className="text-center"><ServerCrash className="w-16 h-16 mx-auto text-red-400 mb-4" /> <p className="font-semibold">Failed to load preview</p></div>
                                        ) : (
                                            <div className="w-full h-full bg-white rounded-lg shadow-inner border">
                                                {fileType.startsWith('image/') ? <img src={documentUrl} alt={document.file_name} className="max-w-full max-h-full object-contain mx-auto" />
                                                : fileType.includes('pdf') ? <iframe src={documentUrl} className="w-full h-full border-0 rounded-lg" title={document.file_name} />
                                                : <div className="text-center p-8"><FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" /><p>Preview not available</p></div>}
                                            </div>
                                        )}
                                    </main>

                                    <aside className="w-96 bg-white border-l p-8 overflow-y-auto flex flex-col">
                                        <div className="flex-1 space-y-6">
                                            <div className="flex items-start gap-4">
                                                <div className="flex-shrink-0 pt-1">{getFileIcon(fileType)}</div>
                                                <div>
                                                    <h1 className="text-xl font-bold text-gray-900 break-words">{document.file_name}</h1>
                                                    <p className="text-sm text-gray-500 mt-1">{formatFileSize(document.file_size)}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Status</h3>
                                                <Badge variant={document.is_verified ? 'success' : 'warning'} size="lg" className="w-full justify-center">
                                                    {document.is_verified ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                                                    {document.is_verified ? 'Verified' : 'Pending Verification'}
                                                </Badge>
                                            </div>

                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Details</h3>
                                                <div className="space-y-3 text-sm">
                                                    <div className="flex items-center"><FileIcon className="w-4 h-4 mr-3" /><span>Type: <strong className="capitalize">{document.document_type.replace('_', ' ')}</strong></span></div>
                                                    <div className="flex items-center"><CalendarIcon className="w-4 h-4 mr-3" /><span>Created: <strong>{formatDate(document.created_at)}</strong></span></div>
                                                    <div className="flex items-center"><Clock className="w-4 h-4 mr-3" /><span>Updated: <strong>{formatDate(document.updated_at)}</strong></span></div>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Verification Notes</h3>
                                                <textarea
                                                    rows="4"
                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                                    value={verifyNotes}
                                                    onChange={(e) => setVerifyNotes(e.target.value)}
                                                    placeholder="Add verification notes..."
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t">
                                            <div className="grid grid-cols-2 gap-3">
                                                <Button variant="danger" onClick={() => handleVerification(false)} disabled={isSaving}>
                                                  {isSaving && !document.is_verified ? <><Loader className="w-4 h-4 mr-2 animate-spin"/>Saving...</> : 'Reject'}
                                                </Button>
                                                <Button variant="primary" onClick={() => handleVerification(true)} disabled={isSaving}>
                                                  {isSaving && document.is_verified ? <><Loader className="w-4 h-4 mr-2 animate-spin"/>Saving...</> : 'Approve'}
                                                </Button>
                                            </div>
                                        </div>
                                    </aside>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

export default DocumentViewerModal; 