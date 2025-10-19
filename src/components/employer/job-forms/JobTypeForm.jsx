import React, { useState } from 'react';
import { Briefcase, Code, BarChart2, Megaphone, Users, Cog } from 'lucide-react';

const JOB_TYPES = [
  {
    id: 'tech',
    title: 'Technology',
    icon: Code,
    description: 'Software development, IT infrastructure, and technical roles',
    roleTypes: ['Software Engineer', 'DevOps Engineer', 'QA Engineer', 'System Administrator', 'Data Engineer']
  },
  {
    id: 'business',
    title: 'Business',
    icon: Briefcase,
    description: 'Business operations, management, and administrative roles',
    roleTypes: ['Business Analyst', 'Project Manager', 'Operations Manager', 'Account Manager']
  },
  {
    id: 'data',
    title: 'Data & Analytics',
    icon: BarChart2,
    description: 'Data science, analytics, and business intelligence roles',
    roleTypes: ['Data Scientist', 'Data Analyst', 'Business Intelligence Analyst', 'Data Engineer']
  },
  {
    id: 'marketing',
    title: 'Marketing',
    icon: Megaphone,
    description: 'Marketing, communications, and creative roles',
    roleTypes: ['Marketing Manager', 'Content Strategist', 'Digital Marketing Specialist', 'Brand Manager']
  },
  {
    id: 'hr',
    title: 'Human Resources',
    icon: Users,
    description: 'HR, recruitment, and people operations roles',
    roleTypes: ['HR Manager', 'Recruiter', 'People Operations Specialist', 'HR Business Partner']
  },
  {
    id: 'other',
    title: 'Other',
    icon: Cog,
    description: 'Other specialized or cross-functional roles',
    roleTypes: ['Consultant', 'Product Manager', 'Research Analyst', 'Specialist']
  }
];

const JobTypeForm = ({ data, onSubmit }) => {
  const [selectedType, setSelectedType] = useState(data.job_type || '');
  const [selectedRole, setSelectedRole] = useState(data.role_type || '');

  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
    setSelectedRole(''); // Reset role selection when type changes
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    // Auto-submit when a role is selected
    onSubmit({
      job_type: selectedType,
      role_type: role
    });
  };

  const selectedJobType = JOB_TYPES.find(type => type.id === selectedType);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Select Job Category</h3>
        <p className="text-sm text-gray-500 mb-4">Choose the category that best fits your job posting</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {JOB_TYPES.map(type => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            
            return (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type.id)}
                className={`flex flex-col p-4 rounded-lg border-2 transition-all ${
                  isSelected 
                    ? 'border-primary bg-primary/5 shadow-sm' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${
                  isSelected ? 'bg-primary/10' : 'bg-gray-100'
                }`}>
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-gray-500'}`} />
                </div>
                <h4 className={`font-medium mb-1 ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
                  {type.title}
                </h4>
                <p className="text-sm text-gray-500 flex-1">
                  {type.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {selectedType && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Select Role Type</h3>
          <p className="text-sm text-gray-500 mb-4">Choose the specific role type for your job posting</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedJobType?.roleTypes.map(role => {
              const isSelected = selectedRole === role;
              
              return (
                <button
                  key={role}
                  onClick={() => handleRoleSelect(role)}
                  className={`p-3 text-left rounded-lg border transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {role}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobTypeForm; 