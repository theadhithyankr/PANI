import React, { useState, useRef, useEffect } from 'react';
import { Edit, Save, X, Plus, Trash2, ChevronDown, Search } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { commonSkills, skillCategories, commonLanguages } from '../../data/commonData';

const ProfileSection = ({ title, children, onEdit, editable = true }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {editable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Only toggle edit mode here. Actual save happens inside each section's Save button with proper data.
              setIsEditing(!isEditing);
            }}
          >
            {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
          </Button>
        )}
      </div>
      {typeof children === 'function' ? children({ isEditing, setIsEditing }) : children}
    </Card>
  );
};

const PersonalInfoSection = ({ user, onUpdate, isEditing, setIsEditing }) => {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    current_location: user?.current_location || '',
    summary: user?.summary || '',
    headline: user?.headline || '',
  });

  // Keep form in sync when data loads or when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setFormData({
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        current_location: user?.current_location || '',
        summary: user?.summary || '',
        headline: user?.headline || '',
      });
    }
  }, [user, isEditing]);

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
          />
          <Input
            label="Professional Headline"
            value={formData.headline}
            onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
            placeholder="e.g. Senior Full Stack Developer"
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            disabled
            className="bg-gray-50"
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          />
          <Input
            label="Current Location"
            value={formData.current_location}
            onChange={(e) => setFormData(prev => ({ ...prev, current_location: e.target.value }))}
          />
       
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Professional Summary</label>
          <div className="relative">
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
              placeholder="Write a compelling professional summary that highlights your key skills, experience, and achievements. For example: 'Experienced Mobile Crane Operator with 10+ years of expertise in Aramco certified operations, onshore rig operations, oil fields & gas plants, and tandem lift operations.'"
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {formData.summary.length}/500
            </div>
          </div>
          <div className="mt-2 flex items-start space-x-2">
            <div className="flex-shrink-0 mt-0.5">
              <span className="text-blue-500">💡</span>
            </div>
            <div className="text-xs text-gray-500">
              <p className="font-medium mb-1">Writing Tips:</p>
              <ul className="space-y-1 text-gray-600">
                <li>• Start with your years of experience and role</li>
                <li>• Highlight key certifications and specializations</li>
                <li>• Mention specific industries or project types</li>
                <li>• Include technical skills and equipment expertise</li>
              </ul>
            </div>
          </div>
          
          {/* Summary Preview */}
          {formData.summary && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-700 text-sm leading-relaxed">{formData.summary}</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save Changes
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Name</label>
          <p className="text-gray-900">{user?.full_name || 'Not provided'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Professional Headline</label>
          <p className="text-gray-900">{user?.headline || 'Not provided'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Email</label>
          <div className="flex items-center gap-2">
            <p className="text-gray-900">{user?.email || 'Not provided'}</p>
            {user?.email_verified ? (
              <Badge variant="success" size="sm">Verified</Badge>
            ) : (
              <Badge variant="warning" size="sm">Not Verified</Badge>
            )}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Phone</label>
          <div className="flex items-center gap-2">
            <p className="text-gray-900">{user?.phone || 'Not provided'}</p>
            {user?.phone_verified ? (
              <Badge variant="success" size="sm">Verified</Badge>
            ) : (
              <Badge variant="warning" size="sm">Not Verified</Badge>
            )}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Current Location</label>
          <p className="text-gray-900">{user?.current_location || 'Not provided'}</p>
        </div>
       
      </div>
      {user?.summary && (
        <div>
          <label className="text-sm font-medium text-gray-500">Professional Summary</label>
          <p className="text-gray-900 mt-1">{user.summary}</p>
        </div>
      )}
    </div>
  );
};

const SkillsSection = ({ skills = [], onUpdate, isEditing, setIsEditing }) => {
  const [skillList, setSkillList] = useState(
    Array.isArray(skills) ? skills.map(skill => 
      typeof skill === 'string' ? { name: skill, level: 'Intermediate' } : skill
    ) : []
  );
  const [newSkill, setNewSkill] = useState({ name: '', level: 'Beginner' });
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  // Filter skills based on search term
  const filteredSkills = commonSkills.filter(skill =>
    skill.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !skillList.some(existingSkill => existingSkill.name === skill)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addSkill = () => {
    if (newSkill.name.trim()) {
      setSkillList(prev => [...prev, newSkill]);
      setNewSkill({ name: '', level: 'Beginner' });
      setShowDropdown(false);
      setSearchTerm('');
    }
  };

  const addSkillFromDropdown = (skillName) => {
    setSkillList(prev => [...prev, { name: skillName, level: newSkill.level }]);
    setShowDropdown(false);
    setSearchTerm('');
  };

  const removeSkill = (index) => {
    setSkillList(prev => prev.filter((_, i) => i !== index));
  };

  const updateSkillLevel = (index, level) => {
    setSkillList(prev => prev.map((skill, i) => 
      i === index ? { ...skill, level } : skill
    ));
  };

  const handleSave = () => {
    onUpdate(skillList.map(skill => skill.name)); // Only send skill names to match the store format
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && newSkill.name.trim()) {
      addSkill();
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          {skillList.map((skill, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="flex-1 font-medium">{skill.name}</span>
              <select
                value={skill.level}
                onChange={(e) => updateSkillLevel(index, e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                {skillLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              <Button variant="ghost" size="sm" onClick={() => removeSkill(index)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative" ref={dropdownRef}>
              <div className="relative">
                <Input
                  placeholder="Search and add skills from dropdown..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              
              {showDropdown && filteredSkills.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {Object.entries(skillCategories).map(([category, skills]) => {
                    const categorySkills = skills.filter(skill =>
                      skill.toLowerCase().includes(searchTerm.toLowerCase()) &&
                      !skillList.some(existingSkill => existingSkill.name === skill)
                    );
                    
                    if (categorySkills.length === 0) return null;
                    
                    return (
                      <div key={category}>
                        <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          {category}
                        </div>
                        {categorySkills.map((skill) => (
                          <button
                            key={skill}
                            onClick={() => addSkillFromDropdown(skill)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <select
              value={newSkill.level}
              onChange={(e) => setNewSkill(prev => ({ ...prev, level: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              {skillLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Or type a custom skill..."
              value={newSkill.name}
              onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <select
              value={newSkill.level}
              onChange={(e) => setNewSkill(prev => ({ ...prev, level: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              {skillLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addSkill}
              disabled={!newSkill.name.trim()}
              title="Add custom skill"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save Changes
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {skillList.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skillList.map((skill, index) => (
            <Badge
              key={index}
              variant={
                skill.level === 'Expert' ? 'success' :
                skill.level === 'Advanced' ? 'primary' :
                skill.level === 'Intermediate' ? 'secondary' : 'default'
              }
            >
              {skill.name}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No skills added yet</p>
      )}
    </div>
  );
};

const LanguageSection = ({ languages = [], onUpdate, isEditing, setIsEditing }) => {
  const [languageList, setLanguageList] = useState(languages || []);
  const [newLanguage, setNewLanguage] = useState({ language: '', proficiency: 'Intermediate' });
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const proficiencyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Fluent', 'Native'];

  // Filter languages based on search term
  const filteredLanguages = commonLanguages.filter(lang =>
    lang.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !languageList.some(existingLang => existingLang.language === lang)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addLanguage = () => {
    if (newLanguage.language.trim()) {
      setLanguageList(prev => [...prev, newLanguage]);
      setNewLanguage({ language: '', proficiency: 'Intermediate' });
      setShowDropdown(false);
      setSearchTerm('');
    }
  };

  const addLanguageFromDropdown = (languageName) => {
    setLanguageList(prev => [...prev, { language: languageName, proficiency: newLanguage.proficiency }]);
    setShowDropdown(false);
    setSearchTerm('');
  };

  const removeLanguage = (index) => {
    setLanguageList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onUpdate(languageList);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          {languageList.map((lang, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="flex-1 font-medium">{lang.language}</span>
              <Badge variant="secondary">{lang.proficiency}</Badge>
              <Button variant="ghost" size="sm" onClick={() => removeLanguage(index)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative" ref={dropdownRef}>
              <div className="relative">
                <Input
                  placeholder="Search and add languages from dropdown..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              
              {showDropdown && filteredLanguages.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredLanguages.map((language) => (
                    <button
                      key={language}
                      onClick={() => addLanguageFromDropdown(language)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    >
                      {language}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <select
              value={newLanguage.proficiency}
              onChange={(e) => setNewLanguage(prev => ({ ...prev, proficiency: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              {proficiencyLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Or type a custom language..."
              value={newLanguage.language}
              onChange={(e) => setNewLanguage(prev => ({ ...prev, language: e.target.value }))}
              className="flex-1"
            />
            <select
              value={newLanguage.proficiency}
              onChange={(e) => setNewLanguage(prev => ({ ...prev, proficiency: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              {proficiencyLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addLanguage}
              disabled={!newLanguage.language.trim()}
              title="Add custom language"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save Changes
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {languageList.length > 0 ? (
        <div className="grid gap-2">
          {languageList.map((lang, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">{lang.language}</span>
              <Badge
                variant={
                  lang.proficiency === 'Native' ? 'success' :
                  lang.proficiency === 'Fluent' ? 'primary' :
                  lang.proficiency === 'Advanced' ? 'secondary' : 'default'
                }
              >
                {lang.proficiency}
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No languages added yet</p>
      )}
    </div>
  );
};

const PreferencesSection = ({ preferences, onUpdate, isEditing, setIsEditing }) => {
  const [formData, setFormData] = useState({
    preferred_locations: preferences?.preferred_locations || [],
    willing_to_relocate: preferences?.willing_to_relocate || false,
    preferred_job_types: preferences?.preferred_job_types || [],
    visa_status: preferences?.visa_status || '',
    cultural_preferences: preferences?.cultural_preferences || {
      company_size: '',
      company_culture: '',
      work_environment: ''
    },
    relocation_timeline: preferences?.relocation_timeline || 'immediate'
  });

  const companySizes = ['Startup', 'Small', 'Medium', 'Large', 'Enterprise'];
  const companyCultures = ['Innovative', 'Traditional', 'Casual', 'Formal'];
  const workEnvironments = ['Remote', 'Hybrid', 'Office', 'Flexible'];
  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Remote'];
  const formatJobType = (type) =>
    (type || '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('-');
  const visaStatusOptions = [
    { value: 'citizen', label: 'EU Citizen' },
    { value: 'permit', label: 'Work Permit Holder' },
    { value: 'student', label: 'Student Visa' },
    { value: 'none', label: 'No Work Authorization' },
    { value: 'applying', label: 'Visa Application in Progress' }
  ];
  const relocationTimelines = ['Immediate', '1-3 months', '3-6 months', '6+ months'];

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Locations</label>
            <Input
              placeholder="Add locations (comma separated)"
              value={formData.preferred_locations.join(', ')}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                preferred_locations: e.target.value.split(',').map(loc => loc.trim()).filter(Boolean)
              }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Types</label>
            <select
              multiple
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={formData.preferred_job_types}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                preferred_job_types: Array.from(e.target.selectedOptions, option => option.value)
              }))}
            >
              {jobTypes.map(type => (
                <option key={type} value={type.toLowerCase()}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visa Status</label>
            <select
              value={formData.visa_status}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                visa_status: e.target.value
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select visa status</option>
              {visaStatusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
            <select
              value={formData.cultural_preferences.company_size}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                cultural_preferences: { ...prev.cultural_preferences, company_size: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select company size</option>
              {companySizes.map(size => (
                <option key={size} value={size.toLowerCase()}>{size}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Culture</label>
            <select
              value={formData.cultural_preferences.company_culture}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                cultural_preferences: { ...prev.cultural_preferences, company_culture: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select company culture</option>
              {companyCultures.map(culture => (
                <option key={culture} value={culture.toLowerCase()}>{culture}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Environment</label>
            <select
              value={formData.cultural_preferences.work_environment}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                cultural_preferences: { ...prev.cultural_preferences, work_environment: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select work environment</option>
              {workEnvironments.map(env => (
                <option key={env} value={env.toLowerCase()}>{env}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Relocation Timeline</label>
            <select
              value={formData.relocation_timeline}
              onChange={(e) => setFormData(prev => ({ ...prev, relocation_timeline: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {relocationTimelines.map(timeline => (
                <option key={timeline} value={timeline.toLowerCase()}>{timeline}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.willing_to_relocate}
            onChange={(e) => setFormData(prev => ({ ...prev, willing_to_relocate: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label className="text-sm text-gray-700">Willing to relocate</label>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save Changes
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Preferred Locations</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {preferences?.preferred_locations?.map((location, index) => (
              <Badge key={index}>{location}</Badge>
            )) || <p className="text-gray-700">Not specified</p>}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Job Types</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {preferences?.preferred_job_types?.map((type, index) => (
              <Badge key={index} variant="secondary">{formatJobType(type)}</Badge>
            )) || <p className="text-gray-700">Not specified</p>}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Visa Status</label>
          <p className="text-gray-900">
            {preferences?.visa_status 
              ? visaStatusOptions.find(option => option.value === preferences.visa_status)?.label || preferences.visa_status
              : 'Not specified'}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Company Preferences</label>
          <div className="space-y-1 mt-1">
            <p className="text-gray-700">Size: {preferences?.cultural_preferences?.company_size || 'Not specified'}</p>
            <p className="text-gray-700">Culture: {preferences?.cultural_preferences?.company_culture || 'Not specified'}</p>
            <p className="text-gray-700">Environment: {preferences?.cultural_preferences?.work_environment || 'Not specified'}</p>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Relocation</label>
          <div className="space-y-1 mt-1">
            <p className="text-gray-700">
              {preferences?.willing_to_relocate ? 'Open to relocation' : 'Not open to relocation'}
            </p>
            <p className="text-gray-700">
              Timeline: {preferences?.relocation_timeline || 'Not specified'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExperienceLevelSection = ({ experienceYears, onUpdate, isEditing, setIsEditing }) => {
  const [years, setYears] = useState(experienceYears || 0);

  const experienceOptions = [
    { value: 0, label: '0 years' },
    { value: 1, label: '1 year' },
    { value: 2, label: '2 years' },
    { value: 3, label: '3 years' },
    { value: 4, label: '4 years' },
    { value: 5, label: '5 years' },
    { value: 6, label: '6 years' },
    { value: 7, label: '7 years' },
    { value: 8, label: '8 years' },
    { value: 9, label: '9 years' },
    { value: 10, label: '10 years' },
    { value: 11, label: '11 years' },
    { value: 12, label: '12 years' },
    { value: 13, label: '13 years' },
    { value: 14, label: '14 years' },
    { value: 15, label: '15 years' },
    { value: 16, label: '16 years' },
    { value: 17, label: '17 years' },
    { value: 18, label: '18 years' },
    { value: 19, label: '19 years' },
    { value: 20, label: '20+ years' },
  ];

  const handleSave = () => {
    onUpdate(years);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
          <select
            value={years}
            onChange={(e) => setYears(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {experienceOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save Changes
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <span className="font-medium">Years of Experience</span>
        <Badge variant="primary">{years} year{years !== 1 ? 's' : ''}</Badge>
      </div>
    </div>
  );
};

export { ProfileSection, PersonalInfoSection, SkillsSection, LanguageSection, PreferencesSection, ExperienceLevelSection };
