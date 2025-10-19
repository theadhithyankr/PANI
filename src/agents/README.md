# Job Matching Agent

A comprehensive AI-powered agent for job matching, candidate recommendations, job creation, and interview scheduling in the VelAI platform.

## Features

### 1. Fetch Matching Jobs for Candidates
- **Smart Matching Algorithm**: Uses skills, experience, location, and preferences to find the best job matches
- **Match Scoring**: Provides percentage-based match scores with detailed reasoning
- **Advanced Filtering**: Filter by date, job type, company, experience level, and location
- **Real-time Results**: Fast, efficient queries with caching support

### 2. Fetch Recommended Candidates for Jobs
- **Reverse Matching**: Find candidates who are a good fit for specific job positions
- **Comprehensive Profiles**: Analyzes skills, experience, location preferences, and career goals
- **Batch Processing**: Process multiple jobs or candidates simultaneously
- **Detailed Insights**: Provides match reasons and compatibility analysis

### 3. Create Job Posts
- **Complete Job Creation**: Full job posting functionality with all necessary fields
- **Validation**: Comprehensive validation for required fields and data integrity
- **Flexible Salary Options**: Support for fixed, range, and negotiable salary types
- **Company Integration**: Automatically associates jobs with the correct company

### 4. Schedule Candidate Interviews
- **Multiple Interview Types**: Support for various interview formats and types
- **Flexible Scheduling**: Date, time, duration, and location management
- **Integration Ready**: Works with existing interview management systems
- **Comprehensive Details**: Agenda, notes, and additional interviewer support

## Architecture

### Core Components

1. **JobMatchingAgent Class** (`src/agents/JobMatchingAgent.js`)
   - Main agent logic and algorithms
   - Match scoring and calculation
   - Database interactions
   - Caching and performance optimization

2. **React Hook** (`src/hooks/useJobMatchingAgent.js`)
   - React integration layer
   - State management
   - Error handling
   - User authentication integration

3. **Service Layer** (`src/services/JobMatchingAgentService.js`)
   - API service wrapper
   - Batch processing capabilities
   - Health monitoring
   - External integration support

4. **UI Component** (`src/components/agent/JobMatchingAgentComponent.jsx`)
   - Complete user interface
   - Tabbed navigation
   - Form handling
   - Results display

## Usage

### Basic Usage

```javascript
import { useJobMatchingAgent } from '../hooks/useJobMatchingAgent';

const MyComponent = () => {
  const {
    loading,
    error,
    fetchMatchingJobs,
    fetchRecommendedCandidates,
    createJobPost,
    scheduleInterview
  } = useJobMatchingAgent();

  // Fetch matching jobs for current user
  const handleJobSearch = async () => {
    try {
      const jobs = await fetchMatchingJobs({
        date: 'week',
        jobType: 'full-time',
        location: 'New York'
      });
      console.log('Matching jobs:', jobs);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // Fetch recommended candidates for a job
  const handleCandidateSearch = async (jobId) => {
    try {
      const candidates = await fetchRecommendedCandidates(jobId, {
        experience: 'senior',
        location: 'all'
      });
      console.log('Recommended candidates:', candidates);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div>
      <button onClick={handleJobSearch}>Find Jobs</button>
      <button onClick={() => handleCandidateSearch('job-123')}>Find Candidates</button>
    </div>
  );
};
```

### Direct Agent Usage

```javascript
import { jobMatchingAgent } from '../agents/JobMatchingAgent';

// Fetch matching jobs
const jobs = await jobMatchingAgent.fetchMatchingJobs('candidate-id', {
  date: 'month',
  jobType: 'full-time'
});

// Fetch recommended candidates
const candidates = await jobMatchingAgent.fetchRecommendedCandidates('job-id', {
  experience: 'mid',
  searchTerm: 'react'
});

// Create job post
const job = await jobMatchingAgent.createJobPost(jobData, 'employer-id', 'company-id');

// Schedule interview
const interview = await jobMatchingAgent.scheduleInterview(interviewData, 'employer-id');
```

### Service Layer Usage

```javascript
import { jobMatchingAgentService } from '../services/JobMatchingAgentService';

// API-style responses
const jobResponse = await jobMatchingAgentService.getMatchingJobs('candidate-id', filters);
if (jobResponse.success) {
  console.log('Jobs found:', jobResponse.data);
} else {
  console.error('Error:', jobResponse.error);
}

// Batch processing
const batchResponse = await jobMatchingAgentService.batchProcessJobMatches(
  ['candidate-1', 'candidate-2', 'candidate-3'],
  { jobType: 'full-time' }
);
```

## Match Scoring Algorithm

The agent uses a sophisticated scoring algorithm that considers multiple factors:

### Job Matching (Candidate → Jobs)
- **Skills Match (40%)**: Percentage of required skills the candidate possesses
- **Experience Level (25%)**: How well the candidate's experience matches the job requirements
- **Job Type Preference (15%)**: Whether the job type matches candidate preferences
- **Location Match (10%)**: Location compatibility and relocation willingness
- **Salary Expectations (10%)**: Alignment between candidate expectations and job offers

### Candidate Matching (Job → Candidates)
- Uses the same algorithm but from the employer's perspective
- Considers candidate availability and interest
- Analyzes cultural fit and career progression potential

## Configuration

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Requirements
The agent requires the following Supabase tables:
- `profiles` - User profiles
- `job_seeker_profiles` - Detailed candidate profiles
- `employer_profiles` - Employer information
- `jobs` - Job postings
- `companies` - Company information
- `interviews_v2` - Interview scheduling

## Performance Features

### Caching
- In-memory caching for frequently accessed data
- Configurable cache timeout (default: 5 minutes)
- Cache statistics and management

### Optimization
- Efficient database queries with proper indexing
- Batch processing capabilities
- Pagination support for large datasets
- Background processing for heavy operations

## Error Handling

The agent provides comprehensive error handling:
- Validation errors for missing or invalid data
- Database connection and query errors
- Authentication and authorization errors
- Graceful degradation for partial failures

## Monitoring and Analytics

### Health Checks
```javascript
const health = jobMatchingAgentService.healthCheck();
console.log('Agent status:', health.status);
```

### Cache Statistics
```javascript
const stats = jobMatchingAgent.getCacheStats();
console.log('Cache size:', stats.size);
```

### Batch Processing Results
```javascript
const results = await jobMatchingAgentService.batchProcessJobMatches(candidateIds);
console.log(`Processed ${results.data.total} candidates`);
console.log(`Success: ${results.data.successful}, Failed: ${results.data.failed}`);
```

## Integration Examples

### With React Router
```javascript
import { Route } from 'react-router-dom';
import JobMatchingAgentPage from '../pages/agent/JobMatchingAgentPage';

<Route path="/agent" component={JobMatchingAgentPage} />
```

### With Zustand Store
```javascript
import { useJobMatchingAgent } from '../hooks/useJobMatchingAgent';

const useAgentStore = create((set) => ({
  agent: useJobMatchingAgent(),
  // ... other store logic
}));
```

### With API Endpoints
```javascript
// Express.js example
app.post('/api/agent/matching-jobs', async (req, res) => {
  const result = await jobMatchingAgentService.getMatchingJobs(
    req.body.candidateId,
    req.body.filters
  );
  res.json(result);
});
```

## Future Enhancements

- **Machine Learning Integration**: Enhanced matching using ML models
- **Real-time Notifications**: WebSocket support for live updates
- **Advanced Analytics**: Detailed matching analytics and insights
- **API Rate Limiting**: Built-in rate limiting and throttling
- **Multi-language Support**: Internationalization support
- **Custom Matching Rules**: Configurable matching criteria
- **Integration Webhooks**: Webhook support for external systems

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Ensure user is properly authenticated
   - Check user profile exists and is complete

2. **Database Connection Issues**
   - Verify Supabase configuration
   - Check network connectivity
   - Validate database permissions

3. **Performance Issues**
   - Clear agent cache
   - Check database query performance
   - Consider pagination for large datasets

4. **Match Quality Issues**
   - Ensure candidate profiles are complete
   - Verify job postings have required fields
   - Check skills and experience data quality

### Debug Mode

Enable debug logging:
```javascript
// Set debug mode
localStorage.setItem('agent-debug', 'true');

// Check cache
console.log('Cache stats:', jobMatchingAgent.getCacheStats());

// Clear cache
jobMatchingAgent.clearCache();
```

## Contributing

When contributing to the Job Matching Agent:

1. Follow the existing code structure and patterns
2. Add comprehensive tests for new features
3. Update documentation for any API changes
4. Ensure backward compatibility
5. Test with real data scenarios

## License

This agent is part of the VelAI platform and follows the same licensing terms.
