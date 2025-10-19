import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Building, Globe, Briefcase, MapPin, Users, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import Button from '../common/Button';
import Badge from '../common/Badge';
import CompanyLogo from '../common/CompanyLogo';

const CompanyDetailModal = ({ company, isOpen, onClose, onApprove, onReject }) => {
  if (!company) return null;
  
  const [isSaving, setIsSaving] = useState(false);

  const handleApproveClick = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onApprove(company.id);
    } catch (error) {
      console.error('Approve action failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRejectClick = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onReject(company.id);
    } catch (error) {
      console.error('Reject action failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const {
    name,
    logo_url,
    website,
    industry,
    size,
    headquarters_location,
    founded_year,
    created_by,
    created_at,
    description,
    is_approved, // Assuming this field will be added
  } = company;

  const status = is_approved ? { text: 'Approved', variant: 'success', icon: <CheckCircle className="w-4 h-4" /> } 
    : is_approved === false ? { text: 'Rejected', variant: 'danger', icon: <XCircle className="w-4 h-4" /> }
    : { text: 'Pending Approval', variant: 'warning', icon: <Calendar className="w-4 h-4" /> };


  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                    onClick={onClose}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="p-8">
                  <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0">
                      <CompanyLogo company={company} size="lg" />
                    </div>
                    <div className="flex-1">
                      <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-900">
                        {name}
                      </Dialog.Title>
                       <a href={`https://${website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 mt-1">
                          {website} <Globe className="w-4 h-4" />
                       </a>
                        <div className="mt-4">
                          <Badge variant={status.variant} size="lg" icon={status.icon}>{status.text}</Badge>
                        </div>
                    </div>
                  </div>

                  <div className="mt-8 border-t border-gray-200 pt-8">
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-3">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><Briefcase className="w-4 h-4"/>Industry</dt>
                        <dd className="mt-1 text-sm text-gray-900">{industry}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><Users className="w-4 h-4"/>Company Size</dt>
                        <dd className="mt-1 text-sm text-gray-900">{size}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><MapPin className="w-4 h-4"/>Headquarters</dt>
                        <dd className="mt-1 text-sm text-gray-900">{headquarters_location}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><Calendar className="w-4 h-4"/>Founded</dt>
                        <dd className="mt-1 text-sm text-gray-900">{founded_year}</dd>
                      </div>
                       <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Registered On</dt>
                        <dd className="mt-1 text-sm text-gray-900">{format(new Date(created_at), 'MMM d, yyyy')}</dd>
                      </div>
                       <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Registered By</dt>
                        <dd className="mt-1 text-sm text-gray-900">{created_by.full_name}</dd>
                      </div>
                      <div className="sm:col-span-3">
                        <dt className="text-sm font-medium text-gray-500">About</dt>
                        <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{description || 'No description provided.'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="bg-gray-50 px-8 py-4 sm:flex sm:flex-row-reverse sm:px-6 rounded-b-2xl">
                  {status.text === 'Pending Approval' && (
                    <>
                      <Button onClick={handleApproveClick} variant="success" className="w-full sm:w-auto sm:ml-3" disabled={isSaving}>
                        <CheckCircle className="w-5 h-5 mr-2"/>
                        Approve
                      </Button>
                      <Button onClick={handleRejectClick} variant="danger" className="mt-3 sm:mt-0 w-full sm:w-auto" disabled={isSaving}>
                        <XCircle className="w-5 h-5 mr-2"/>
                        Reject
                      </Button>
                    </>
                  )}
                   {status.text === 'Rejected' && (
                      <Button onClick={handleApproveClick} variant="success" className="w-full sm:w-auto sm:ml-3" disabled={isSaving}>
                        <CheckCircle className="w-5 h-5 mr-2"/>
                        Approve
                      </Button>
                  )}
                   {status.text === 'Approved' && (
                      <Button onClick={handleRejectClick} variant="danger" className="w-full sm:w-auto sm:ml-3" disabled={isSaving}>
                        <XCircle className="w-5 h-5 mr-2"/>
                        Reject
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

export default CompanyDetailModal; 