import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Users, MapPin, Briefcase } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import CompanyLogo from '../../components/common/CompanyLogo';
import JobDetailModal from '../../components/admin/JobDetailModal';
import { useJobManagement } from '../../hooks/admin/useJobManagement';
import useOutsideClick from '../../hooks/common/useOutsideClick';


const statusStyles = {
  active: { variant: 'success', text: 'Active' },
  paused: { variant: 'warning', text: 'Paused' },
  closed: { variant: 'danger', text: 'Closed' },
  draft: { variant: 'default', text: 'Draft' },
};

const JobTableRow = ({ job, onView }) => {
  const [actionsOpen, setActionsOpen] = useState(false);
  const dropdownRef = useOutsideClick(() => setActionsOpen(false));
  const status = statusStyles[job.status];

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <CompanyLogo company={job.company} size="md" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{job.title}</div>
            <div className="text-sm text-gray-500">{job.company?.name}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400"/> {job.location}</div>
        <div className="text-sm text-gray-500 flex items-center gap-2"><Briefcase className="w-4 h-4 text-gray-400"/> {job.employment_type}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={status.variant} size="sm">{status.text}</Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400"/>
          {job.applicants_count} Applicants
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex flex-col">
          <span>{job.created_at ? format(new Date(job.created_at), 'MMM d, yyyy') : 'N/A'}</span>
          <span className="text-xs">{job.created_at ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true }) : null}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative" ref={dropdownRef}>
        <Button variant="ghost" size="sm" onClick={() => setActionsOpen(!actionsOpen)}>
          <MoreHorizontal className="w-5 h-5" />
        </Button>
        {actionsOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-xl z-50 border border-gray-200 py-2 min-w-max">
            <div className="space-y-1">
              <button onClick={() => { onView(job); setActionsOpen(false); }} className="w-full text-left flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150">
                <Eye className="w-4 h-4 mr-3" /> View Job
              </button>
              <button className="w-full text-left flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150">
                <Edit className="w-4 h-4 mr-3" /> Edit Job
              </button>
              <button className="w-full text-left flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150">
                <Trash2 className="w-4 h-4 mr-3" /> Delete Job
              </button>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
};

const JobManagementPage = () => {
  const { t } = useTranslation('employer');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { jobs, loading, error } = useJobManagement();

  const handleViewJob = (job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const filteredJobs = useMemo(() => {
    return jobs
      .filter(job => {
        if (statusFilter !== 'all' && job.status !== statusFilter) {
          return false;
        }
        if (searchTerm && !job.title.toLowerCase().includes(searchTerm.toLowerCase()) && !job.company?.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        return true;
      });
  }, [jobs, searchTerm, statusFilter]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Post Management</h1>
            <p className="text-gray-600 mt-1">Oversee all job postings on the platform.</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Job
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              type="text"
              placeholder="Search jobs by title or company..."
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
                  Job Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location & Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicants
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Posted
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && <tr><td colSpan="8" className="text-center py-4">Loading...</td></tr>}
              {error && <tr><td colSpan="8" className="text-center py-4 text-red-500">Error fetching jobs.</td></tr>}
              {!loading && !error && filteredJobs.map(job => (
                <JobTableRow key={job.id} job={job} onView={handleViewJob} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <JobDetailModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        job={selectedJob}
      />
    </>
  );
};

export default JobManagementPage;
