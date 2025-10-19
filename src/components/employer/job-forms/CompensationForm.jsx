import React from 'react';
import { Plus, X } from 'lucide-react';
import Button from '../../common/Button';

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' }
];

const SALARY_TYPES = [
  { value: 'fixed', label: 'Fixed Amount' },
  { value: 'range', label: 'Salary Range' },
  { value: 'negotiable', label: 'Negotiable' }
];

const CompensationForm = ({ data, onSubmit }) => {
  const [formData, setFormData] = React.useState({
    employment_type: data.employment_type || 'full_time',
    salary_type: data.salary_type || 'fixed',
    salary_currency: data.salary_currency || 'EUR',
    salary_min: data.salary_min || '',
    salary_max: data.salary_max || '',
    salary_fixed: data.salary_fixed || '',
    salary_period: data.salary_period || 'yearly',
    benefits: data.benefits || [],
    equity_offered: data.equity_offered || false,
    equity_details: data.equity_details || ''
  });

  const [newBenefit, setNewBenefit] = React.useState('');

  const isValidSalary = () => {
    if (formData.salary_type === 'fixed') {
      return !!formData.salary_fixed;
    } else if (formData.salary_type === 'range') {
      return !!formData.salary_min && !!formData.salary_max && 
             Number(formData.salary_min) <= Number(formData.salary_max);
    }
    return true; // For negotiable
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };
    setFormData(newFormData);
    
    // Auto-submit if form is valid
    if (isValidSalary() && newFormData.employment_type) {
      onSubmit(newFormData);
    }
  };

  const handleAddBenefit = () => {
    if (newBenefit.trim()) {
      const newFormData = {
        ...formData,
        benefits: [...formData.benefits, newBenefit.trim()]
      };
      setFormData(newFormData);
      setNewBenefit('');
      
      // Auto-submit if form is valid
      if (isValidSalary() && newFormData.employment_type) {
        onSubmit(newFormData);
      }
    }
  };

  const handleRemoveBenefit = (benefitToRemove) => {
    const newFormData = {
      ...formData,
      benefits: formData.benefits.filter(benefit => benefit !== benefitToRemove)
    };
    setFormData(newFormData);
    
    // Auto-submit if form is valid
    if (isValidSalary() && newFormData.employment_type) {
      onSubmit(newFormData);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Compensation & Benefits</h3>
        <p className="text-sm text-gray-500 mb-4">Define the compensation package and benefits for this position</p>

        <div className="space-y-4">
          {/* Employment Type */}
          <div>
            <label htmlFor="employment_type" className="block text-sm font-medium text-gray-700 mb-1">
              Employment Type*
            </label>
            <select
              id="employment_type"
              name="employment_type"
              value={formData.employment_type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {EMPLOYMENT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Salary Type */}
          <div>
            <label htmlFor="salary_type" className="block text-sm font-medium text-gray-700 mb-1">
              Salary Type*
            </label>
            <select
              id="salary_type"
              name="salary_type"
              value={formData.salary_type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {SALARY_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Salary Details */}
          {formData.salary_type !== 'negotiable' && (
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="salary_currency" className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    id="salary_currency"
                    name="salary_currency"
                    value={formData.salary_currency}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="salary_period" className="block text-sm font-medium text-gray-700 mb-1">
                    Period
                  </label>
                  <select
                    id="salary_period"
                    name="salary_period"
                    value={formData.salary_period}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="yearly">Per Year</option>
                    <option value="monthly">Per Month</option>
                    <option value="hourly">Per Hour</option>
                  </select>
                </div>
              </div>

              {formData.salary_type === 'fixed' ? (
                <div className="mt-4">
                  <label htmlFor="salary_fixed" className="block text-sm font-medium text-gray-700 mb-1">
                    Fixed Amount*
                  </label>
                  <input
                    type="number"
                    id="salary_fixed"
                    name="salary_fixed"
                    value={formData.salary_fixed}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter fixed salary amount"
                    required
                  />
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="salary_min" className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum*
                    </label>
                    <input
                      type="number"
                      id="salary_min"
                      name="salary_min"
                      value={formData.salary_min}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Minimum salary"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="salary_max" className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum*
                    </label>
                    <input
                      type="number"
                      id="salary_max"
                      name="salary_max"
                      value={formData.salary_max}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Maximum salary"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Benefits */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Benefits
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a benefit..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddBenefit()}
              />
              <Button onClick={handleAddBenefit} variant="outline" size="icon">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.benefits.map((benefit, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                >
                  {benefit}
                  <button
                    type="button"
                    onClick={() => handleRemoveBenefit(benefit)}
                    className="ml-2 inline-flex items-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Equity */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="equity_offered"
                name="equity_offered"
                checked={formData.equity_offered}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="equity_offered" className="ml-2 block text-sm font-medium text-gray-700">
                Equity Offered
              </label>
            </div>

            {formData.equity_offered && (
              <div>
                <label htmlFor="equity_details" className="block text-sm font-medium text-gray-700 mb-1">
                  Equity Details
                </label>
                <textarea
                  id="equity_details"
                  name="equity_details"
                  value={formData.equity_details}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the equity package..."
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompensationForm; 