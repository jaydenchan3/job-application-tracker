import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/api';

interface DashboardStats {
  overview: {
    totalApplications: number;
    totalCompanies: number;
    responseRate: number;
    interviewRate: number;
  };
  statusBreakdown: {
    applied: number;
    reviewing: number;
    interview_scheduled: number;
    interviewed: number;
    offer: number;
    rejected: number;
    withdrawn: number;
  };
  recentApplications: Array<{
    id: number;
    positionTitle: string;
    status: string;
    createdAt: string;
    company: {
      id: number;
      name: string;
      industry?: string;
    };
  }>;
  monthlyTrends: Array<{
    month: string;
    applied: number;
    reviewing: number;
    interview_scheduled: number;
    interviewed: number;
    offer: number;
    rejected: number;
    withdrawn: number;
  }>;
  generated: string;
}

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/dashboard/stats');
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch dashboard stats:', error);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

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

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    const icons = {
      applied: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      reviewing: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      interview_scheduled: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      interviewed: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      offer: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      rejected: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      withdrawn: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      )
    };
    return icons[status as keyof typeof icons] || null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 sm:mt-4 text-gray-600 text-sm sm:text-base">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-3 sm:mb-4 text-sm sm:text-base">{error}</p>
          <button 
            onClick={fetchDashboardStats}
            className="bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Job Application Tracker</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate('/applications/add')}
                className="bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 text-sm rounded hover:bg-blue-700 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Add Application</span>
                <span className="sm:hidden">Add</span>
              </button>

              <button
                onClick={() => navigate('/applications')}
                className="bg-green-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 text-sm rounded hover:bg-green-700 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">View All</span>
                <span className="sm:hidden">List</span>
              </button>
              <span className="text-sm sm:text-base text-gray-700 hidden sm:inline">Welcome, {user?.firstName || user?.email}!</span>
              <span className="text-sm text-gray-700 sm:hidden">Hi, {user?.firstName || 'User'}!</span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 text-sm rounded hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
        {stats ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Applications</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.overview.totalApplications}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Companies</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.overview.totalCompanies}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Response Rate</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.overview.responseRate}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Interview Rate</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.overview.interviewRate}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Application Status Breakdown</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-4">
                {Object.entries(stats.statusBreakdown).map(([status, count]) => (
                  <div key={status} className="text-center">
                    <div className={`inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(status)}`}>
                      <span className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0">{getStatusIcon(status)}</span>
                      <span className="hidden lg:inline">{formatStatus(status)}</span>
                      <span className="lg:hidden text-xs">{status.replace('_', ' ')}</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">{count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Applications */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Applications</h2>
              {stats.recentApplications.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {stats.recentApplications.map((application) => (
                    <div key={application.id} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{application.positionTitle}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {application.company.name}
                          {application.company.industry && (
                            <span className="text-gray-400 hidden sm:inline"> • {application.company.industry}</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          <span className="w-3 h-3 mr-1">{getStatusIcon(application.status)}</span>
                          <span className="hidden sm:inline">{formatStatus(application.status)}</span>
                          <span className="sm:hidden">{application.status}</span>
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(application.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">No applications yet. Start adding your job applications to see them here!</p>
                  <button 
                    onClick={() => {
                      console.log('Button clicked - navigating to add application');
                      navigate('/applications/add');
                    }}
                    className="bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded hover:bg-blue-700 transition-colors"
                  >
                    Add Your First Application
                  </button>
                </div>
              )}
            </div>

            {/* Monthly Trends */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Application Trends (Last 6 Months)</h2>
              {stats.monthlyTrends.length > 0 && stats.monthlyTrends.some(m => m.applied + m.reviewing + m.interview_scheduled + m.interviewed + m.offer + m.rejected + m.withdrawn > 0) ? (
                <div className="space-y-3 sm:space-y-4">
                  {/* Stacked Bar Chart */}
                  <div className="flex items-end space-x-1 sm:space-x-2 h-32 sm:h-40">
                    {stats.monthlyTrends.map((month, index) => {
                      const total = month.applied + month.reviewing + month.interview_scheduled + month.interviewed + month.offer + month.rejected + month.withdrawn;
                      const maxTotal = Math.max(...stats.monthlyTrends.map(m => m.applied + m.reviewing + m.interview_scheduled + m.interviewed + m.offer + m.rejected + m.withdrawn), 1);
                      const height = (total / maxTotal) * (window.innerWidth < 640 ? 100 : 120);
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div className="flex flex-col-reverse w-full" style={{ height: `${Math.max(height, 4)}px` }}>
                            {month.offer > 0 && (
                              <div 
                                className="bg-green-500 w-full"
                                style={{ height: `${(month.offer / total) * height}px` }}
                                title={`Offers: ${month.offer}`}
                              ></div>
                            )}
                            {month.interviewed > 0 && (
                              <div 
                                className="bg-indigo-500 w-full"
                                style={{ height: `${(month.interviewed / total) * height}px` }}
                                title={`Interviewed: ${month.interviewed}`}
                              ></div>
                            )}
                            {month.interview_scheduled > 0 && (
                              <div 
                                className="bg-purple-500 w-full"
                                style={{ height: `${(month.interview_scheduled / total) * height}px` }}
                                title={`Interview Scheduled: ${month.interview_scheduled}`}
                              ></div>
                            )}
                            {month.reviewing > 0 && (
                              <div 
                                className="bg-yellow-500 w-full"
                                style={{ height: `${(month.reviewing / total) * height}px` }}
                                title={`Under Review: ${month.reviewing}`}
                              ></div>
                            )}
                            {month.rejected > 0 && (
                              <div 
                                className="bg-red-500 w-full"
                                style={{ height: `${(month.rejected / total) * height}px` }}
                                title={`Rejected: ${month.rejected}`}
                              ></div>
                            )}
                            {month.withdrawn > 0 && (
                              <div 
                                className="bg-gray-500 w-full"
                                style={{ height: `${(month.withdrawn / total) * height}px` }}
                                title={`Withdrawn: ${month.withdrawn}`}
                              ></div>
                            )}
                            {month.applied > 0 && (
                              <div 
                                className="bg-blue-500 w-full"
                                style={{ height: `${(month.applied / total) * height}px` }}
                                title={`Applied: ${month.applied}`}
                              ></div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1 sm:mt-2 text-center">{month.month}</p>
                          <p className="text-xs font-medium text-gray-900">{total}</p>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Legend */}
                  <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded mr-1"></div>
                      <span>Applied</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded mr-1"></div>
                      <span>Reviewing</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-500 rounded mr-1"></div>
                      <span className="hidden sm:inline">Interview Scheduled</span>
                      <span className="sm:hidden">Interview</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-indigo-500 rounded mr-1"></div>
                      <span>Interviewed</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded mr-1"></div>
                      <span>Offer</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded mr-1"></div>
                      <span>Rejected</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-500 rounded mr-1"></div>
                      <span>Withdrawn</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 text-center py-6 sm:py-8 text-sm sm:text-base">
                  No trend data available yet. Start tracking applications to see your progress over time.
                </p>
              )}
            </div>

            {/* Data Updated */}
            {stats.generated && (
              <div className="text-center text-xs sm:text-sm text-gray-500">
                Last updated: {new Date(stats.generated).toLocaleString()}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 px-4">
            <p className="text-gray-600 text-sm sm:text-base">Welcome to your Job Application Tracker!</p>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Start by adding your first job application.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;