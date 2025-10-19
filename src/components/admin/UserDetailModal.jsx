import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, User, Briefcase, Mail, Phone, Calendar, Award, MapPin, Building, Star, Edit, Save, UserCircle, FileText, ShieldCheck, Download, Loader } from 'lucide-react';
import { format } from 'date-fns';

import Button from '../common/Button';
import Badge from '../common/Badge';
import Input from '../common/Input';
import { useUserDocuments } from '../../hooks/admin/useUserDocuments';
import { useToast } from '../../hooks/common/useToast';

const DetailItem = ({ icon, label, children, isEditing, value, onChange, name, readOnly = false }) => (
    <div className="sm:col-span-1 py-3">
        <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
            {icon}
            {label}
        </dt>
        <dd className="mt-1 text-sm text-gray-900">
            {isEditing ? (
                <Input
                    type="text"
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    className="mt-1"
                    readOnly={readOnly}
                    disabled={readOnly}
                />
            ) : (
                children
            )}
        </dd>
    </div>
);


const UserDetailModal = ({ isOpen, onClose, user, onSave, initialEditMode = false }) => {
    const [isEditing, setIsEditing] = useState(initialEditMode);
    const [editedUser, setEditedUser] = useState(user);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const toast = useToast();
    const { documents, loading: docsLoading, error: docsError, updateDocumentVerification, downloadDocument } = useUserDocuments(user?.id);

    useEffect(() => {
        // Process user data to flatten nested profile information
        if (user) {
            const processedUser = {
                ...user,
                // Extract job seeker profile data
                headline: user.job_seeker_profiles?.headline || '',
                location: user.job_seeker_profiles?.current_location || '',
                skills: user.job_seeker_profiles?.skills || [],
                // Extract employer profile data
                position: user.employer_profiles?.position || '',
                company_name: user.employer_profiles?.companies?.name || '',
            };
            setEditedUser(processedUser);
        } else {
            setEditedUser(user);
        }
        
        setError('');
        if (!isOpen) {
            setIsEditing(false);
        } else if (initialEditMode) {
            setIsEditing(true);
        }
    }, [user, isOpen, initialEditMode]);

    if (!editedUser) {
        return null;
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedUser(prev => ({ ...prev, [name]: value }));
    };

    const handleVerifyToggle = async (docId, currentStatus) => {
        try {
            const notes = !currentStatus ? `Verified by admin on ${new Date().toISOString()}` : '';
            await updateDocumentVerification(docId, !currentStatus, notes);
            toast.success(`Document ${!currentStatus ? 'verified' : 'revoked'} successfully.`);
        } catch (err) {
            toast.error('Failed to update document verification.');
            console.error(err);
        }
    };

    const handleDownload = async (filePath, fileName) => {
        try {
            toast.custom('Starting document download...');
            await downloadDocument(filePath, fileName);
        } catch (err) {
            toast.error('Failed to download document.');
            console.error(err);
        }
    };
    
    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        try {
            await onSave(editedUser);
            setIsEditing(false);
            onClose();
            toast.success('User updated successfully.');
        } catch (err) {
            setError(err.message || 'An error occurred while saving.');
            toast.error('Failed to update user.');
        } finally {
            setIsSaving(false);
        }
    };

    const getRoleIcon = (role) => {
        switch(role) {
            case 'admin': return <Briefcase className="w-5 h-5 text-red-600" />;
            case 'employer': return <Briefcase className="w-5 h-5 text-blue-600" />;
            case 'job_seeker': return <User className="w-5 h-5 text-green-600" />;
            default: return <User className="w-5 h-5 text-gray-600" />;
        }
    };
    
    const getRoleColors = (role) => {
        switch(role) {
            case 'admin': return 'bg-red-100 text-red-700';
            case 'employer': return 'bg-blue-100 text-blue-700';
            case 'job_seeker': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => { onClose(); setIsEditing(false); }}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
                                <div className="absolute top-0 right-0 pt-4 pr-4">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                        onClick={() => { onClose(); setIsEditing(false); }}
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                                <div className="p-8">
                                    <div className="flex items-start space-x-6">
                                        <div className="flex-shrink-0 h-20 w-20">
                                            {editedUser.avatar_url ? (
                                                <img className="h-20 w-20 rounded-full" src={editedUser.avatar_url} alt="" />
                                            ) : (
                                                <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <UserCircle className="w-16 h-16 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            {isEditing ? (
                                                <Input
                                                    name="full_name"
                                                    value={editedUser.full_name || ''}
                                                    onChange={handleInputChange}
                                                    className="text-2xl font-bold leading-6 text-gray-900"
                                                />
                                            ) : (
                                                <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-900">
                                                    {editedUser.full_name}
                                                </Dialog.Title>
                                            )}
                                            <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getRoleColors(editedUser.user_type)}`}>
                                                {getRoleIcon(editedUser.user_type)}
                                                <span className="ml-2 capitalize">{editedUser.user_type.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-8 border-t border-gray-200 pt-6">
                                        <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                                            <DetailItem icon={<Phone className="w-4 h-4"/>} label="Phone" isEditing={isEditing} name="phone" value={editedUser.phone} onChange={handleInputChange}>
                                                {editedUser.phone || 'Not provided'}
                                            </DetailItem>
                                            <DetailItem icon={<Calendar className="w-4 h-4"/>} label="Date Joined">
                                                {format(new Date(editedUser.created_at), 'MMMM d, yyyy')}
                                            </DetailItem>
                                            <div className="sm:col-span-1 py-3">
                                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                                <dd className="mt-2 flex flex-col gap-2">
                                                    <Badge variant={editedUser.onboarding_complete ? 'success' : 'default'}>
                                                        Onboarding {editedUser.onboarding_complete ? 'Completed' : 'Pending'}
                                                    </Badge>
                                                    <Badge variant={editedUser.email_verified ? 'success' : 'warning'}>
                                                        Email {editedUser.email_verified ? 'Verified' : 'Not Verified'}
                                                    </Badge>
                                                </dd>
                                            </div>

                                            {editedUser.user_type === 'job_seeker' && (
                                                <>
                                                    <h4 className="sm:col-span-2 text-base font-medium text-gray-800 mt-6 border-b pb-2">Job Seeker Profile</h4>
                                                    <DetailItem icon={<Award className="w-4 h-4"/>} label="Headline" isEditing={isEditing} name="headline" value={editedUser.headline} onChange={handleInputChange}>
                                                        {editedUser.headline || 'Not provided'}
                                                    </DetailItem>
                                                     <DetailItem icon={<MapPin className="w-4 h-4"/>} label="Location" isEditing={isEditing} name="location" value={editedUser.location} onChange={handleInputChange}>
                                                        {editedUser.location || 'Not provided'}
                                                    </DetailItem>
                                                    <div className="sm:col-span-2 py-3">
                                                        <dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><Star className="w-4 h-4"/>Top Skills</dt>
                                                        <dd className="mt-1 text-sm text-gray-900">
                                                            {editedUser.skills?.length > 0 ? (
                                                                <div className="flex flex-wrap gap-2 mt-2">
                                                                    {editedUser.skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                                                                </div>
                                                            ) : 'No skills listed'}
                                                        </dd>
                                                    </div>
                                                </>
                                            )}

                                            {editedUser.user_type === 'employer' && (
                                                <>
                                                    <h4 className="sm:col-span-2 text-base font-medium text-gray-800 mt-6 border-b pb-2">Employer Profile</h4>
                                                    <DetailItem icon={<Building className="w-4 h-4"/>} label="Company" isEditing={isEditing} name="company_name" value={editedUser.company_name} onChange={handleInputChange} readOnly>
                                                        {editedUser.company_name || 'Not provided'}
                                                    </DetailItem>
                                                    <DetailItem icon={<Briefcase className="w-4 h-4"/>} label="Position" isEditing={isEditing} name="position" value={editedUser.position} onChange={handleInputChange}>
                                                        {editedUser.position || 'Not provided'}
                                                    </DetailItem>
                                                </>
                                            )}
                                        </dl>
                                    </div>

                                    <div className="mt-8 border-t border-gray-200 pt-6">
                                        <h4 className="text-base font-medium text-gray-800 flex items-center gap-2 mb-4">
                                            <FileText className="w-5 h-5 text-primary" />
                                            User Documents
                                        </h4>
                                        <div className="space-y-2">
                                            {docsLoading && (
                                                <div className="flex items-center justify-center p-4">
                                                    <Loader className="w-6 h-6 animate-spin text-primary" />
                                                    <span className="ml-2 text-gray-600">Loading documents...</span>
                                                </div>
                                            )}
                                            {docsError && (
                                                <div className="text-red-600 bg-red-50 p-3 rounded-md">Error loading documents: {docsError.message}</div>
                                            )}
                                            {!docsLoading && !docsError && (
                                                documents.length > 0 ? (
                                                    <ul className="divide-y divide-gray-100">
                                                        {documents.map(doc => (
                                                            <li key={doc.id} className="py-3 flex items-center justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    {doc.is_verified ? (
                                                                        <ShieldCheck className="w-6 h-6 text-green-500 flex-shrink-0" />
                                                                    ) : (
                                                                        <FileText className="w-6 h-6 text-gray-400 flex-shrink-0" />
                                                                    )}
                                                                    <div>
                                                                        <p className="font-medium text-gray-800">{doc.file_name}</p>
                                                                        <p className="text-sm text-gray-500 capitalize">{doc.document_type} • Uploaded {format(new Date(doc.created_at), 'MMM d, yyyy')}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Button size="sm" variant="ghost" onClick={() => handleDownload(doc.file_path, doc.file_name)}>
                                                                        <Download className="w-4 h-4"/>
                                                                    </Button>
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant={doc.is_verified ? 'outline' : 'primary'}
                                                                        onClick={() => handleVerifyToggle(doc.id, doc.is_verified)}
                                                                        className="w-28 text-center"
                                                                    >
                                                                        {doc.is_verified ? 'Revoke' : 'Verify'}
                                                                    </Button>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-gray-500 text-center py-4">No documents uploaded.</p>
                                                )
                                            )}
                                        </div>
                                    </div>
                                    {error && <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
                                </div>
                                <div className="bg-gray-50 px-8 py-4 sm:flex sm:flex-row-reverse sm:px-6 rounded-b-2xl">
                                    {isEditing ? (
                                        <>
                                            <Button onClick={handleSave} variant="primary" className="w-full sm:w-auto sm:ml-3" disabled={isSaving}>
                                                {isSaving ? (
                                                  <>
                                                    <Save className="w-5 h-5 mr-2 animate-spin"/>
                                                    Saving...
                                                  </>
                                                ) : (
                                                  <>
                                                    <Save className="w-5 h-5 mr-2"/>
                                                    Save Changes
                                                  </>
                                                )}
                                            </Button>
                                            <Button onClick={() => { setIsEditing(false); setError(''); }} variant="outline" className="mt-3 sm:mt-0 w-full sm:w-auto" disabled={isSaving}>
                                                Cancel
                                            </Button>
                                        </>
                                    ) : (
                                        <Button onClick={() => setIsEditing(true)} variant="primary" className="w-full sm:w-auto">
                                            <Edit className="w-5 h-5 mr-2"/>
                                            Edit User
                                        </Button>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

export default UserDetailModal;