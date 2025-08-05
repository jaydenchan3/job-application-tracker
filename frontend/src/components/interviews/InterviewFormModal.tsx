// src/components/interviews/InterviewFormModal.tsx
import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';

interface Application {
  id: number;
  positionTitle: string;
  company: {
    name: string;
  };
}

interface Interview {
  id: number;
  applicationId: number;
  type: 'phone' | 'video' | 'in_person' | 'technical' | 'behavioral' | 'panel' | 'final';
  scheduledAt?: string; // Backend returns scheduledAt
  duration?: number;
  interviewer?: string; // Backend returns interviewer
  location?: string;
  notes?: string; // Backend returns notes
  outcome?: string;
  application: {
    id: number;
    positionTitle: string;
    company: {
      name: string;
    };
  };
}

interface Props {
  interview?: Interview | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const InterviewFormModal: React.FC<Props> = ({ interview, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [applications, setApplications] = useState<Application[]>([]);
  
  // Form data - Updated to match your backend response
  const [formData, setFormData] = useState({
    applicationId: interview?.applicationId?.toString() || '',
    type: interview?.type || 'video',
    scheduledAt: interview?.scheduledAt ? interview.scheduledAt.slice(0, 16) : '', // scheduledAt from backend
    duration: interview?.duration?.toString() || '60',
    interviewer: interview?.interviewer || '', // interviewer from backend response
    location: interview?.location || '',
    notes: interview?.notes || '', // notes from backend response
    outcome: interview?.outcome || ''
  });

  // Fetch applications for dropdown
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await apiClient.get('/applications?limit=100');
        setApplications(response.data.applications);
      } catch (error) {
        console.error('Error fetching applications:', error);
      }
    };
    fetchApplications();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Match your backend's validation schema field names
      const submitData = {
        applicationId: parseInt(formData.applicationId),
        type: formData.type,
        scheduledAt: formData.scheduledAt || null,
        duration: formData.duration ? parseInt(formData.duration) : null,
        location: formData.location || null,
        interviewerName: formData.interviewer || null, // Backend expects interviewerName
        preparationNotes: formData.notes || null, // Backend expects preparationNotes
        outcome: formData.outcome || null
      };

      console.log('=== INTERVIEW SUBMISSION DEBUG ===');
      console.log('Submit data:', submitData);
      console.log('=====================================');

      if (interview) {
        await apiClient.put(`/interviews/${interview.id}`, submitData);
      } else {
        await apiClient.post('/interviews', submitData);
      }

      onSuccess();
    } catch (error: any) {
      console.error('=== INTERVIEW ERROR DEBUG ===');
      console.error('Response data:', error.response?.data);
      console.error('=============================');
      setError(error.response?.data?.message || error.response?.data?.error || 'Failed to save interview');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            {interview ? 'Edit Interview' : 'Schedule New Interview'}
          </h2>
          <button
            onClick={onClose}
            className="modal-close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-content">
          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Application Selection */}
          <div className="form-section">
            <h3 className="form-section-header">Interview Details</h3>
            
            <div className="form-field">
              <label className="form-label form-label--required">
                Application
              </label>
              <select
                name="applicationId"
                value={formData.applicationId}
                onChange={handleChange}
                required
                disabled={!!interview} // Disable if editing existing interview
                className="form-select"
              >
                <option value="">Select an application</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.positionTitle} at {app.company.name}
                  </option>
                ))}
              </select>
              {interview && (
                <p className="form-help-text">
                  Cannot change application for existing interview
                </p>
              )}
            </div>

            <div className="form-grid">
              {/* Interview Type */}
              <div className="form-field">
                <label className="form-label form-label--required">
                  Interview Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="form-select"
                >
                  <option value="phone">Phone</option>
                  <option value="video">Video</option>
                  <option value="in_person">In Person</option>
                  <option value="technical">Technical</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="panel">Panel</option>
                  <option value="final">Final</option>
                </select>
              </div>

              {/* Duration */}
              <div className="form-field">
                <label className="form-label">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min="15"
                  max="300"
                  step="15"
                  className="form-input"
                  placeholder="60"
                />
              </div>
            </div>

            {/* Scheduled Date & Time */}
            <div className="form-field">
              <label className="form-label">
                Scheduled Date & Time
              </label>
              <input
                type="datetime-local"
                name="scheduledAt"
                value={formData.scheduledAt}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-grid">
              {/* Interviewer */}
              <div className="form-field">
                <label className="form-label">
                  Interviewer Name
                </label>
                <input
                  type="text"
                  name="interviewer"
                  value={formData.interviewer}
                  onChange={handleChange}
                  placeholder="e.g., John Smith"
                  className="form-input"
                />
              </div>

              {/* Location */}
              <div className="form-field">
                <label className="form-label">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Zoom, Office, Phone"
                  className="form-input"
                />
              </div>
            </div>

            {/* Outcome (for editing existing interviews) */}
            {interview && (
              <div className="form-field">
                <label className="form-label">
                  Outcome
                </label>
                <select
                  name="outcome"
                  value={formData.outcome}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">No outcome yet</option>
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                  <option value="neutral">Neutral</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            )}

            {/* Notes */}
            <div className="form-field">
              <label className="form-label">
                {interview ? 'Interview Notes' : 'Preparation Notes'}
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                placeholder={
                  interview 
                    ? "How did the interview go? Key points discussed..."
                    : "What should you prepare? Questions to ask..."
                }
                className="form-textarea"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn--secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.applicationId}
              className="btn btn--primary"
            >
              {loading ? 'Saving...' : (interview ? 'Update Interview' : 'Schedule Interview')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};