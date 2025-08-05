import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/api';

interface Application {
  id: number;
  positionTitle: string;
  status: string;
  applicationDate: string;
  priority: string;
  location?: string;
  salaryRange?: string;
  notes?: string;
  company: {
    id: number;
    name: string;
    industry?: string;
    location?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ApplicationsResponse {
  applications: Application[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const ApplicationsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Fetch applications
  useEffect(() => {
    fetchApplications();
  }, [currentPage, searchTerm, statusFilter, priorityFilter, sortBy, sortOrder]);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter })
      });

      const response = await apiClient.get(`/applications?${params}`);
      const data: ApplicationsResponse = response.data;
      
      setApplications(data.applications);
      setPagination(data.pagination);
    } catch (error: any) {
      console.error('Failed to fetch applications:', error);
      setError('Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  // Status formatting
  const formatStatus = (status: string) => {
    const statusMap = {
      applied: 'Applied',
      reviewing: 'Under Review',
      interview_scheduled: 'Interview Scheduled',
      interviewed: 'Interviewed',
      offer: 'Offer Received',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusClass = (status: string) => {
    const statusClasses = {
      applied: 'bg-blue-100 text-blue-800',
      reviewing: 'bg-yellow-100 text-yellow-800',
      interview_scheduled: 'bg-purple-100 text-purple-800',
      interviewed: 'bg-indigo-100 text-indigo-800',
      offer: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800'
    };
    return statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityClass = (priority: string) => {
    const priorityClasses = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600'
    };
    return priorityClasses[priority as keyof typeof priorityClasses] || 'bg-gray-100 text-gray-600';
  };

  // Delete application
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    
    try {
      await apiClient.delete(`/applications/${id}`);
      fetchApplications(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete application:', error);
      alert('Failed to delete application');
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedApplications.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedApplications.length} applications?`)) return;
    
    try {
      await Promise.all(selectedApplications.map(id => apiClient.delete(`/applications/${id}`)));
      setSelectedApplications([]);
      fetchApplications();
    } catch (error) {
      console.error('Failed to delete applications:', error);
      alert('Failed to delete applications');
    }
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApplications(applications.map(app => app.id));
    } else {
      setSelectedApplications([]);
    }
  };

  const handleSelectApplication = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedApplications([...selectedApplications, id]);
    } else {
      setSelectedApplications(selectedApplications.filter(appId => appId !== id));
    }
  };

  // Quick status update
  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      await apiClient.put(`/applications/${id}`, { status: newStatus });
      fetchApplications(); // Refresh to show updated status
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold text-gray-900">Applications</h1>
              <span className="ml-2 text-sm text-gray-500">({pagination.total} total)</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/applications/add')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Application
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Dashboard
              </button>
              <span className="text-gray-600">Hi, {user?.firstName || 'User'}!</span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search positions, companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="applied">Applied</option>
                <option value="reviewing">Under Review</option>
                <option value="interview_scheduled">Interview Scheduled</option>
                <option value="interviewed">Interviewed</option>
                <option value="offer">Offer Received</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="positionTitle-asc">Position A-Z</option>
                <option value="positionTitle-desc">Position Z-A</option>
                <option value="applicationDate-desc">Application Date (Recent)</option>
                <option value="applicationDate-asc">Application Date (Oldest)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedApplications.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {selectedApplications.length} application(s) selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Applications Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {applications.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 mb-4">No applications found</p>
              <button 
                onClick={() => navigate('/applications/add')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add Your First Application
              </button>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedApplications.length === applications.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-4"
                  />
                  <div className="grid grid-cols-12 gap-4 w-full text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-3">Position & Company</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1">Priority</div>
                    <div className="col-span-2">Applied Date</div>
                    <div className="col-span-2">Location</div>
                    <div className="col-span-2">Actions</div>
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {applications.map((application) => (
                  <div key={application.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedApplications.includes(application.id)}
                        onChange={(e) => handleSelectApplication(application.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-4"
                      />
                      <div className="grid grid-cols-12 gap-4 w-full items-center">
                        {/* Position & Company */}
                        <div className="col-span-3">
                          <div className="font-medium text-gray-900">
                            <button
                              onClick={() => navigate(`/applications/${application.id}`)}
                              className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                            >
                              {application.positionTitle}
                            </button>
                          </div>
                          <div className="text-sm text-gray-600">
                            {application.company.name}
                            {application.company.industry && (
                              <span className="text-gray-400"> • {application.company.industry}</span>
                            )}
                          </div>
                        </div>

                        {/* Status */}
                        <div className="col-span-2">
                          <select
                            value={application.status}
                            onChange={(e) => handleStatusUpdate(application.id, e.target.value)}
                            className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${getStatusClass(application.status)}`}
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

                        {/* Priority */}
                        <div className="col-span-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityClass(application.priority)}`}>
                            {application.priority}
                          </span>
                        </div>

                        {/* Applied Date */}
                        <div className="col-span-2 text-sm text-gray-600">
                          {application.applicationDate ? 
                            new Date(application.applicationDate).toLocaleDateString() : 
                            'Not specified'
                          }
                        </div>

                        {/* Location */}
                        <div className="col-span-2 text-sm text-gray-600">
                          {application.location || 'Not specified'}
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/applications/edit/${application.id}`)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(application.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6 rounded-lg">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={currentPage === pagination.totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((currentPage - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {[...Array(pagination.totalPages)].map((_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          page === currentPage
                            ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationsPage;