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
  description?: string;
}

interface StatusHistory {
  id: number;
  previousStatus: string | null;
  newStatus: string;
  changedAt: string;
  notes?: string;
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
  statusHistory: StatusHistory[];
  createdAt: string;
  updatedAt: string;
}

const ApplicationDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const response = await apiClient.get(`/applications/${id}`);
        const appData = response.data.application;
        
        console.log('📥 Application data received:', appData);
        
        setApplication(appData);
        setNewStatus(appData?.status || 'applied');
        
      } catch (error: any) {
        console.error('Error fetching application:', error);
        setError(error.response?.data?.message || 'Failed to load application');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchApplication();
    }
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!application || newStatus === application.status) return;

    try {
      setIsUpdatingStatus(true);
      setError('');

      await apiClient.put(`/applications/${id}`, {
        ...application,
        status: newStatus,
        companyId: application.company.id
      });

      // Refresh application data to get updated status history
      const response = await apiClient.get(`/applications/${id}`);
      setApplication(response.data.application);

    } catch (error: any) {
      console.error('Error updating status:', error);
      setError(error.response?.data?.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!application) return;

    try {
      setIsDeleting(true);
      setError('');

      await apiClient.delete(`/applications/${id}`);
      navigate('/applications');

    } catch (error: any) {
      console.error('Error deleting application:', error);
      setError(error.response?.data?.message || 'Failed to delete application');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getStatusBadgeColor = (status: string | null | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800'; // Handle null/undefined
    
    const colors = {
      applied: 'bg-blue-100 text-blue-800',
      reviewing: 'bg-yellow-100 text-yellow-800',
      interview_scheduled: 'bg-purple-100 text-purple-800',
      interviewed: 'bg-indigo-100 text-indigo-800',
      offer: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadgeColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatSalaryRange = (min?: number, max?: number) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return 'Not specified';
  };

  const formatStatus = (status: string | null | undefined) => {
    if (!status) return 'Unknown'; // Handle null/undefined status
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Application Not Found</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/applications')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  if (!application) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{application.positionTitle}</h1>
              <p className="mt-2 text-xl text-gray-600">{application.company.name}</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={() => navigate(`/applications/edit/${application.id}`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Details */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Application Details</h2>
              
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(application.status)}`}>
                      {formatStatus(application.status)}
                    </span>
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Priority</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeColor(application.priority)}`}>
                      {application.priority.charAt(0).toUpperCase() + application.priority.slice(1)}
                    </span>
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Employment Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {application.employmentType.charAt(0).toUpperCase() + application.employmentType.slice(1).replace('-', ' ')}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Work Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {application.workType.charAt(0).toUpperCase() + application.workType.slice(1).replace('-', ' ')}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900">{application.location || 'Not specified'}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Salary Range</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatSalaryRange(application.salaryMin, application.salaryMax)}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Application Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(application.applicationDate)}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Source</dt>
                  <dd className="mt-1 text-sm text-gray-900">{application.source || 'Not specified'}</dd>
                </div>
              </dl>
              
              {application.notes && (
                <div className="mt-6">
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-2 text-sm text-gray-900 bg-gray-50 rounded-md p-3">
                    {application.notes}
                  </dd>
                </div>
              )}
            </div>

            {/* Company Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Company Information</h2>
              
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Company Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{application.company.name}</dd>
                </div>
                
                {application.company.industry && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Industry</dt>
                    <dd className="mt-1 text-sm text-gray-900">{application.company.industry}</dd>
                  </div>
                )}
                
                {application.company.size && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Company Size</dt>
                    <dd className="mt-1 text-sm text-gray-900">{application.company.size}</dd>
                  </div>
                )}
                
                {application.company.location && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Company Location</dt>
                    <dd className="mt-1 text-sm text-gray-900">{application.company.location}</dd>
                  </div>
                )}
                
                {application.company.website && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Website</dt>
                    <dd className="mt-1 text-sm">
                      <a 
                        href={application.company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {application.company.website}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
              
              {application.company.description && (
                <div className="mt-6">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-2 text-sm text-gray-900 bg-gray-50 rounded-md p-3">
                    {application.company.description}
                  </dd>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Status Update */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Status</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Current Status
                  </label>
                  <select
                    id="status"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                
                <button
                  onClick={handleStatusUpdate}
                  disabled={isUpdatingStatus || newStatus === application.status}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>

            {/* Status History */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Status History</h3>
              
              <div className="space-y-4">
                {application.statusHistory && application.statusHistory.length > 0 ? (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {application.statusHistory.map((history, index) => (
                        <li key={history.id}>
                          <div className="relative pb-8">
                            {index !== application.statusHistory.length - 1 && (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            )}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getStatusBadgeColor(history.newStatus)}`}>
                                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-sm text-gray-900">
                                    Status changed to{' '}
                                    <span className="font-medium">{formatStatus(history.newStatus)}</span>
                                    {history.previousStatus && (
                                      <span className="text-gray-500">
                                        {' '}from {formatStatus(history.previousStatus)}
                                      </span>
                                    )}
                                  </p>
                                  {history.notes && (
                                    <p className="mt-1 text-sm text-gray-600">{history.notes}</p>
                                  )}
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                  {formatDateTime(history.changedAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No status history available.</p>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Metadata</h3>
              
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900">{formatDateTime(application.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="text-sm text-gray-900">{formatDateTime(application.updatedAt)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-3">Delete Application</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Are you sure you want to delete this application? This action cannot be undone.
                </p>
                <div className="flex items-center justify-center space-x-4 mt-6">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center"
                  >
                    {isDeleting && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationDetailPage;