# Employer Onboarding Store Documentation

## Overview

The Employer Onboarding Store is a Zustand-based state management solution that handles all data and logic for the employer onboarding flow. This allows you to redesign the UI completely while maintaining all the existing functionality.

## Store Location

```javascript
import { useEmployerOnboardingStore } from '../store/employerOnboardingStore';
```

## Data Structure

### Form Data
The store manages all onboarding form data in a single `formData` object:

```javascript
const formData = {
  // Step 1: Company Information
  companyName: '',        // Maps to companies.name
  industry: '',           // Maps to companies.industry
  companySize: '',        // Maps to companies.size
  location: '',           // Maps to companies.headquarters_location
  website: '',            // Maps to companies.website
  description: '',        // Maps to companies.description
  foundedYear: '',        // Maps to companies.founded_year
  averageSalary: '',      // Maps to companies.average_salary

  // Step 2: Culture DNA (captured but not saved to DB currently)
  workLifeBalance: '',
  innovation: '',
  collaboration: '',
  flexibility: '',
  growth: '',
  diversity: '',

  // Step 3: Compliance (captured but not saved to DB currently)
  dataProtection: false,
  equalOpportunity: false,
  workPermits: false,
  salaryTransparency: false,
  healthSafety: false,

  // Step 4: Employer Profile
  position: '',           // Maps to employer_profiles.position
  department: '',         // Maps to employer_profiles.department
  managementStyle: '',    // Maps to employer_profiles.management_style
  hiringPreferences: '',  // Maps to employer_profiles.hiring_preferences
};
```

### Steps Configuration
```javascript
const steps = [
  { id: 1, title: 'Company Info', completed: false },
  { id: 2, title: 'Culture DNA', completed: false },
  { id: 3, title: 'Compliance', completed: false },
  { id: 4, title: 'Your Profile', completed: false },
  { id: 5, title: 'Review', completed: false },
];
```

### Options for Dropdowns
All dropdown options are available in `store.options`:
- `industryOptions`
- `companySizeOptions`
- `cultureOptions`
- `complianceOptions`

## Store Properties

### State
- `formData` - The form data object
- `currentStep` - Current step number (1-5)
- `steps` - Array of step definitions
- `validationErrors` - Array of current validation errors
- `loading` - Boolean indicating if onboarding is in progress
- `error` - String with any API error message
- `options` - Object containing all dropdown options

### Actions

#### Form Data Management
```javascript
// Update a single field
updateField(field, value)

// Update multiple fields at once
updateMultipleFields(updates)

// Example:
updateField('companyName', 'Acme Corp');
updateMultipleFields({ 
  companyName: 'Acme Corp', 
  industry: 'technology' 
});
```

#### Step Navigation
```javascript
// Set specific step
setCurrentStep(step)

// Move to next step (with validation)
nextStep() // Returns boolean - true if successful

// Move to previous step
previousStep()

// Example:
const success = nextStep();
if (!success) {
  console.log('Validation failed:', validationErrors);
}
```

#### Validation
```javascript
// Validate current step only
validateCurrentStep() // Returns array of error messages

// Validate all required fields
validateAllFields() // Returns array of error messages

// Check if specific step is valid
isStepValid(stepNumber) // Returns boolean

// Clear validation errors
clearValidationErrors()
```

#### Error Management
```javascript
// Clear API errors
clearError()
```

#### Data Management
```javascript
// Reset form to initial state
reset()

// Load existing data (useful for editing)
loadData(existingData)

// Get formatted data for display
getFormattedData() // Returns structured object with labels

// Get completion percentage
getCompletionPercentage() // Returns number 0-100
```

#### Onboarding Completion
```javascript
// Complete the onboarding process
completeOnboarding(user, globalStoreActions)

// Example:
const { setCompany, setEmployerProfile } = useGlobalStore();
await completeOnboarding(user, { setCompany, setEmployerProfile });
```

## Usage Examples

### Basic Setup
```javascript
import { useEmployerOnboardingStore } from '../store/employerOnboardingStore';
import { useAuth } from '../hooks/common';
import { useGlobalStore } from '../stores/globalStore';

const MyOnboardingComponent = () => {
  const { user } = useAuth();
  const { setCompany, setEmployerProfile } = useGlobalStore();
  
  const {
    formData,
    currentStep,
    validationErrors,
    loading,
    error,
    options,
    updateField,
    nextStep,
    previousStep,
    completeOnboarding,
  } = useEmployerOnboardingStore();

  // Your component logic here
};
```

### Field Updates
```javascript
// Text input
<input
  value={formData.companyName}
  onChange={(e) => updateField('companyName', e.target.value)}
/>

// Select dropdown
<select
  value={formData.industry}
  onChange={(e) => updateField('industry', e.target.value)}
>
  {options.industryOptions.map(option => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))}
</select>

// Checkbox
<input
  type="checkbox"
  checked={formData.dataProtection}
  onChange={(e) => updateField('dataProtection', e.target.checked)}
/>
```

### Step Navigation
```javascript
const handleNext = () => {
  const success = nextStep();
  if (!success) {
    // Handle validation errors
    console.log('Validation errors:', validationErrors);
  }
};

const handleBack = () => {
  previousStep();
};
```

### Form Completion
```javascript
const handleComplete = async () => {
  try {
    await completeOnboarding(user, { setCompany, setEmployerProfile });
    updateUser({ onboarding_complete: true });
    navigate('/dashboard');
  } catch (err) {
    console.error('Onboarding failed:', err);
    // Error is automatically stored in store.error
  }
};
```

### Conditional Rendering by Step
```javascript
{currentStep === 1 && (
  <CompanyInfoStep 
    formData={formData}
    updateField={updateField}
    options={options}
  />
)}

{currentStep === 2 && (
  <CultureDNAStep 
    formData={formData}
    updateField={updateField}
    options={options}
  />
)}
```

### Progress Display
```javascript
const completionPercentage = getCompletionPercentage();

<div className="progress-bar">
  <div 
    style={{ width: `${(currentStep / 5) * 100}%` }}
    className="progress-fill"
  />
</div>
<p>{completionPercentage}% complete</p>
```

### Error Display
```javascript
{validationErrors.length > 0 && (
  <div className="error-list">
    {validationErrors.map((error, index) => (
      <p key={index} className="error-message">{error}</p>
    ))}
  </div>
)}

{error && (
  <div className="api-error">
    <p>{error}</p>
  </div>
)}
```

## Database Mapping

When `completeOnboarding()` is called, the form data is mapped to database tables:

### Companies Table
- `companyName` → `name`
- `industry` → `industry`
- `companySize` → `size`
- `location` → `headquarters_location`
- `website` → `website`
- `description` → `description`
- `foundedYear` → `founded_year` (parsed as integer)
- `averageSalary` → `average_salary` (parsed as float)
- `user.id` → `created_by`

### Employer Profiles Table
- `company.id` → `company_id`
- `position` → `position`
- `department` → `department`
- `true` → `is_admin` (first user is admin)
- `managementStyle` → `management_style` (as JSON object)
- `hiringPreferences` → `hiring_preferences` (as JSON object)
- Generated summary → `ai_generated_summary`

### Profiles Table
- `true` → `onboarding_complete`

## Validation Rules

### Step 1 (Company Info) - Required
- Company name (non-empty string)
- Industry (selected value)
- Company size (selected value)
- Location (non-empty string)

### Step 2 (Culture DNA) - Optional
No validation required

### Step 3 (Compliance) - Optional
No validation required

### Step 4 (Employer Profile) - Required
- Position (non-empty string)
- Department (non-empty string)

### Optional Validations
- Website must be valid URL format if provided
- Founded year must be between 1800 and current year if provided
- Average salary must be positive number if provided

## Testing Utilities

The store includes several utilities for testing and development:

```javascript
// Reset everything
reset()

// Load test data
loadData({ companyName: 'Test Company', industry: 'technology' })

// Check step validity
isStepValid(1) // Returns true/false

// Get completion status
getCompletionPercentage() // Returns 0-100

// Clear errors
clearError()
clearValidationErrors()
```

## Migration from Current Component

To migrate from the current EmployerOnboarding component:

1. Replace `useState` for form data with `useEmployerOnboardingStore`
2. Replace manual validation with store validation methods
3. Replace manual step management with store step methods
4. Replace the `useEmployerOnboarding` hook with store's `completeOnboarding`
5. Use store's `options` instead of local option arrays
6. Use store's error states instead of local error states

The functionality will remain exactly the same, but the state management will be centralized and more flexible for UI redesign. 