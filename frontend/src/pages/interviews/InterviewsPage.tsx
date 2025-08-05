// src/pages/interviews/InterviewsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import { InterviewFormModal } from '../../components/interviews/InterviewFormModal';

interface Interview {
  id: number;
  applicationId: number;
  type: 'phone' | 'video' | 'in_person' | 'technical' | 'behavioral' | 'panel' | 'final';
  scheduledAt?: string;
  duration?: number;
  interviewer?: string;
  location?: string;
  notes?: string;
  outcome?: string;
  createdAt: string;
  updatedAt: string;
  application: {
    id: number;
    positionTitle: string;
    company: {
      id: number;
      name: string;
      website?: string;
    };
  };
}

interface InterviewStats {
  total: number;
  upcoming: number;
  past: number;
  successRate: number;
  typeBreakdown: Record<string, number>;
}

export const InterviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [stats, setStats] = useState<InterviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUpcoming, setShowUpcoming] = useState(false);
  
  // Modal state
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(showUpcoming && { upcoming: 'true' })
      });

      const response = await apiClient.get(`/interviews?${params}`);
      setInterviews(response.data.interviews);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error: any) {
      setError('Failed to fetch interviews');
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/interviews/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching interview stats:', error);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [page, searchTerm, typeFilter, showUpcoming]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this interview?')) return;
    
    try {
      await apiClient.delete(`/interviews/${id}`);
      fetchInterviews();
      fetchStats();
    } catch (error) {
      setError('Failed to delete interview');
    }
  };

  const handleEdit = (interview: Interview) => {
    setEditingInterview(interview);
    setShowInterviewForm(true);
  };

  const handleCloseForm = () => {
    setShowInterviewForm(false);
    setEditingInterview(null);
  };

  const handleFormSuccess = () => {
    fetchInterviews();
    fetchStats();
    handleCloseForm();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type: string) => {
    const colors = {
      phone: 'status-applied',
      video: 'status-reviewing',
      'in_person': 'status-interview',
      technical: 'status-offer',
      behavioral: 'status-rejected',
      panel: 'status-withdrawn',
      final: 'status-applied'
    };
    return colors[type as keyof typeof colors] || 'status-applied';
  };

  const getOutcomeColor = (outcome?: string) => {
    if (!outcome) return 'status-applied';
    const colors = {
      positive: 'status-offer',
      negative: 'status-rejected',
      neutral: 'status-reviewing',
      pending: 'status-applied'
    };
    return colors[outcome as keyof typeof colors] || 'status-applied';
  };

  if (loading && interviews.length === 0) {
    return (
      <div className="page-wrapper">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <div className="header-content">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="header-back-btn"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="header-title">Interviews</h1>
                  <p className="header-subtitle">Manage your interview schedule and track outcomes</p>
                </div>
              </div>
              <button
                onClick={() => setShowInterviewForm(true)}
                className="btn btn--primary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Schedule Interview
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-container">
          
          {/* Stats Cards */}
          {stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon stat-icon--blue">
                  <span className="stat-number">{stats.total}</span>
                </div>
                <div className="stat-content">
                  <p className="stat-label">Total Interviews</p>
                  <p className="stat-value">{stats.total}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon stat-icon--green">
                  <span className="stat-number">{stats.upcoming}</span>
                </div>
                <div className="stat-content">
                  <p className="stat-label">Upcoming</p>
                  <p className="stat-value">{stats.upcoming}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon stat-icon--purple">
                  <span className="stat-number">{stats.past}</span>
                </div>
                <div className="stat-content">
                  <p className="stat-label">Past</p>
                  <p className="stat-value">{stats.past}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon stat-icon--orange">
                  <span className="stat-number">{stats.successRate}%</span>
                </div>
                <div className="stat-content">
                  <p className="stat-label">Success Rate</p>
                  <p className="stat-value">{stats.successRate}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="filter-section">
            <div className="filter-grid">
              <div className="form-field">
                <label className="form-label">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search interviews..."
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="form-select"
                >
                  <option value="all">All Types</option>
                  <option value="phone">Phone</option>
                  <option value="video">Video</option>
                  <option value="in_person">In Person</option>
                  <option value="technical">Technical</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="panel">Panel</option>
                  <option value="final">Final</option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={showUpcoming}
                    onChange={(e) => setShowUpcoming(e.target.checked)}
                    className="form-checkbox"
                  />
                  Show upcoming only
                </label>
              </div>

              <div className="form-field">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setTypeFilter('all');
                    setShowUpcoming(false);
                    setPage(1);
                  }}
                  className="btn btn--secondary"
                >
                  Clear filters
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Interviews List */}
          <div className="table-container">
            {interviews.length === 0 ? (
              <div className="empty-state">
                <h3 className="empty-state-title">No interviews found</h3>
                <p className="empty-state-description">Get started by scheduling your first interview.</p>
                <button
                  onClick={() => setShowInterviewForm(true)}
                  className="btn btn--primary"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Schedule Interview
                </button>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Position & Company</th>
                        <th>Type</th>
                        <th>Scheduled</th>
                        <th>Interviewer</th>
                        <th>Outcome</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interviews.map((interview) => (
                        <tr key={interview.id}>
                          <td>
                            <div className="table-cell-main">
                              <div className="table-cell-title">
                                {interview.application.positionTitle}
                              </div>
                              <div className="table-cell-subtitle">
                                {interview.application.company.name}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${getTypeColor(interview.type)}`}>
                              {interview.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <div className="table-cell-main">
                              <div className="table-cell-title">
                                {formatDate(interview.scheduledAt)}
                              </div>
                              {interview.duration && (
                                <div className="table-cell-subtitle">
                                  {interview.duration} minutes
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="table-cell-main">
                              <div className="table-cell-title">{interview.interviewer || 'TBD'}</div>
                              {interview.location && (
                                <div className="table-cell-subtitle">{interview.location}</div>
                              )}
                            </div>
                          </td>
                          <td>
                            {interview.outcome ? (
                              <span className={`status-badge ${getOutcomeColor(interview.outcome)}`}>
                                {interview.outcome}
                              </span>
                            ) : (
                              <span className="table-cell-empty">Pending</span>
                            )}
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                onClick={() => handleEdit(interview)}
                                className="table-action table-action--edit"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(interview.id)}
                                className="table-action table-action--delete"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <div className="pagination-info">
                      <span>Page {page} of {totalPages}</span>
                    </div>
                    <div className="pagination-controls">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="btn btn--secondary btn--sm"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`btn btn--sm ${
                              page === pageNum ? 'btn--primary' : 'btn--secondary'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="btn btn--secondary btn--sm"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Interview Form Modal */}
      {showInterviewForm && (
        <InterviewFormModal
          interview={editingInterview}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};