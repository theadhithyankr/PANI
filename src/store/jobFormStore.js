import { create } from 'zustand';

const initialState = {
  title: '',
  description: '',
  requirements: '',
  responsibilities: '',
  location: '',
  featureImageUrl: '',
  isRemote: false,
  isHybrid: false,
  jobType: '',
  experienceLevel: '',
  salaryMin: '',
  salaryMax: '',
  salaryCurrency: 'USD',
  skillsRequired: [],
  benefits: [],
  applicationDeadline: '',
  startDate: '',
  supportTierId: '',
  driversLicense: '',
  additionalQuestions: [],
  preferredLanguage: '',
  priority: '',
};

const useJobFormStore = create((set) => ({
  ...initialState,
  setField: (field, value) => set((state) => ({ ...state, [field]: value })),
  resetForm: () => set(initialState),
  setAllFields: (fields) => set((state) => ({ ...state, ...fields })),
}));

export default useJobFormStore; 