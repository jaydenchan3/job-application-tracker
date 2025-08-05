// src/components/documents/LinkToApplicationModal.tsx

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';

interface Application {
  id: number;
  position: string;
  company: {
    name: string;
  };
  status: string;
}

interface Document {
  id: number;
  name: string;
  type: string;
  applicationId?: number;
}

interface LinkToApplicationModalProps {
  document: Document;
  onClose: () => void;
  onSuccess: () => void;
}

const LinkToApplicationModal: React.FC<LinkToApplicationModalProps> = ({
  document,
  onClose,
  onSuccess
}) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(
    document.applicationId || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await apiClient.get('/applications?limit=100');
      setApplications(response.data.applications || []);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      setError('Failed to load applications');
    }
  };

  const handleLink = async () => {
    if (!selectedApplicationId) {
      setError('Please select an application');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiClient.patch(`/documents/${document.id}`, {
        applicationId: selectedApplicationId
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to link document:', error);
      setError('Failed to link document to application');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    setLoading(true);
    setError('');

    try {
      await apiClient.patch(`/documents/${document.id}`, {
        applicationId: null
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to unlink document:', error);
      setError('Failed to unlink document');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'applied': 'bg-blue-100 text-blue-800',
      'interviewing': 'bg-yellow-100 text-yellow-800',
      'offer': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'withdrawn': 'bg-gray-100 text-gray-800'
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Link Document to Application
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Document Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <svg className="w-8 h-8 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <h4 className="font-medium text-gray-900">{document.name}</h4>
                <p className="text-sm text-gray-600 capitalize">{document.type.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          {/* Current Link Status */}
          {document.applicationId && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                Currently linked to an application
              </p>
            </div>
          )}

          {/* Application Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Application
            </label>
            <select
              value={selectedApplicationId || ''}
              onChange={(e) => setSelectedApplicationId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="">Select an application...</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.position} at {app.company.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Application Preview */}
          {selectedApplicationId && (
            <div className="mb-6">
              {(() => {
                const selectedApp = applications.find(app => app.id === selectedApplicationId);
                if (!selectedApp) return null;
                
                return (
                  <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{selectedApp.position}</h4>
                        <p className="text-sm text-gray-600">{selectedApp.company.name}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedApp.status)}`}>
                        {selectedApp.status}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div>
              {document.applicationId && (
                <button
                  onClick={handleUnlink}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50"
                >
                  {loading ? 'Unlinking...' : 'Unlink Document'}
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLink}
                disabled={loading || !selectedApplicationId}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Linking...' : 'Link Document'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkToApplicationModal;