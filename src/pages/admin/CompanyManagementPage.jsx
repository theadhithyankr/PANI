import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, MoreHorizontal, Building, Briefcase, MapPin, Globe, Edit, Trash2, Eye, CheckCircle, XCircle, Clock, Loader, AlertTriangle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import CompanyLogo from '../../components/common/CompanyLogo';
import CompanyDetailModal from '../../components/admin/CompanyDetailModal';
import { useCompanyManagement } from '../../hooks/admin/useCompanyManagement';

const CompanyTableRow = ({ company, onView, openDropdownId, onDropdownToggle, onDropdownClose }) => {
  const dropdownRef = useRef(null);
  const isOpen = openDropdownId === company.id;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onDropdownClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onDropdownClose]);

  const status = company.is_approved ? { text: 'Approved', variant: 'success', icon: <CheckCircle className="w-4 h-4" /> } 
    : company.is_approved === false ? { text: 'Rejected', variant: 'danger', icon: <XCircle className="w-4 h-4" /> }
    : { text: 'Pending', variant: 'warning', icon: <Clock className="w-4 h-4" /> };

  const handleToggleDropdown = () => {
    if (isOpen) {
      onDropdownClose();
    } else {
      onDropdownToggle(company.id);
    }
  };

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <CompanyLogo company={company} size="md" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{company.name}</div>
            {company.website ? (
              <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-primary flex items-center gap-1">
                {company.website} <Globe className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-sm text-gray-400">No website</span>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{company.industry}</div>
      </td>
       <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={status.variant} size="sm" icon={status.icon}>
          {status.text}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex flex-col">
          <span>{format(new Date(company.created_at), 'MMM d, yyyy')}</span>
          <span className="text-xs">{formatDistanceToNow(new Date(company.created_at), { addSuffix: true })}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative" ref={dropdownRef}>
        <Button variant="ghost" size="sm" onClick={handleToggleDropdown}>
          <MoreHorizontal className="w-5 h-5" />
        </Button>
        {isOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-xl z-50 border border-gray-200 py-2 min-w-max">
            <div className="space-y-1">
              <button onClick={() => { onView(company); onDropdownClose(); }} className="w-full text-left flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150">
                <Eye className="w-4 h-4 mr-3" /> View Company
              </button>
              <button className="w-full text-left flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150">
                <Edit className="w-4 h-4 mr-3" /> Edit Company
              </button>
              <button className="w-full text-left flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150">
                <Trash2 className="w-4 h-4 mr-3" /> Delete Company
              </button>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
};

const CompanyManagementPage = () => {
  const { t } = useTranslation('employer');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const { companies, loading, error, updateCompanyStatus } = useCompanyManagement();
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const industries = useMemo(() => [...new Set((companies || []).map(c => c.industry).filter(industry => industry !== null))], [companies]);

  const handleDropdownToggle = (companyId) => {
    setOpenDropdownId(companyId);
  };

  const handleDropdownClose = () => {
    setOpenDropdownId(null);
  };

  const handleApprove = async (companyId) => {
    try {
      await updateCompanyStatus(companyId, true);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to approve company:", err);
      // Optionally show a toast notification for the error
    }
  };

  const handleReject = async (companyId) => {
    try {
      await updateCompanyStatus(companyId, false);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to reject company:", err);
      // Optionally show a toast notification for the error
    }
  };

  const handleViewCompany = (company) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
  };

  const filteredCompanies = useMemo(() => {
    if (!companies) return [];
    return companies
      .filter(company => {
        if (statusFilter !== 'all') {
          const status = statusFilter === 'approved' ? true : statusFilter === 'rejected' ? false : null;
          if (company.is_approved !== status) return false;
        }
        if (industryFilter !== 'all' && company.industry !== industryFilter) {
          return false;
        }
        if (searchTerm && !company.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        return true;
      });
  }, [searchTerm, statusFilter, industryFilter, companies]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company Management</h1>
            <p className="text-gray-600 mt-1">Approve, reject, and manage all companies on the platform.</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Company
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <Input
              type="text"
              placeholder="Search companies by name..."
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
                     <div>
             <select
               value={industryFilter}
               onChange={(e) => setIndustryFilter(e.target.value)}
               className="w-full bg-white border border-gray-300 rounded-lg shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
             >
               <option value="all">All Industries</option>
               {industries.map(industry => (
                 <option key={industry} value={industry}>{industry}</option>
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
                  Company
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Industry
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Registered
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-10">
                    <div className="flex justify-center items-center">
                      <Loader className="w-8 h-8 animate-spin text-primary" />
                      <span className="ml-4 text-lg text-gray-600">Loading Companies...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" className="text-center py-10">
                    <div className="flex flex-col justify-center items-center text-red-600">
                      <AlertTriangle className="w-8 h-8" />
                      <span className="ml-4 text-lg mt-2">Error fetching companies.</span>
                      <p className="text-sm">{error.message}</p>
                    </div>
                  </td>
                </tr>
              ) : filteredCompanies.length > 0 ? (
                filteredCompanies.map(company => (
                  <CompanyTableRow 
                    key={company.id} 
                    company={company} 
                    onView={handleViewCompany}
                    openDropdownId={openDropdownId}
                    onDropdownToggle={handleDropdownToggle}
                    onDropdownClose={handleDropdownClose}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-10">
                    <p className="text-lg text-gray-600">No companies found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <CompanyDetailModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        company={selectedCompany}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
};

export default CompanyManagementPage;
