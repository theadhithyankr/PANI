import React from 'react';
import { Plus, X } from 'lucide-react';
import Button from '../../common/Button';

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid Level (2-5 years)' },
  { value: 'senior', label: 'Senior Level (5-8 years)' },
  { value: 'lead', label: 'Lead/Principal (8+ years)' },
  { value: 'executive', label: 'Executive Level' }
];

const RequirementsForm = ({ data, onSubmit }) => {
  const [formData, setFormData] = React.useState({
    requirements: data.requirements || '',
    experience_level: data.experience_level || 'mid',
    skills_required: data.skills_required || [],
    drivers_license: data.drivers_license || '',
    preferred_language: data.preferred_language || '',
    additional_questions: data.additional_questions || []
  });

  const [newSkill, setNewSkill] = React.useState('');
  const [newQuestion, setNewQuestion] = React.useState('');

  const isValid = () => {
    return formData.requirements && formData.experience_level && formData.skills_required.length > 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };
    setFormData(newFormData);

    // Auto-submit if form is valid
    if (newFormData.requirements && newFormData.experience_level && newFormData.skills_required.length > 0) {
      onSubmit(newFormData);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      const newFormData = {
        ...formData,
        skills_required: [...formData.skills_required, newSkill.trim()]
      };
      setFormData(newFormData);
      setNewSkill('');

      // Auto-submit if form is valid
      if (newFormData.requirements && newFormData.experience_level && newFormData.skills_required.length > 0) {
        onSubmit(newFormData);
      }
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    const newFormData = {
      ...formData,
      skills_required: formData.skills_required.filter(skill => skill !== skillToRemove)
    };
    setFormData(newFormData);

    // Auto-submit if form is valid
    if (newFormData.requirements && newFormData.experience_level && newFormData.skills_required.length > 0) {
      onSubmit(newFormData);
    }
  };

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      const newFormData = {
        ...formData,
        additional_questions: [...formData.additional_questions, newQuestion.trim()]
      };
      setFormData(newFormData);
      setNewQuestion('');

      // Auto-submit if form is valid
      if (newFormData.requirements && newFormData.experience_level && newFormData.skills_required.length > 0) {
        onSubmit(newFormData);
      }
    }
  };

  const handleRemoveQuestion = (questionToRemove) => {
    const newFormData = {
      ...formData,
      additional_questions: formData.additional_questions.filter(q => q !== questionToRemove)
    };
    setFormData(newFormData);

    // Auto-submit if form is valid
    if (newFormData.requirements && newFormData.experience_level && newFormData.skills_required.length > 0) {
      onSubmit(newFormData);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Job Requirements</h3>
        <p className="text-sm text-gray-500 mb-4">Define the requirements and qualifications for the role</p>

        <div className="space-y-4">
          {/* Requirements */}
          <div>
            <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-1">
              Requirements*
            </label>
            <textarea
              id="requirements"
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="List the key requirements and qualifications..."
              required
            />
          </div>

          {/* Experience Level */}
          <div>
            <label htmlFor="experience_level" className="block text-sm font-medium text-gray-700 mb-1">
              Experience Level*
            </label>
            <select
              id="experience_level"
              name="experience_level"
              value={formData.experience_level}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {EXPERIENCE_LEVELS.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* Required Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Required Skills*
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a required skill..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
              />
              <Button onClick={handleAddSkill} variant="outline" size="icon">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills_required.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-2 inline-flex items-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Driver's License */}
          <div>
            <label htmlFor="drivers_license" className="block text-sm font-medium text-gray-700 mb-1">
              Driver's License Requirement
            </label>
            <select
              id="drivers_license"
              name="drivers_license"
              value={formData.drivers_license}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Not Required</option>
              <option value="required">Required</option>
              <option value="preferred">Preferred</option>
            </select>
          </div>

          {/* Preferred Language */}
          <div>
            <label htmlFor="preferred_language" className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Language
            </label>
            <select
              id="preferred_language"
              name="preferred_language"
              value={formData.preferred_language}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">No Preference</option>
              <option value="english">English</option>
              <option value="german">German</option>
              <option value="both">Both English and German</option>
            </select>
          </div>

          {/* Additional Questions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Questions for Candidates
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a question..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddQuestion()}
              />
              <Button onClick={handleAddQuestion} variant="outline" size="icon">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-2">
              {formData.additional_questions.map((question, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-700">{question}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(question)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequirementsForm; 