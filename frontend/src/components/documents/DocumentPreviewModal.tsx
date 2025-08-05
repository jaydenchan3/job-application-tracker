// src/components/documents/DocumentPreviewModal.tsx

import React from 'react';

interface Document {
  id: number;
  name: string;
  originalFilename?: string;
  type: string;
  url: string;
  fileExtension?: string;
  mimeType?: string;
  size?: number;
}

interface DocumentPreviewModalProps {
  document: Document;
  onClose: () => void;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  onClose
}) => {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderPreview = () => {
    const fileExtension = document.fileExtension?.toLowerCase();
    const mimeType = document.mimeType?.toLowerCase();

    // PDF Preview
    if (fileExtension === 'pdf' || mimeType?.includes('pdf')) {
      return (
        <div className="w-full h-96 border rounded-lg overflow-hidden">
          <iframe
            src={document.url}
            className="w-full h-full"
            title={`Preview of ${document.name}`}
          />
        </div>
      );
    }

    // Image Preview
    if (fileExtension && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
      return (
        <div className="w-full flex justify-center">
          <img
            src={document.url}
            alt={document.name}
            className="max-w-full max-h-96 object-contain rounded-lg border"
          />
        </div>
      );
    }

    // Text Preview (for demo purposes, showing placeholder)
    if (fileExtension && ['txt', 'md'].includes(fileExtension)) {
      return (
        <div className="w-full h-96 border rounded-lg overflow-hidden bg-gray-50 p-4">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap">
            {`Preview of ${document.name}

This is a text document preview.
In a real application, you would fetch and display the actual file content here.

File Details:
- Type: ${document.type}
- Size: ${formatFileSize(document.size)}
- Extension: ${document.fileExtension}

For demo purposes, this shows what a text preview would look like.`}
          </pre>
        </div>
      );
    }

    // Word Document Preview
    if (fileExtension && ['doc', 'docx'].includes(fileExtension)) {
      return (
        <div className="w-full h-96 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto h-16 w-16 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Word Document</h3>
            <p className="text-gray-600 mb-4">
              Preview not available for Word documents
            </p>
            <button
              onClick={() => window.open(document.url, '_blank')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Document
            </button>
          </div>
        </div>
      );
    }

    // Default - No preview available
    return (
      <div className="w-full h-96 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Preview Not Available</h3>
          <p className="text-gray-600 mb-4">
            This file type cannot be previewed in the browser
          </p>
          <button
            onClick={() => window.open(document.url, '_blank')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Document
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border max-w-5xl shadow-lg rounded-md bg-white mb-8">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{document.name}</h3>
              <p className="text-sm text-gray-600">
                {document.originalFilename} • {formatFileSize(document.size)}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.open(document.url, '_blank')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="mb-6">
            {renderPreview()}
          </div>

          {/* Document Info */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">Type:</span>
                <span className="ml-2 text-gray-900">{document.type.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="font-medium text-gray-500">Extension:</span>
                <span className="ml-2 text-gray-900">{document.fileExtension?.toUpperCase() || 'Unknown'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-500">Size:</span>
                <span className="ml-2 text-gray-900">{formatFileSize(document.size)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-500">Format:</span>
                <span className="ml-2 text-gray-900">{document.mimeType || 'Unknown'}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;