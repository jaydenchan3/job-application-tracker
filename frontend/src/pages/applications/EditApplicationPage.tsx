import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../../lib/api';

interface Company {
  id: number;
  name: string;
  industry?: string;
  size?: string;
  website?: string;
  location?: string;
}

interface Application {
  id: number;
  positionTitle: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
  location: string;
  workType: 'remote' | 'hybrid' | 'on-site';
  salaryMin?: number;
  salaryMax?: number;
  status: string;
  priority: 'low' | 'medium' | 'high';
  applicationDate: string;
  source: string;
  notes?: string;
  companyId: number;
  company: Company;
}

interface ApplicationFormData {
  positionTitle: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
  location: string;
  workType: 'remote' | 'hybrid' | 'on-site';
  salaryMin: string;
  salaryMax: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  applicationDate: string;
  source: string;
  notes: string;
  companyId: string;
  companyName: string;
}

// REVERSE MAPPING FUNCTIONS - Convert database values to frontend values
const reverseMapEmploymentType = (dbValue: string): 'full-time' | 'part-time' | 'contract' | 'internship' => {
  const mapping = {
    'full_time': 'full-time',
    'part_time': 'part-time',
    'contract': 'contract',
    'internship': 'internship'
  };
  return mapping[dbValue as keyof typeof mapping] || 'full-time';
};

const reverseMapWorkType = (dbValue: string): 'remote' | 'hybrid' | 'on-site' => {
  const mapping = {
    'remote': 'remote',
    'hybrid': 'hybrid',
    'on_site': 'on-site'
  };
  return mapping[dbValue as keyof typeof mapping] || 'remote';
};

const reverseMapPriority = (dbValue: string): 'low' | 'medium' | 'high' => {
  const mapping = {
    'low': 'low',
    'medium': 'medium',
    'high': 'high'
  };
  return mapping[dbValue as keyof typeof mapping] || 'medium';
};

const reverseMapStatus = (dbValue: string): string => {
  const mapping = {
    'applied': 'applied',
    'reviewing': 'reviewing',
    'interview_scheduled': 'interview_scheduled',
    'interviewed': 'interviewed',
    'offer': 'offer',
    'rejected': 'rejected',
    'withdrawn': 'withdrawn'
  };
  return mapping[dbValue as keyof typeof mapping] || 'applied';
};

const EditApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [formData, setFormData] = useState<ApplicationFormData>({
    positionTitle: '',
    employmentType: 'full-time',
    location: '',
    workType: 'remote',
    salaryMin: '',
    salaryMax: '',
    status: 'applied',
    priority: 'medium',
    applicationDate: '',
    source: '',
    notes: '',
    companyId: '',
    companyName: ''
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Fetch application data and companies on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Fetch application data
        const appResponse = await apiClient.get(`/applications/${id}`);
        const application: any = appResponse.data.application; // Use any to handle database enum format
        
        // Fetch companies for dropdown
        const companiesResponse = await apiClient.get('/companies');
        setCompanies(companiesResponse.data.companies);
        
        console.log('📥 Raw application data from DB:', application);
        
        // Pre-populate form with existing data - FIXED with reverse mapping
        setFormData({
          positionTitle: application.positionTitle || '',
          employmentType: reverseMapEmploymentType(application.employmentType || 'full_time'),
          location: application.location || '',
          workType: reverseMapWorkType(application.workType || 'remote'),
          salaryMin: application.salaryMin?.toString() || '',
          salaryMax: application.salaryMax?.toString() || '',
          status: reverseMapStatus(application.status || 'applied'),
          priority: reverseMapPriority(application.priority || 'medium'),
          applicationDate: application.applicationDate ? new Date(application.applicationDate).toISOString().split('T')[0] : '',
          source: application.source || '',
          notes: application.notes || '',
          companyId: application.companyId.toString(),
          companyName: application.company?.name || ''
        });
        
      } catch (error: any) {
        console.error('Error fetching application:', error);
        setError(error.response?.data?.message || 'Failed to load application data');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value || '' // Ensure we never set null/undefined values
    }));
  };

  const handleCompanySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCompanyId = e.target.value;
    const selectedCompany = companies.find(c => c.id.toString() === selectedCompanyId);
    
    setFormData(prev => ({
      ...prev,
      companyId: selectedCompanyId,
      companyName: selectedCompany?.name || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      // Debug: Log form data
      console.log('🔍 Form data before validation:', formData);

      // Validate required fields
      if (!formData.positionTitle || !formData.positionTitle.trim()) {
        setError('Position title is required');
        return;
      }
      if (!formData.companyId) {
        setError('Company selection is required');
        return;
      }

      // Prepare data for API - Send frontend values (backend will map them)
      const updateData = {
        positionTitle: formData.positionTitle.trim(),
        employmentType: formData.employmentType, // Send frontend format: "full-time"
        location: formData.location?.trim() || null,
        workType: formData.workType, // Send frontend format: "on-site"
        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : null,
        salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : null,
        status: formData.status, // Send frontend format: "interview_scheduled"
        priority: formData.priority, // Send frontend format: "medium"
        applicationDate: formData.applicationDate || null,
        source: formData.source?.trim() || null,
        notes: formData.notes?.trim() || null,
        companyId: parseInt(formData.companyId)
      };

      console.log('🚀 Sending update data (frontend format):', updateData);
      
      await apiClient.put(`/applications/${id}`, updateData);
      
      setSuccess('Application updated successfully!');
      
      // Redirect to applications page after short delay
      setTimeout(() => {
        navigate('/applications');
      }, 1500);

    } catch (error: any) {
        console.error('❌ Error updating application:', error);
        console.error('📋 Full error response:', error.response);
        console.error('🚨 Error message from backend:', error.response?.data);
        
        setError(error.response?.data?.message || 'Failed to update application');
      } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/applications')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Applications
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Application</h1>
          <p className="mt-2 text-gray-600">Update your job application details</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {/* Position Title */}
            <div>
              <label htmlFor="positionTitle" className="block text-sm font-medium text-gray-700">
                Position Title *
              </label>
              <input
                type="text"
                id="positionTitle"
                name="positionTitle"
                value={formData.positionTitle || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Company Selection */}
            <div>
              <label htmlFor="companyId" className="block text-sm font-medium text-gray-700">
                Company *
              </label>
              <select
                id="companyId"
                name="companyId"
                value={formData.companyId}
                onChange={handleCompanySelect}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Employment Type & Work Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700">
                  Employment Type
                </label>
                <select
                  id="employmentType"
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              <div>
                <label htmlFor="workType" className="block text-sm font-medium text-gray-700">
                  Work Type
                </label>
                <select
                  id="workType"
                  name="workType"
                  value={formData.workType}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="on-site">On-site</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., San Francisco, CA or Remote"
              />
            </div>

            {/* Salary Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700">
                  Minimum Salary
                </label>
                <input
                  type="number"
                  id="salaryMin"
                  name="salaryMin"
                  value={formData.salaryMin || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 80000"
                />
              </div>

              <div>
                <label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700">
                  Maximum Salary
                </label>
                <input
                  type="number"
                  id="salaryMax"
                  name="salaryMax"
                  value={formData.salaryMax || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 120000"
                />
              </div>
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Application Date & Source */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="applicationDate" className="block text-sm font-medium text-gray-700">
                  Application Date
                </label>
                <input
                  type="date"
                  id="applicationDate"
                  name="applicationDate"
                  value={formData.applicationDate || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                  Source
                </label>
                <input
                  type="text"
                  id="source"
                  name="source"
                  value={formData.source || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., LinkedIn, Company Website, Referral"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional notes about this application..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/applications')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSaving && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSaving ? 'Updating...' : 'Update Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditApplicationPage;