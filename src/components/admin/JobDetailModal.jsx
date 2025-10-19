import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Briefcase, MapPin, Calendar, Clock, Users, Euro, Cpu, CheckSquare, Sparkles, User, Tag } from 'lucide-react';
import { format } from 'date-fns';
import Button from '../common/Button';
import Badge from '../common/Badge';
import CompanyLogo from '../common/CompanyLogo';

const statusStyles = {
  active: { variant: 'success', text: 'Active' },
  paused: { variant: 'warning', text: 'Paused' },
  closed: { variant: 'danger', text: 'Closed' },
  draft: { variant: 'default', text: 'Draft' },
};

const DetailSection = ({ title, children, icon }) => (
    <div className="py-6 border-b border-gray-200 last:border-b-0">
        <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-3 mb-4">
            {icon}
            {title}
        </h4>
        <div className="text-sm text-gray-700 space-y-4">
            {children}
        </div>
    </div>
);

const InfoItem = ({ label, value, icon, children }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
            {icon}
            {label}
        </dt>
        <dd className="mt-1 text-sm text-gray-900">{value || children}</dd>
    </div>
);


const JobDetailModal = ({ job, isOpen, onClose }) => {
  if (!job) return null;

  const status = statusStyles[job.status] || statusStyles.draft;

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl max-h-[95vh] flex flex-col">
                <div className="absolute top-0 right-0 pt-4 pr-4 z-10">
                  <button
                    type="button"
                    className="rounded-full p-1 bg-white/50 text-gray-500 hover:text-gray-800 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    {job.feature_image_url && (
                        <div className="h-48 bg-gray-200">
                            <img src={job.feature_image_url} alt={job.title} className="w-full h-full object-cover"/>
                        </div>
                    )}
                    <div className="p-8">
                      <div className="flex items-start space-x-6">
                        <div className="flex-shrink-0">
                          <CompanyLogo company={job.company} size="lg" />
                        </div>
                        <div className="flex-1">
                          <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-900">
                            {job.title}
                          </Dialog.Title>
                          <p className="text-md text-gray-600 mt-1">{job.company.name}</p>
                           <div className="mt-4">
                              <Badge variant={status.variant} size="lg">{status.text}</Badge>
                            </div>
                        </div>
                      </div>

                      <div className="mt-8">
                        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                           <InfoItem icon={<MapPin className="w-4 h-4" />} label="Location" value={job.location} />
                           <InfoItem icon={<Briefcase className="w-4 h-4" />} label="Job Type" value={job.employment_type} />
                           <InfoItem icon={<Users className="w-4 h-4" />} label="Experience" value={job.experience_level} />
                           <InfoItem icon={<Euro className="w-4 h-4" />} label="Salary">
                                {job.salary_range.min && `${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(job.salary_range.min)} - ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(job.salary_range.max)}`}
                           </InfoItem>
                        </dl>
                      </div>

                      <div className="mt-2">
                        <DetailSection title="Job Description" icon={<CheckSquare className="w-5 h-5 text-primary" />}>
                           <p className="whitespace-pre-wrap">{job.description}</p>
                        </DetailSection>
                        <DetailSection title="Responsibilities" icon={<Cpu className="w-5 h-5 text-primary" />}>
                           <ul className="list-disc list-inside space-y-2">
                            {job.responsibilities.map((item, i) => <li key={i}>{item}</li>)}
                           </ul>
                        </DetailSection>
                        <DetailSection title="Requirements" icon={<Sparkles className="w-5 h-5 text-primary" />}>
                           <ul className="list-disc list-inside space-y-2">
                            {job.requirements.map((item, i) => <li key={i}>{item}</li>)}
                           </ul>
                        </DetailSection>
                         <DetailSection title="Skills" icon={<Tag className="w-5 h-5 text-primary" />}>
                           <div className="flex flex-wrap gap-2">
                            {job.skills_required.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                           </div>
                        </DetailSection>
                      </div>
                    </div>
                </div>

                <div className="bg-gray-50 px-8 py-4 sm:flex justify-between items-center sm:px-6 rounded-b-2xl border-t">
                    <div className="text-xs text-gray-500">
                        <p>Posted by {job.created_by?.full_name} on {job.created_at ? format(new Date(job.created_at), 'MMM d, yyyy') : 'N/A'}</p>
                        <p>Application Deadline: {job.application_deadline ? format(new Date(job.application_deadline), 'MMM d, yyyy') : 'N/A'}</p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                        <Button onClick={onClose} variant="outline">Close</Button>
                        <Button variant="primary" className="ml-3">
                            <Users className="w-5 h-5 mr-2"/>
                            View Applicants ({job.applicants_count})
                        </Button>
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

export default JobDetailModal; 