import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MoreHorizontal, Eye, FileText, User, Briefcase, Percent } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import PercentageBar from '../../components/common/PercentageBar';
import InitialsAvatar from '../../components/common/InitialsAvatar';
import ApplicationDetailModal from '../../components/admin/ApplicationDetailModal';
import UserDetailModal from '../../components/admin/UserDetailModal';
import JobDetailModal from '../../components/admin/JobDetailModal';
import { useApplicationManagement } from '../../hooks/admin/useApplicationManagement';
import useOutsideClick from '../../hooks/common/useOutsideClick';


const statusStyles = {
  applied: { variant: 'info', text: 'Applied' },
  reviewing: { variant: 'default', text: 'Reviewing' },
  interviewing: { variant: 'primary', text: 'Interviewing' },
  offer: { variant: 'warning', text: 'Offer' },
  hired: { variant: 'success', text: 'Hired' },
  rejected: { variant: 'danger', text: 'Rejected' },
};

const ApplicationTableRow = ({ application, onView, onViewApplicant, onViewJob }) => {
  const [actionsOpen, setActionsOpen] = useState(false);
  const dropdownRef = useOutsideClick(() => setActionsOpen(false));
  const status = statusStyles[application?.status] || { variant: 'default', text: application?.status || 'Unknown' };

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <InitialsAvatar user={application?.applicant} size="md" />
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{application?.applicant?.full_name || 'Unknown'}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{application?.job?.title || 'Unknown'}</div>
        <div className="text-sm text-gray-500">{application?.job?.company?.name || 'Unknown'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={status.variant} size="sm">{status.text}</Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
            <PercentageBar percentage={application?.ai_match_score ?? 0} size="sm" />
            <span className="text-sm font-medium text-gray-700">{(application?.ai_match_score ?? 0)}%</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex flex-col">
          <span>{(application?.created_at || application?.application_date) ? format(new Date(application.created_at || application.application_date), 'MMM d, yyyy') : 'N/A'}</span>
          <span className="text-xs">{(application?.created_at || application?.application_date) ? formatDistanceToNow(new Date(application.created_at || application.application_date), { addSuffix: true }) : null}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative" ref={dropdownRef}>
        <Button variant="ghost" size="sm" onClick={() => setActionsOpen(!actionsOpen)}>
          <MoreHorizontal className="w-5 h-5" />
        </Button>
        {actionsOpen && (
          <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-md shadow-xl z-50 border border-gray-200 py-2 min-w-max">
            <div className="space-y-1">
              <button onClick={() => { onView(application); setActionsOpen(false); }} className="w-full text-left flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150">
                <FileText className="w-4 h-4 mr-3" /> View Application Details
              </button>
              <button onClick={() => { onViewApplicant(application?.applicant); setActionsOpen(false); }} className="w-full text-left flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150">
                <User className="w-4 h-4 mr-3" /> View Applicant Profile
              </button>
              <button onClick={() => { onViewJob(application?.job); setActionsOpen(false); }} className="w-full text-left flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150">
                <Briefcase className="w-4 h-4 mr-3" /> View Job Post
              </button>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
};

const ApplicationManagementPage = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [isAppModalOpen, setAppModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  const [isUserModalOpen, setUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [isJobModalOpen, setJobModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const { applications, loading, error } = useApplicationManagement();


  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setAppModalOpen(true);
  };

  const handleViewApplicant = (applicant) => {
    setSelectedUser(applicant);
    setUserModalOpen(true);
    setAppModalOpen(false); // Close application modal if open
  };

  const handleViewJob = (job) => {
    setSelectedJob(job);
    setJobModalOpen(true);
    setAppModalOpen(false); // Close application modal if open
  };


  const filteredApplications = useMemo(() => {
    return applications
      .filter(app => {
        if (statusFilter !== 'all' && app.status !== statusFilter) {
          return false;
        }
        if (searchTerm && 
            !app.applicant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !app.job.title.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return false;
        }
        return true;
      });
  }, [applications, searchTerm, statusFilter]);

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Application Management</h1>
          <p className="text-gray-600 mt-1">Review and manage all job applications across the platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              type="text"
              placeholder="Search by applicant or job title..."
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
              {Object.keys(statusStyles).map(status => (
                <option key={status} value={status}>{statusStyles[status].text}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AI Match Score
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Applied
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && <tr><td colSpan="7" className="text-center py-4">Loading...</td></tr>}
              {error && <tr><td colSpan="7" className="text-center py-4 text-red-500">Error fetching applications.</td></tr>}
              {!loading && !error && filteredApplications.map(app => (
                <ApplicationTableRow 
                  key={app.id} 
                  application={app} 
                  onView={handleViewApplication}
                  onViewApplicant={handleViewApplicant}
                  onViewJob={handleViewJob}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ApplicationDetailModal
        isOpen={isAppModalOpen}
        onClose={() => setAppModalOpen(false)}
        application={selectedApplication}
        onViewApplicant={handleViewApplicant}
        onViewJob={handleViewJob}
      />
      <UserDetailModal
        isOpen={isUserModalOpen}
        onClose={() => setUserModalOpen(false)}
        user={selectedUser}
      />
      <JobDetailModal
        isOpen={isJobModalOpen}
        onClose={() => setJobModalOpen(false)}
        job={selectedJob}
      />
    </>
  );
};

export default ApplicationManagementPage;
