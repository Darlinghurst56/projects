import React, { useState, useEffect } from 'react';
import { googleApi } from '../../services/api';

export const GoogleDriveWidget = ({ className = '' }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        const response = await googleApi.drive.getFiles();
        setFiles(response.files || []);
        setError(null);
      } catch (err) {
        console.error('Drive API error:', err);
        setError(err.message || 'Failed to fetch files');
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
    const interval = setInterval(fetchFiles, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, []);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('video')) return '🎬';
    if (mimeType.includes('audio')) return '🎵';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('document')) return '📝';
    if (mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('presentation')) return '🎥';
    if (mimeType.includes('folder')) return '📁';
    return '📄';
  };

  if (loading) {
    return (
      <div className={`drive-widget ${className}`}>
        <div className="widget-header">
          <h3>💽 Google Drive</h3>
          <span className="status loading">Loading...</span>
        </div>
        <div className="widget-content">
          <div className="loading-spinner">Loading files...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`drive-widget ${className}`}>
        <div className="widget-header">
          <h3>💽 Google Drive</h3>
          <span className="status error">Error</span>
        </div>
        <div className="widget-content">
          <div className="error-message">
            <p>❌ {error}</p>
            <small>Check your Google API configuration</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`drive-widget ${className}`}>
      <div className="widget-header">
        <h3>💽 Google Drive</h3>
        <span className="status success">{files.length} files</span>
      </div>
      <div className="widget-content">
        {files.length === 0 ? (
          <div className="empty-state">
            <p>📂 No files found</p>
          </div>
        ) : (
          <div className="files-list">
            {files.slice(0, 10).map((file, index) => (
              <div key={file.id || index} className="file-item">
                <div className="file-info">
                  <span className="file-icon">{getFileIcon(file.mimeType)}</span>
                  <div className="file-details">
                    <div className="file-name">
                      {file.name || 'Untitled'}
                    </div>
                    <div className="file-meta">
                      <span className="file-size">{formatFileSize(file.size)}</span>
                      <span className="file-date">{formatDate(file.modifiedTime)}</span>
                    </div>
                  </div>
                </div>
                {file.webViewLink && (
                  <a 
                    href={file.webViewLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="file-link"
                  >
                    🔗
                  </a>
                )}
              </div>
            ))}
            {files.length > 10 && (
              <div className="more-files">
                <small>... and {files.length - 10} more files</small>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};