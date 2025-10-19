import React, { useState } from 'react';
import { ArrowLeft, Save, Eye, Wand2 } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Card from '../common/Card';

const JobForm = ({ job, onSave, onCancel, onPreview, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    title: job?.title || '',
    company: job?.company || 'TechCorp Solutions',
    location: job?.location || '',
    type: job?.type || 'full-time',
    remote: job?.remote || 'hybrid',
    salary: job?.salary || '',
    description: job?.description || '',
    requirements: job?.requirements?.join('\n') || '',
    benefits: job?.benefits?.join('\n') || '',
    skills: job?.skills?.join(', ') || '',
  });

  const [useAI, setUseAI] = useState(false);

  const jobTypeOptions = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
  ];

  const remoteOptions = [
    { value: 'on-site', label: 'On-site' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' },
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const jobData = {
      ...formData,
      requirements: formData.requirements.split('\n').filter(r => r.trim()),
      benefits: formData.benefits.split('\n').filter(b => b.trim()),
      skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
      status: 'draft',
      postedDate: new Date().toISOString().split('T')[0],
      applicationsCount: 0,
      viewsCount: 0,
    };
    onSave(jobData);
  };

  const generateWithAI = () => {
    // Simulate AI generation
    setFormData(prev => ({
      ...prev,
      description: `We are seeking a talented ${prev.title} to join our innovative team. This role offers an exciting opportunity to work with cutting-edge technologies and contribute to meaningful projects that impact thousands of users.

As a ${prev.title}, you will be responsible for developing and maintaining high-quality software solutions, collaborating with cross-functional teams, and driving technical excellence across our platform.`,
      requirements: `5+ years of experience in software development
Strong proficiency in modern programming languages
Experience with cloud platforms (AWS, Azure, or GCP)
Excellent problem-solving and communication skills
Bachelor's degree in Computer Science or related field`,
      benefits: `Competitive salary and equity package
Comprehensive health, dental, and vision insurance
Flexible working hours and remote work options
Professional development budget
Modern office with latest technology`,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'edit' ? 'Edit Job' : 'Create New Job'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Wand2 className="w-4 h-4" />
            AI Assistant
          </label>
          <Button variant="outline" onClick={onPreview}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            <Save className="w-4 h-4 mr-2" />
            {mode === 'edit' ? 'Update Job' : 'Save Draft'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="Job Title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Senior Full Stack Developer"
              required
            />
            <Input
              label="Location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="e.g., Berlin, Germany"
              required
            />
            <Select
              label="Job Type"
              options={jobTypeOptions}
              value={formData.type}
              onChange={(value) => handleChange('type', value)}
            />
            <Select
              label="Work Arrangement"
              options={remoteOptions}
              value={formData.remote}
              onChange={(value) => handleChange('remote', value)}
            />
            <Input
              label="Salary Range"
              value={formData.salary}
              onChange={(e) => handleChange('salary', e.target.value)}
              placeholder="e.g., €60,000 - €80,000"
              containerClassName="md:col-span-2"
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Job Description</h2>
            {useAI && (
              <Button variant="outline" size="sm" onClick={generateWithAI}>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate with AI
              </Button>
            )}
          </div>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-lg font-semibold mb-4">Requirements</h2>
            <textarea
              value={formData.requirements}
              onChange={(e) => handleChange('requirements', e.target.value)}
              placeholder="Enter each requirement on a new line..."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </Card>

          <Card>
            <h2 className="text-lg font-semibold mb-4">Benefits</h2>
            <textarea
              value={formData.benefits}
              onChange={(e) => handleChange('benefits', e.target.value)}
              placeholder="Enter each benefit on a new line..."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </Card>
        </div>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Required Skills</h2>
          <Input
            value={formData.skills}
            onChange={(e) => handleChange('skills', e.target.value)}
            placeholder="React, Node.js, Python, AWS (comma-separated)"
            hint="Enter skills separated by commas"
          />
        </Card>
      </form>
    </div>
  );
};

export default JobForm;
