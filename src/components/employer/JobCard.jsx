import { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, Edit, Eye, Pause, Trash2, Users, Calendar, MapPin, TrendingUp, Loader } from 'lucide-react';

export default function JobCard({ job, index, onAction }) {
  const [openDropdown, setOpenDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleAction = (actionType) => {
    setOpenDropdown(false);
    if (onAction) {
      onAction(actionType, job.id);
    }
  };

  return (
    <div 
      onClick={() => !job.isLoading && handleAction('view')}
      className={`bg-white rounded-lg border border-gray-200 p-6 transition-all duration-300 group hover:border-primary-200 relative ${job.isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {job.isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-50">
          <div className="flex items-center space-x-3">
            <Loader className="w-6 h-6 text-primary animate-spin" />
            <span className="text-sm font-medium text-primary-700">Processing...</span>
          </div>
        </div>
      )}

      {/* Job Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(job.status)}`}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
            {job.newApplicants > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full border border-red-200">
                {job.newApplicants} new
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 overflow-hidden">
            {job.title}
          </h3>
        </div>
        
        <div className="relative dropdown-container" ref={dropdownRef}>
          <button 
            className={`p-2 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${job.isLoading ? 'pointer-events-none' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setOpenDropdown(!openDropdown);
            }}
            disabled={job.isLoading}
          >
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </button>
          {openDropdown && !job.isLoading && (
            <div 
              className="absolute right-0 top-12 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-48 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => handleAction('view')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>View Details</span>
              </button>
              <button 
                onClick={() => handleAction('edit')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Job</span>
              </button>
              {job.status === 'draft' ? (
                <button 
                  onClick={() => handleAction('activate')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Activate Job</span>
                </button>
              ) : (
                <button 
                  onClick={() => handleAction('pause')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause Job</span>
                </button>
              )}
              <hr className="my-1" />
              <button 
                onClick={() => handleAction('delete')}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Job</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Job Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-3 overflow-hidden">
        {job.description}
      </p>

      {/* Job Details */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-primary" />
          <span>{job.location}</span>
          <span className="text-gray-400">•</span>
          <span>{job.workModel}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span className="w-4 h-4 text-green-500 flex items-center justify-center font-bold">€</span>
          <span className="font-medium text-green-700">{job.salary}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-orange-500" />
          <span>Posted {job.time}</span>
        </div>
      </div>




    </div>
  );
}
