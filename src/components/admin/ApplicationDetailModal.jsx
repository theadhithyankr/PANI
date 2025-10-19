import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, User, Briefcase, Calendar, MessageSquare, Percent, Check, FileText } from 'lucide-react';
import { format } from 'date-fns';
import Button from '../common/Button';
import Badge from '../common/Badge';
import PercentageBar from '../common/PercentageBar';

const statusStyles = {
  applied: { variant: 'info', text: 'Applied' },
  reviewing: { variant: 'default', text: 'Reviewing' },
  interviewing: { variant: 'primary', text: 'Interviewing' },
  offer: { variant: 'warning', text: 'Offer' },
  hired: { variant: 'success', text: 'Hired' },
  rejected: { variant: 'danger', text: 'Rejected' },
};

const ApplicationDetailModal = ({ application, isOpen, onClose, onViewApplicant, onViewJob }) => {
  if (!application) return null;

  const status = statusStyles[application.status];

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
                    <div className="flex-shrink-0 h-20 w-20">
                      <img className="h-20 w-20 rounded-full" src={application.applicant.avatar_url} alt={`${application.applicant.full_name}`} />
                    </div>
                    <div className="flex-1">
                      <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                        {application.applicant.full_name}
                      </Dialog.Title>
                      <p className="text-md text-gray-600 mt-1">
                        Applied for <span className="font-semibold">{application.job.title}</span> at <span className="font-semibold">{application.job.company.name}</span>
                      </p>
                      <div className="mt-4 flex items-center gap-4">
                        <Badge variant={status.variant} size="lg">{status.text}</Badge>
                         <div className="flex items-center gap-2">
                            <PercentageBar percentage={application.ai_match_score} size="md" />
                            <span className="text-md font-bold text-gray-700">{application.ai_match_score}% <span className="font-normal text-sm">Match</span></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 border-t border-gray-200 pt-8 space-y-6">
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2"><MessageSquare className="w-4 h-4"/>Cover Note</h4>
                        <p className="text-sm text-gray-800 bg-gray-50 p-4 rounded-lg italic">
                            "{application.cover_note || 'No cover note provided.'}"
                        </p>
                    </div>
                     <div>
                        <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2"><FileText className="w-4 h-4"/>Employer Notes</h4>
                        <p className="text-sm text-gray-800">
                            {application.employer_notes || 'No notes added yet.'}
                        </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-8 py-4 sm:flex justify-between items-center sm:px-6 rounded-b-2xl border-t">
                    <p className="text-xs text-gray-500">
                        Applied on {application.created_at ? format(new Date(application.created_at), 'MMMM d, yyyy') : 'N/A'}
                    </p>
                    <div className="mt-4 sm:mt-0 flex gap-3">
                        <Button onClick={() => onViewApplicant(application.applicant)} variant="outline"><User className="w-4 h-4 mr-2"/>View Profile</Button>
                        <Button onClick={() => onViewJob(application.job)} variant="primary"><Briefcase className="w-4 h-4 mr-2"/>View Job</Button>
                    </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ApplicationDetailModal; 