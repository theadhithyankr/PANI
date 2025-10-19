// Dummy data for Velai v3 platform

export const currentUser = {
  id: '1',
  type: 'candidate', // or 'employer'
  isOnboarded: false,
  email: 'test@example.com',
  name: 'Rahul Sharma',
  avatar: null,
  position: 'Full Stack Developer',
  location: 'Bangalore, India',
  experience: '5 years',
  skills: ['React', 'Node.js', 'Python', 'AWS', 'MongoDB'],
  education: 'B.Tech Computer Science',
  languages: ['English', 'Hindi', 'German (A2)'],
  expectedSalary: '€60,000 - €80,000',
  relocatable: true,
};

export const employers = [
  {
    id: '1',
    name: 'TechCorp Solutions',
    industry: 'Software Development',
    size: '50-100',
    location: 'Berlin, Germany',
    logo: null,
    description: 'Leading software development company specializing in AI and machine learning solutions.',
    culture: {
      workLifeBalance: 9,
      innovation: 8,
      collaboration: 9,
      flexibility: 7,
    },
    isOnboarded: true,
  },
  {
    id: '2',
    name: 'Green Energy Solutions',
    industry: 'Renewable Energy',
    size: '100-500',
    location: 'Munich, Germany',
    logo: null,
    description: 'Pioneering sustainable energy solutions for the future.',
    culture: {
      workLifeBalance: 8,
      innovation: 9,
      collaboration: 8,
      flexibility: 8,
    },
    isOnboarded: true,
  },
];

export const candidates = [
  {
    id: '1',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@email.com',
    phone: '+91 98765 43210',
    location: 'Bangalore, India',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
    experience: '5 years',
    skills: ['React', 'Node.js', 'Python', 'AWS', 'MongoDB'],
    position: 'Full Stack Developer',
    expectedSalary: '€60,000 - €80,000',
    relocatable: true,
    matchScore: 92,
    status: 'available',
    education: 'B.Tech Computer Science',
    languages: ['English', 'Hindi', 'German (A2)'],
    isOnboarded: true,
  },
  {
    id: '2',
    name: 'Priya Patel',
    email: 'priya.patel@email.com',
    phone: '+91 87654 32109',
    location: 'Mumbai, India',
    avatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=400',
    experience: '3 years',
    skills: ['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'React', 'CSS'],
    position: 'Product Designer',
    expectedSalary: '€45,000 - €65,000',
    relocatable: true,
    matchScore: 88,
    status: 'interviewing',
    education: 'M.Des Product Design',
    languages: ['English', 'Hindi', 'Gujarati'],
    isOnboarded: true,
  },
  {
    id: '3',
    name: 'Arjun Kumar',
    email: 'arjun.kumar@email.com',
    phone: '+91 76543 21098',
    location: 'Hyderabad, India',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
    experience: '7 years',
    skills: ['Java', 'Spring Boot', 'Microservices', 'Docker', 'Kubernetes'],
    position: 'Backend Developer',
    expectedSalary: '€70,000 - €90,000',
    relocatable: true,
    matchScore: 85,
    status: 'available',
    education: 'M.Tech Software Engineering',
    languages: ['English', 'Telugu', 'Hindi'],
    isOnboarded: true,
  },
];

export const jobs = [
  {
    id: '1',
    title: 'Senior Full Stack Developer',
    company: 'TechCorp Solutions',
    companyId: '1',
    location: 'Berlin, Germany',
    type: 'Full-time',
    remote: 'Hybrid',
    salary: '€65,000 - €85,000',
    description: 'We are looking for an experienced Full Stack Developer to join our dynamic team. You will be responsible for developing and maintaining web applications using modern technologies.',
    requirements: [
      '5+ years of experience in web development',
      'Proficiency in React, Node.js, and Python',
      'Experience with cloud platforms (AWS/Azure)',
      'Strong problem-solving skills',
    ],
    benefits: [
      'Competitive salary',
      'Health insurance',
      'Flexible working hours',
      'Professional development opportunities',
    ],
    skills: ['React', 'Node.js', 'Python', 'AWS'],
    status: 'active',
    postedDate: '2024-01-15',
    applicationsCount: 24,
    viewsCount: 156,
    matches: 18,
    newApplicants: 3,
  },
  {
    id: '2',
    title: 'Product Designer',
    company: 'Green Energy Solutions',
    companyId: '2',
    location: 'Munich, Germany',
    type: 'Full-time',
    remote: 'On-site',
    salary: '€50,000 - €70,000',
    description: 'Join our design team to create intuitive and beautiful user experiences for our renewable energy platform.',
    requirements: [
      '3+ years of UI/UX design experience',
      'Proficiency in Figma and Adobe Creative Suite',
      'Strong portfolio demonstrating design skills',
      'Experience with user research and testing',
    ],
    benefits: [
      'Creative freedom',
      'Modern design tools',
      'Team collaboration',
      'Impact on sustainability',
    ],
    skills: ['UI/UX Design', 'Figma', 'User Research', 'Prototyping'],
    status: 'active',
    postedDate: '2024-01-10',
    applicationsCount: 18,
    viewsCount: 89,
    matches: 12,
    newApplicants: 5,
  },
];

export const applications = [
  {
    id: '1',
    jobId: '1',
    candidateId: '1',
    status: 'interviewing',
    appliedDate: '2024-01-16',
    notes: 'Strong technical background, good communication skills',
    documents: ['resume.pdf', 'cover_letter.pdf'],
  },
  {
    id: '2',
    jobId: '2',
    candidateId: '2',
    status: 'interviewing',
    appliedDate: '2024-01-12',
    notes: 'Excellent design portfolio, creative approach',
    documents: ['resume.pdf', 'portfolio.pdf'],
  },
  {
    id: '3',
    jobId: '2',
    candidateId: '1',
    status: 'applied',
    appliedDate: '2024-01-18',
    notes: 'Impressive portfolio, strong React skills',
    documents: ['resume.pdf', 'cover_letter.pdf', 'portfolio.pdf'],
  },
  {
    id: '4',
    jobId: '1',
    candidateId: '1',
    status: 'reviewing',
    appliedDate: '2024-01-14',
    notes: 'Under review by hiring manager',
    documents: ['resume.pdf'],
  },
  {
    id: '5',
    jobId: '2',
    candidateId: '1',
    status: 'offered',
    appliedDate: '2024-01-10',
    notes: 'Excellent interview performance, job offer extended',
    documents: ['resume.pdf', 'cover_letter.pdf'],
  },
  {
    id: '6',
    jobId: '1',
    candidateId: '1',
    status: 'rejected',
    appliedDate: '2024-01-08',
    notes: 'Thank you for your interest. We decided to move forward with another candidate.',
    documents: ['resume.pdf'],
  },
];

export const interviews = [
  {
    id: '1',
    applicationId: '2',
    candidateId: '2',
    candidateName: 'Priya Patel',
    jobId: '2',
    jobTitle: 'Product Designer',
    scheduledDate: '2024-01-25',
    scheduledTime: '14:00',
    duration: 60,
    type: 'video',
    status: 'scheduled',
    interviewers: ['Sarah Johnson', 'Mike Chen'],
    meetingLink: 'https://meet.google.com/abc-def-ghi',
    notes: 'Technical interview focusing on design process and portfolio review',
  },
  {
    id: '2',
    applicationId: '1',
    candidateId: '1',
    candidateName: 'Rahul Sharma',
    jobId: '1',
    jobTitle: 'Senior Full Stack Developer',
    scheduledDate: '2024-01-26',
    scheduledTime: '10:00',
    duration: 90,
    type: 'video',
    status: 'scheduled',
    interviewers: ['John Smith', 'Emily Davis'],
    meetingLink: 'https://meet.google.com/def-ghi-jkl',
    notes: 'Technical interview covering React, Node.js, and system design',
    position: 'Senior Full Stack Developer',
    companyName: 'TechCorp Solutions',
    round: 'Technical Interview - Round 1',
  },
  {
    id: '3',
    applicationId: '3',
    candidateId: '3',
    candidateName: 'Arjun Kumar',
    jobId: '1',
    jobTitle: 'Senior Full Stack Developer',
    scheduledDate: '2024-01-27',
    scheduledTime: '15:30',
    duration: 60,
    type: 'onsite',
    status: 'scheduled',
    interviewers: ['Alex Kumar', 'Sarah Johnson'],
    location: 'Berlin Office, Conference Room A',
    notes: 'System design and architecture discussion',
  },
  {
    id: '4',
    applicationId: '3',
    candidateId: '1',
    candidateName: 'Rahul Sharma',
    jobId: '2',
    jobTitle: 'Product Designer',
    scheduledDate: '2024-01-28',
    scheduledTime: '15:00',
    duration: 60,
    type: 'video',
    status: 'scheduled',
    interviewers: ['Sarah Johnson', 'Mike Chen'],
    meetingLink: 'https://meet.google.com/xyz-abc-def',
    notes: 'Design portfolio review and cultural fit interview',
    position: 'Product Designer',
    companyName: 'Green Energy Solutions',
    round: 'Portfolio Review - Round 1',
  },
];

export const notifications = [
  {
    id: '1',
    type: 'application',
    title: 'New Application Received',
    message: 'Rahul Sharma applied for Senior Full Stack Developer position',
    timestamp: '2024-01-16T10:30:00Z',
    read: false,
    actionUrl: '/candidates/1',
  },
  {
    id: '2',
    type: 'interview',
    title: 'Interview Scheduled',
    message: 'Interview scheduled with Priya Patel for tomorrow at 2:00 PM',
    timestamp: '2024-01-24T15:45:00Z',
    read: false,
    actionUrl: '/interviews/1',
  },
  {
    id: '3',
    type: 'offer',
    title: 'Job Offer Received',
    message: 'You have received an offer for Senior Full Stack Developer at TechCorp Solutions',
    timestamp: '2024-01-20T14:30:00Z',
    read: false,
    actionUrl: '/offers/1',
  },
  {
    id: '4',
    type: 'interview_reminder',
    title: 'Interview Tomorrow',
    message: 'Reminder: Interview with Green Energy Solutions tomorrow at 2:00 PM',
    timestamp: '2024-01-24T09:00:00Z',
    read: true,
    actionUrl: '/interviews/2',
  },
];

// Chat conversations for AI assistant
export const chatConversations = [
  {
    id: '1',
    userId: '1',
    messages: [
      {
        id: 1,
        type: 'ai',
        content: 'Hello! How can I help you with your recruitment needs today?',
        timestamp: new Date(),
      }
    ],
    lastActivity: new Date(),
  }
];

// Document templates and library
export const documentTemplates = [
  {
    id: '1',
    name: 'Employment Contract - Germany',
    type: 'contract',
    category: 'legal',
    description: 'Standard employment contract template for German positions',
    fields: ['employee_name', 'position', 'salary', 'start_date'],
  },
  {
    id: '2',
    name: 'Offer Letter Template',
    type: 'offer',
    category: 'hr',
    description: 'Professional offer letter template',
    fields: ['candidate_name', 'position', 'compensation', 'benefits'],
  },
  {
    id: '3',
    name: 'NDA Agreement',
    type: 'nda',
    category: 'legal',
    description: 'Non-disclosure agreement for employees',
    fields: ['employee_name', 'company_name', 'effective_date'],
  },
];

// Visa applications tracking
export const visaApplications = [
  {
    id: '1',
    candidateId: '1',
    candidateName: 'Rahul Sharma',
    visaType: 'EU Blue Card',
    status: 'document_collection',
    progress: 35,
    submissionDate: '2024-01-10',
    expectedDecision: '2024-03-15',
    currentStep: 'Document Collection',
    nextDeadline: '2024-02-01',
    applicationDate: '2024-01-10',
    assignedConsultant: {
      name: 'Sarah Mueller',
      email: 'sarah.mueller@velai.com',
      phone: '+49 30 1234 5678'
    },
    documents: [
      { 
        name: 'Passport', 
        status: 'submitted', 
        required: true,
        expiryDate: '2029-05-15',
        verified: true
      },
      { 
        name: 'University Degree', 
        status: 'submitted', 
        required: true,
        verified: true
      },
      { 
        name: 'Employment Contract', 
        status: 'pending', 
        required: true,
        verified: false
      },
      { 
        name: 'Health Insurance', 
        status: 'not_started', 
        required: true,
        verified: false
      },
      { 
        name: 'Proof of Accommodation', 
        status: 'not_started', 
        required: true,
        verified: false
      },
      { 
        name: 'Bank Statements', 
        status: 'submitted', 
        required: false,
        verified: true
      }
    ],
    timeline: [
      { 
        step: 'Application Started', 
        date: '2024-01-10', 
        status: 'completed',
        description: 'Initial application submitted online'
      },
      { 
        step: 'Document Collection', 
        date: '2024-01-15', 
        status: 'in_progress',
        description: 'Collecting and verifying required documents'
      },
      { 
        step: 'Embassy Appointment', 
        date: '2024-02-05', 
        status: 'scheduled',
        description: 'Biometrics appointment at German consulate'
      },
      { 
        step: 'Processing', 
        date: '2024-02-10', 
        status: 'pending',
        description: 'Application under review by immigration authorities'
      },
      { 
        step: 'Decision', 
        date: '2024-03-15', 
        status: 'pending',
        description: 'Final decision on visa application'
      }
    ],
    relocationSupport: {
      housingAssistance: {
        status: 'in_progress',
        consultant: 'Maria Weber',
        viewingsScheduled: 3,
        shortlistedProperties: 2
      },
      bankAccount: {
        status: 'pending',
        recommendedBanks: ['Deutsche Bank', 'Commerzbank', 'N26'],
        documentsRequired: [
          'Passport',
          'Residence permit',
          'Employment contract',
          'Proof of address (Anmeldung)'
        ]
      },
      cityRegistration: {
        status: 'pending',
        appointmentRequired: true,
        estimatedWaitTime: '2-3 weeks'
      }
    }
  },
];

// Utility functions for dummy data
export const getJobById = (id) => jobs.find(job => job.id === id);
export const getCandidateById = (id) => candidates.find(candidate => candidate.id === id);
export const getEmployerById = (id) => employers.find(employer => employer.id === id);
export const getApplicationById = (id) => applications.find(application => application.id === id);

export const getJobsForEmployer = (employerId) => jobs.filter(job => job.companyId === employerId);
export const getApplicationsForJob = (jobId) => applications.filter(app => app.jobId === jobId);
export const getCandidatesForJob = (jobId) => {
  const jobApplications = getApplicationsForJob(jobId);
  return jobApplications.map(app => getCandidateById(app.candidateId)).filter(Boolean);
}

// Job offers data
export const offers = [
  {
    id: '1',
    candidateId: '1',
    jobId: '1',
    position: 'Senior Full Stack Developer',
    companyName: 'TechCorp Solutions',
    offerDate: '2024-01-20',
    expiryDate: '2024-02-05',
    status: 'pending',
    compensation: {
      baseSalary: 75000,
      bonus: 8000,
      equity: '0.5%',
      benefits: ['Health Insurance', 'Dental', 'Pension', 'Gym Membership']
    },
    workArrangement: {
      type: 'Hybrid',
      location: 'Berlin, Germany',
      remotedays: 2
    },
    relocationPackage: {
      included: true,
      amount: 5000,
      temporaryAccommodation: '30 days',
      flightTickets: true
    },
    visaSupport: {
      included: true,
      type: 'EU Blue Card',
      processing: 'Full support provided'
    },
    startDate: '2024-03-01',
    contractType: 'Permanent',
    probationPeriod: '6 months',
    nextSteps: [
      'Review offer terms and conditions',
      'Schedule discussion with hiring manager if needed',
      'Submit signed documents by expiry date',
      'Begin visa application process',
      'Coordinate start date and relocation'
    ],
    documents: [
      { name: 'Employment Contract', type: 'contract', status: 'pending' },
      { name: 'Offer Letter', type: 'offer', status: 'pending' },
      { name: 'Benefits Package', type: 'benefits', status: 'pending' }
    ]
  },
  {
    id: '2',
    candidateId: '1',
    jobId: '2',
    position: 'Product Designer',
    companyName: 'Green Energy Solutions',
    offerDate: '2024-01-15',
    expiryDate: '2024-01-30',
    status: 'negotiating',
    compensation: {
      baseSalary: 65000,
      bonus: 5000,
      equity: '0.2%',
      benefits: ['Health Insurance', 'Dental', 'Creative Budget']
    },
    workArrangement: {
      type: 'On-site',
      location: 'Munich, Germany',
      remotedays: 0
    },
    relocationPackage: {
      included: true,
      amount: 4000,
      temporaryAccommodation: '21 days',
      flightTickets: true
    },
    visaSupport: {
      included: true,
      type: 'EU Blue Card',
      processing: 'Full support provided'
    },
    startDate: '2024-02-15',
    contractType: 'Permanent',
    probationPeriod: '3 months',
    nextSteps: [
      'Continue salary negotiation discussions',
      'Review updated offer terms',
      'Finalize relocation package details',
      'Sign employment contract',
      'Begin visa application process'
    ],
    documents: [
      { name: 'Initial Offer Letter', type: 'offer', status: 'signed' },
      { name: 'Updated Contract', type: 'contract', status: 'pending' },
      { name: 'Relocation Package', type: 'relocation', status: 'pending' }
    ]
  },
  {
    id: '3',
    candidateId: '1',
    jobId: '1',
    position: 'Backend Developer',
    companyName: 'TechCorp Solutions',
    offerDate: '2024-01-05',
    expiryDate: '2024-01-20',
    status: 'accepted',
    compensation: {
      baseSalary: 70000,
      bonus: 7000,
      equity: '0.3%',
      benefits: ['Health Insurance', 'Pension', 'Learning Budget']
    },
    workArrangement: {
      type: 'Remote',
      location: 'Berlin, Germany',
      remotedays: 5
    },
    relocationPackage: {
      included: false,
      amount: 0,
      temporaryAccommodation: null,
      flightTickets: false
    },
    visaSupport: {
      included: true,
      type: 'EU Blue Card',
      processing: 'Full support provided'
    },
    startDate: '2024-02-01',
    contractType: 'Permanent',
    probationPeriod: '6 months',
    nextSteps: [
      'Complete background check process',
      'Finalize onboarding schedule',
      'Set up equipment and workspace',
      'Begin visa application process',
      'Prepare for remote work start'
    ],
    documents: [
      { name: 'Employment Contract', type: 'contract', status: 'signed' },
      { name: 'Offer Letter', type: 'offer', status: 'signed' },
      { name: 'Background Check Form', type: 'background', status: 'pending' },
      { name: 'Equipment Request', type: 'equipment', status: 'signed' }
    ]
  }
];

// Candidate-specific data (filtered for current user)
export const candidateApplications = applications.filter(app => app.candidateId === currentUser.id);
export const candidateInterviews = interviews.filter(interview => interview.candidateId === currentUser.id);
export const candidateOffers = offers.filter(offer => offer.candidateId === currentUser.id);
export const candidateVisaStatus = visaApplications.find(visa => visa.candidateId === currentUser.id);

// Enhanced application details with comprehensive tracking data
export const applicationDetails = {
  'app1': {
    id: 'app1',
    jobId: '1',
    candidateId: '1',
    status: 'interview_scheduled',
    appliedDate: '2024-03-15T10:30:00Z',
    lastUpdated: '2024-03-20T14:22:00Z',

    matchScore: 92,
    applicationId: 'VEL-2024-001',
    appliedVia: 'Direct',
    estimatedTimeline: '5-7 business days',
    timeline: [
      {
        id: 1,
        event: 'applied',
        date: '2024-03-15T10:30:00Z',
        title: 'Application Submitted',
        description: 'Your application has been successfully submitted',
        status: 'completed'
      },
      {
        id: 2,
        event: 'viewed',
        date: '2024-03-16T09:15:00Z',
        title: 'Application Viewed',
        description: 'Viewed by John Smith (Hiring Manager)',
        status: 'completed'
      },
      {
        id: 3,
        event: 'review_started',
        date: '2024-03-17T11:00:00Z',
        title: 'Moved to Review',
        description: 'Application moved to review stage',
        status: 'completed'
      },
      {
        id: 4,
        event: 'interview_scheduled',
        date: '2024-03-20T14:22:00Z',
        title: 'Interview Scheduled',
        description: 'Phone interview scheduled for March 25',
        status: 'completed'
      },
      {
        id: 5,
        event: 'interview_pending',
        date: '2024-03-25T14:00:00Z',
        title: 'Interview',
        description: 'Technical phone interview',
        status: 'pending'
      }
    ],
    interview: {
      id: 'int1',
      type: 'phone',
      round: 1,
      totalRounds: 2,
      date: '2024-03-25',
      time: '14:00',
      timezone: 'CET',
      duration: 45,
      status: 'scheduled',
      interviewer: {
        name: 'John Smith',
        title: 'Senior Engineering Manager',
        email: 'john.smith@techcorp.com',
        phone: '+49 30 1234 5678',
        linkedin: 'https://linkedin.com/in/johnsmith-eng',
        avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400',
        bio: 'John has been leading engineering teams at TechCorp for over 8 years, specializing in full-stack development and team scaling.'
      },
      platform: 'Google Meet',
      meetingLink: 'https://meet.google.com/abc-def-ghi',
      instructions: 'Please join 5 minutes early. We\'ll discuss your technical background and do a live coding exercise.',
      preparation: [
        'Review your React and Node.js projects',
        'Prepare questions about our tech stack',
        'Test your camera and microphone',
        'Have your portfolio ready to share'
      ],
      canReschedule: true,
      rescheduleDeadline: '2024-03-24T14:00:00Z'
    },
    messages: [
      {
        id: 1,
        sender: 'recruiter',
        senderName: 'Sarah Mueller',
        senderTitle: 'Senior Recruiter',
        senderAvatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=400',
        message: 'Hi Rahul! Thanks for your application. We\'re impressed with your background and would like to schedule a phone interview.',
        date: '2024-03-20T14:22:00Z',
        read: true,
        type: 'text'
      },
      {
        id: 2,
        sender: 'system',
        senderName: 'Velai',
        message: 'Interview scheduled for March 25, 2024 at 2:00 PM CET',
        date: '2024-03-20T14:25:00Z',
        read: true,
        type: 'system'
      }
    ],
    documents: [
      {
        id: 1,
        type: 'resume',
        name: 'Rahul_Sharma_Resume.pdf',
        originalName: 'Resume_Updated_March2024.pdf',
        size: '1.2 MB',
        uploadDate: '2024-03-15T10:30:00Z',
        status: 'submitted',
        url: '/documents/resume_rahul.pdf',
        canReplace: true
      },
      {
        id: 2,
        type: 'cover_letter',
        name: 'Cover_Letter_TechCorp.pdf',
        originalName: 'Cover Letter.pdf',
        size: '800 KB',
        uploadDate: '2024-03-15T10:30:00Z',
        status: 'submitted',
        url: '/documents/cover_letter_rahul.pdf',
        canReplace: true
      }
    ],
    submittedAnswers: {
      experience_years: '3-5 years',
      remote_experience: 'Yes, extensively',
      start_date: 'Available with 2 weeks notice',
      motivation: 'I\'m excited about TechCorp\'s innovative approach to AI and machine learning. The opportunity to work with cutting-edge technology while contributing to meaningful projects aligns perfectly with my career goals.'
    },
    companyInsights: {
      averageResponseTime: '3-5 days',
      totalApplicants: 47,
      yourRanking: 'Top 15%',
      hiringTimeline: '2-3 weeks',
      interviewProcess: [
        'Phone screening (45 mins)',
        'Technical interview (90 mins)',
        'Team fit interview (60 mins)',
        'Final interview with VP (30 mins)'
      ]
    },
    jobMatchDetails: {
      matchedSkills: ['React', 'Node.js', 'Python', 'AWS'],
      missingSkills: ['Docker', 'Kubernetes'],
      experienceMatch: 'Perfect match',
      salaryMatch: 'Within range',
      locationMatch: 'Willing to relocate'
    }
  },
  'app2': {
    id: 'app2',
    jobId: '2',
    candidateId: '1',
    status: 'offer_received',
    appliedDate: '2024-03-10T15:20:00Z',
    lastUpdated: '2024-03-22T10:00:00Z',

    matchScore: 88,
    applicationId: 'VEL-2024-002',
    appliedVia: 'LinkedIn',
    timeline: [
      {
        id: 1,
        event: 'applied',
        date: '2024-03-10T15:20:00Z',
        title: 'Application Submitted',
        description: 'Applied via LinkedIn',
        status: 'completed'
      },
      {
        id: 2,
        event: 'interview_completed',
        date: '2024-03-18T14:00:00Z',
        title: 'Interview Completed',
        description: 'Design portfolio review completed',
        status: 'completed'
      },
      {
        id: 3,
        event: 'offer_received',
        date: '2024-03-22T10:00:00Z',
        title: 'Offer Received',
        description: 'Job offer received',
        status: 'completed'
      }
    ],
    offer: {
      id: 'offer2',
      position: 'Product Designer',
      department: 'Design Team',
      startDate: '2024-04-15',
      expiryDate: '2024-03-29T23:59:59Z',
      salary: {
        base: 58000,
        currency: 'EUR',
        bonus: 5000,
        equity: '0.2%',
        totalPackage: 63000
      },
      benefits: [
        'Health Insurance (100% covered)',
        'Dental & Vision',
        'Creative Tools Budget (€2000/year)',
        'Learning & Development Budget',
        '25 days vacation',
        'Flexible working hours',
        'Remote work options'
      ],
      relocation: {
        included: true,
        bonus: 4000,
        temporaryHousing: '21 days',
        flightTickets: true,
        visaSupport: true
      },
      documents: [
        {
          name: 'Offer Letter',
          type: 'offer_letter',
          url: '/documents/offer_letter.pdf',
          status: 'ready'
        },
        {
          name: 'Employment Contract',
          type: 'contract',
          url: '/documents/contract.pdf',
          status: 'ready'
        },
        {
          name: 'Benefits Guide',
          type: 'benefits',
          url: '/documents/benefits.pdf',
          status: 'ready'
        }
      ]
    },
    messages: [
      {
        id: 1,
        sender: 'recruiter',
        senderName: 'Maria Weber',
        senderTitle: 'HR Manager',
        senderAvatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=400',
        message: 'Congratulations! We\'re excited to extend an offer for the Product Designer position. Please review the attached documents.',
        date: '2024-03-22T10:00:00Z',
        read: true,
        attachments: ['offer_letter.pdf', 'contract.pdf']
      }
    ]
  },
  'app3': {
    id: 'app3',
    jobId: '1',
    candidateId: '1',
    status: 'rejected',
    appliedDate: '2024-03-05T09:00:00Z',
    lastUpdated: '2024-03-12T16:30:00Z',

    matchScore: 78,
    applicationId: 'VEL-2024-003',
    timeline: [
      {
        id: 1,
        event: 'applied',
        date: '2024-03-05T09:00:00Z',
        title: 'Application Submitted',
        status: 'completed'
      },
      {
        id: 2,
        event: 'rejected',
        date: '2024-03-12T16:30:00Z',
        title: 'Application Not Selected',
        description: 'Thank you for your interest',
        status: 'completed'
      }
    ],
    rejection: {
      reason: 'We received many qualified applications and decided to move forward with candidates whose experience more closely matches our specific requirements.',
      feedback: 'Your technical skills are impressive. We encourage you to apply for our upcoming Senior Backend Developer role which might be a better fit.',
      canReapply: true,
      reapplyDate: '2024-06-12',
      suggestedRoles: ['Senior Backend Developer', 'DevOps Engineer'],
      keepInDatabase: true
    },
    messages: [
      {
        id: 1,
        sender: 'recruiter',
        senderName: 'Tom Wilson',
        senderTitle: 'Talent Acquisition',
        message: 'Thank you for your application. While we won\'t be moving forward at this time, we\'d love to keep your profile for future opportunities.',
        date: '2024-03-12T16:30:00Z',
        read: true
      }
    ]
  }
};

// Job categories for job creation
export const jobCategories = [
  { id: 'all', name: 'All Templates', icon: 'Briefcase' },
  { id: 'engineering', name: 'Engineering', icon: 'Code' },
  { id: 'sales', name: 'Sales', icon: 'BarChart2' },
  { id: 'marketing', name: 'Marketing', icon: 'Megaphone' },
  { id: 'hr', name: 'Human Resources', icon: 'Users' },
  { id: 'operations', name: 'Operations', icon: 'Cog' },
];

// Job templates for job creation
export const jobTemplates = [
  { id: 'eng-1', category: 'engineering', title: 'Senior Frontend Developer', description: 'Build and maintain user-facing features using React and TypeScript.' },
  { id: 'eng-2', category: 'engineering', title: 'Backend Go Developer', description: 'Design and implement scalable backend services and APIs using Go.' },
  { id: 'eng-3', category: 'engineering', title: 'DevOps Engineer (m/f/d)', description: 'Manage our CI/CD pipelines, cloud infrastructure, and deployment processes.' },
  { id: 'sales-1', category: 'sales', title: 'Account Executive - DACH', description: 'Drive new business revenue within the German-speaking market.' },
  { id: 'sales-2', category: 'sales', title: 'Sales Development Representative', description: 'Generate and qualify new leads for the sales team.' },
  { id: 'mkt-1', category: 'marketing', title: 'Content Marketing Manager', description: 'Develop and execute a content strategy to drive brand awareness and leads.' },
  { id: 'hr-1', category: 'hr', title: 'Technical Recruiter', description: 'Source, screen, and hire top technical talent from India for relocation to Germany.' },
  { id: 'ops-1', category: 'operations', title: 'Project Manager', description: 'Oversee project planning, execution, and delivery across multiple teams.' },
];

// Get application details by ID
export const getApplicationDetails = (applicationId) => {
  return applicationDetails[applicationId] || null;
};
