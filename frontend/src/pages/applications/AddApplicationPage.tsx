import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api';

interface Company {
  id: number;
  name: string;
  industry?: string;
  location?: string;
  website?: string;
}

const AddApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    positionTitle: '',
    companyId: '',
    companyName: '',
    companyWebsite: '',
    companyIndustry: '',
    companyLocation: '',
    companyDescription: '',
    companyNotes: '',
    applicationDate: new Date().toISOString().split('T')[0],
    status: 'applied' as const,
    priority: 'medium' as const,
    jobDescription: '',
    requirements: '',
    location: '',
    salaryRange: '',
    applicationUrl: '',
    referralSource: '',
    notes: ''
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await apiClient.get('/companies');
      setCompanies(response.data.companies || response.data);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCompanySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const companyId = e.target.value;
    if (companyId === 'new') {
      setShowNewCompanyForm(true);
      setFormData(prev => ({
        ...prev,
        companyId: '',
        companyName: '',
        companyWebsite: '',
        companyIndustry: '',
        companyLocation: '',
        companyDescription: '',
        companyNotes: ''
      }));
    } else {
      setShowNewCompanyForm(false);
      const selectedCompany = companies.find(c => c.id === parseInt(companyId));
      setFormData(prev => ({
        ...prev,
        companyId,
        companyName: selectedCompany?.name || '',
        companyIndustry: selectedCompany?.industry || '',
        companyLocation: selectedCompany?.location || '',
        companyWebsite: selectedCompany?.website || ''
      }));
    }
  };

  const createCompanyIfNeeded = async (): Promise<number | null> => {
    if (formData.companyId) {
      return parseInt(formData.companyId);
    }

    if (!formData.companyName.trim()) {
      throw new Error('Company name is required');
    }

    try {
      const companyData: any = {
        name: formData.companyName.trim()
      };

      if (formData.companyWebsite) companyData.website = formData.companyWebsite;
      if (formData.companyIndustry) companyData.industry = formData.companyIndustry;
      if (formData.companyLocation) companyData.location = formData.companyLocation;
      if (formData.companyDescription) companyData.description = formData.companyDescription;
      if (formData.companyNotes) companyData.notes = formData.companyNotes;

      const response = await apiClient.post('/companies', companyData);
      return response.data.company.id;
    } catch (error: any) {
      if (error.response?.data?.message?.includes('already exists')) {
        // Company already exists, find it
        const existingCompany = companies.find(c => 
          c.name.toLowerCase() === formData.companyName.toLowerCase()
        );
        if (existingCompany) {
          return existingCompany.id;
        }
      }
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validation
      if (!formData.positionTitle.trim()) {
        throw new Error('Position title is required');
      }

      // Create company if needed
      const companyId = await createCompanyIfNeeded();
      if (!companyId) {
        throw new Error('Failed to create or find company');
      }

      // Prepare application data according to your backend schema
      const applicationData: any = {
        companyId: companyId,
        positionTitle: formData.positionTitle.trim(),
        status: formData.status,
        priority: formData.priority
      };

      // Add optional fields only if they have values
      if (formData.applicationDate) {
        applicationData.applicationDate = formData.applicationDate;
      }
      if (formData.jobDescription) {
        applicationData.jobDescription = formData.jobDescription;
      }
      if (formData.requirements) {
        applicationData.requirements = formData.requirements;
      }
      if (formData.location) {
        applicationData.location = formData.location;
      }
      if (formData.salaryRange) {
        applicationData.salaryRange = formData.salaryRange;
      }
      if (formData.applicationUrl) {
        applicationData.applicationUrl = formData.applicationUrl;
      }
      if (formData.referralSource) {
        applicationData.referralSource = formData.referralSource;
      }
      if (formData.notes) {
        applicationData.notes = formData.notes;
      }

      const response = await apiClient.post('/applications', applicationData);
      
      // Redirect to dashboard
      navigate('/dashboard');
      
    } catch (error: any) {
      console.error('Failed to create application:', error);
      if (error.response?.data?.errors) {
        // Handle Zod validation errors
        const validationErrors = error.response.data.errors
          .map((err: any) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        setError(`Validation failed: ${validationErrors}`);
      } else {
        setError(error.response?.data?.message || error.message || 'Failed to create application');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <div className="header-content">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="header-back-btn"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="header-title">Add New Application</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content--narrow">
        <div className="form-container">
          <form onSubmit={handleSubmit} className="form-section">
            {/* Error Message */}
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* Position Information */}
            <div>
              <h2 className="form-section-header">Position Information</h2>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="positionTitle" className="form-label form-label--required">
                    Position Title
                  </label>
                  <input
                    type="text"
                    id="positionTitle"
                    name="positionTitle"
                    value={formData.positionTitle}
                    onChange={handleInputChange}
                    required
                    maxLength={200}
                    className="form-input"
                    placeholder="e.g. Software Engineer, Product Manager"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="applicationDate" className="form-label">
                    Application Date
                  </label>
                  <input
                    type="date"
                    id="applicationDate"
                    name="applicationDate"
                    value={formData.applicationDate}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="status" className="form-label">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="applied">Applied</option>
                    <option value="reviewing">Under Review</option>
                    <option value="interview_scheduled">Interview Scheduled</option>
                    <option value="interviewed">Interviewed</option>
                    <option value="offer">Offer Received</option>
                    <option value="rejected">Rejected</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="priority" className="form-label">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div>
              <h2 className="form-section-header">Company Information</h2>
              <div className="space-y-4">
                <div className="form-field">
                  <label htmlFor="company" className="form-label form-label--required">
                    Company
                  </label>
                  <select
                    id="company"
                    value={formData.companyId || 'new'}
                    onChange={handleCompanySelect}
                    className="form-select"
                  >
                    <option value="">Select existing company...</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name} {company.industry && `(${company.industry})`}
                      </option>
                    ))}
                    <option value="new">+ Add New Company</option>
                  </select>
                </div>

                {(showNewCompanyForm || !formData.companyId) && (
                  <div className="form-company-section">
                    <div className="form-field">
                      <label htmlFor="companyName" className="form-label form-label--required">
                        Company Name
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        required={!formData.companyId}
                        maxLength={100}
                        className="form-input"
                        placeholder="e.g. Google, Microsoft"
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="companyWebsite" className="form-label">
                        Website
                      </label>
                      <input
                        type="url"
                        id="companyWebsite"
                        name="companyWebsite"
                        value={formData.companyWebsite}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="https://company.com"
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="companyIndustry" className="form-label">
                        Industry
                      </label>
                      <input
                        type="text"
                        id="companyIndustry"
                        name="companyIndustry"
                        value={formData.companyIndustry}
                        onChange={handleInputChange}
                        maxLength={50}
                        className="form-input"
                        placeholder="e.g. Technology, Healthcare"
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="companyLocation" className="form-label">
                        Location
                      </label>
                      <input
                        type="text"
                        id="companyLocation"
                        name="companyLocation"
                        value={formData.companyLocation}
                        onChange={handleInputChange}
                        maxLength={100}
                        className="form-input"
                        placeholder="e.g. San Francisco, CA"
                      />
                    </div>
                    <div className="form-field form-grid--full">
                      <label htmlFor="companyDescription" className="form-label">
                        Company Description
                      </label>
                      <textarea
                        id="companyDescription"
                        name="companyDescription"
                        value={formData.companyDescription}
                        onChange={handleInputChange}
                        maxLength={500}
                        rows={2}
                        className="form-textarea"
                        placeholder="Brief description of the company..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Job Details */}
            <div>
              <h2 className="form-section-header">Job Details</h2>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="location" className="form-label">
                    Job Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    maxLength={200}
                    className="form-input"
                    placeholder="e.g. Remote, New York, NY"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="salaryRange" className="form-label">
                    Salary Range
                  </label>
                  <input
                    type="text"
                    id="salaryRange"
                    name="salaryRange"
                    value={formData.salaryRange}
                    onChange={handleInputChange}
                    maxLength={100}
                    className="form-input"
                    placeholder="e.g. $80,000 - $120,000"
                  />
                </div>
                <div className="form-field form-grid--full">
                  <label htmlFor="applicationUrl" className="form-label">
                    Application URL
                  </label>
                  <input
                    type="url"
                    id="applicationUrl"
                    name="applicationUrl"
                    value={formData.applicationUrl}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="https://jobs.company.com/123"
                  />
                </div>
                <div className="form-field form-grid--full">
                  <label htmlFor="referralSource" className="form-label">
                    Referral Source
                  </label>
                  <input
                    type="text"
                    id="referralSource"
                    name="referralSource"
                    value={formData.referralSource}
                    onChange={handleInputChange}
                    maxLength={200}
                    className="form-input"
                    placeholder="e.g. LinkedIn, John Smith, Company Website"
                  />
                </div>
                <div className="form-field form-grid--full">
                  <label htmlFor="jobDescription" className="form-label">
                    Job Description
                  </label>
                  <textarea
                    id="jobDescription"
                    name="jobDescription"
                    value={formData.jobDescription}
                    onChange={handleInputChange}
                    maxLength={5000}
                    rows={4}
                    className="form-textarea"
                    placeholder="Paste the job description here..."
                  />
                </div>
                <div className="form-field form-grid--full">
                  <label htmlFor="requirements" className="form-label">
                    Requirements
                  </label>
                  <textarea
                    id="requirements"
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleInputChange}
                    maxLength={3000}
                    rows={3}
                    className="form-textarea"
                    placeholder="Key requirements and qualifications..."
                  />
                </div>
                <div className="form-field form-grid--full">
                  <label htmlFor="notes" className="form-label">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    maxLength={2000}
                    rows={3}
                    className="form-textarea"
                    placeholder="Any additional notes about this application..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn btn--secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn--primary"
              >
                {isLoading ? 'Creating...' : 'Create Application'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddApplicationPage;