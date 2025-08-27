import React, { useState, useEffect } from 'react';
import { dnsApi } from '../../services/api';
import './DnsProfileWidget.css';

export const DnsProfileWidget = ({ className = '' }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await dnsApi.getProfile();
        if (response.success) {
          setProfile(response.data);
          setError(null);
        } else {
          throw new Error(response.message || 'Failed to fetch DNS profile');
        }
      } catch (err) {
        console.error('DNS Profile API error:', err);
        setError(err.message || 'Failed to fetch DNS profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async (newProfile) => {
    try {
      const response = await dnsApi.updateProfile(newProfile);
      if (response.success) {
        setProfile(response.data || newProfile);
        setEditing(false);
        setError(null);
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Failed to update DNS profile:', err);
      setError(err.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className={`dns-profile-widget ${className}`}>
        <div className="widget-header">
          <h3>DNS Profile</h3>
          <span className="status loading">Loading...</span>
        </div>
        <div className="widget-content">
          <div className="loading-spinner">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`dns-profile-widget ${className}`}>
        <div className="widget-header">
          <h3>DNS Profile</h3>
          <span className="status error">Error</span>
        </div>
        <div className="widget-content">
          <div className="error-message">
            <p>{error}</p>
            <small>Check your DNS configuration</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`dns-profile-widget ${className}`}>
      <div className="widget-header">
        <h3>⚙️ DNS Profile</h3>
        <button 
          className="edit-btn"
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Save' : 'Edit'}
        </button>
      </div>
      <div className="widget-content">
        {editing ? (
          <DnsProfileEditor 
            profile={profile} 
            onSave={handleSave} 
            onCancel={() => setEditing(false)}
          />
        ) : (
          <DnsProfileDisplay profile={profile} />
        )}
      </div>
    </div>
  );
};

const DnsProfileDisplay = ({ profile }) => {
  const defaultProfile = {
    primaryDns: 'Auto',
    secondaryDns: 'Auto',
    domain: 'Not configured',
    provider: 'Control D',
    ttl: 3600,
    recordType: 'A',
    ...profile
  };

  return (
    <div className="profile-display">
      <div className="profile-item">
        <label>Provider:</label>
        <span>{defaultProfile.provider}</span>
      </div>
      <div className="profile-item">
        <label>Primary DNS:</label>
        <span>{defaultProfile.primaryDns}</span>
      </div>
      <div className="profile-item">
        <label>Secondary DNS:</label>
        <span>{defaultProfile.secondaryDns}</span>
      </div>
      <div className="profile-item">
        <label>Domain:</label>
        <span>{defaultProfile.domain}</span>
      </div>
      <div className="profile-item">
        <label>TTL:</label>
        <span>{defaultProfile.ttl}s</span>
      </div>
      <div className="profile-item">
        <label>Record Type:</label>
        <span>{defaultProfile.recordType}</span>
      </div>
    </div>
  );
};

const DnsProfileEditor = ({ profile, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    provider: profile?.provider || 'Control D',
    primaryDns: profile?.primaryDns || '',
    secondaryDns: profile?.secondaryDns || '',
    domain: profile?.domain || '',
    ttl: profile?.ttl || 3600,
    recordType: profile?.recordType || 'A'
  });
  const [errors, setErrors] = useState({});

  // Validate IP address format
  const validateIP = (ip) => {
    if (!ip || ip === 'Auto') return true;
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  };

  // Validate domain format
  const validateDomain = (domain) => {
    if (!domain) return true;
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    return domainRegex.test(domain);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validate DNS IPs
    if (formData.primaryDns && !validateIP(formData.primaryDns)) {
      newErrors.primaryDns = 'Invalid IP address format';
    }
    if (formData.secondaryDns && !validateIP(formData.secondaryDns)) {
      newErrors.secondaryDns = 'Invalid IP address format';
    }

    // Validate domain
    if (formData.domain && !validateDomain(formData.domain)) {
      newErrors.domain = 'Invalid domain format';
    }

    // Validate TTL
    if (formData.ttl < 1 || formData.ttl > 86400) {
      newErrors.ttl = 'TTL must be between 1 and 86400 seconds';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
  };

  return (
    <form className="profile-editor" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Provider:</label>
        <select
          value={formData.provider}
          onChange={(e) => handleChange('provider', e.target.value)}
        >
          <option value="Control D">Control D</option>
          <option value="Cloudflare">Cloudflare</option>
          <option value="Google">Google DNS</option>
          <option value="Quad9">Quad9</option>
          <option value="Custom">Custom</option>
        </select>
      </div>
      <div className="form-group">
        <label>Primary DNS:</label>
        <input
          type="text"
          value={formData.primaryDns}
          onChange={(e) => handleChange('primaryDns', e.target.value)}
          placeholder="Auto or IP address"
          className={errors.primaryDns ? 'error' : ''}
        />
        {errors.primaryDns && <small className="error-text">{errors.primaryDns}</small>}
      </div>
      <div className="form-group">
        <label>Secondary DNS:</label>
        <input
          type="text"
          value={formData.secondaryDns}
          onChange={(e) => handleChange('secondaryDns', e.target.value)}
          placeholder="Auto or IP address"
          className={errors.secondaryDns ? 'error' : ''}
        />
        {errors.secondaryDns && <small className="error-text">{errors.secondaryDns}</small>}
      </div>
      <div className="form-group">
        <label>Domain:</label>
        <input
          type="text"
          value={formData.domain}
          onChange={(e) => handleChange('domain', e.target.value)}
          placeholder="example.com"
          className={errors.domain ? 'error' : ''}
        />
        {errors.domain && <small className="error-text">{errors.domain}</small>}
      </div>
      <div className="form-group">
        <label>TTL (seconds):</label>
        <input
          type="number"
          value={formData.ttl}
          onChange={(e) => handleChange('ttl', parseInt(e.target.value))}
          min="1"
          max="86400"
          className={errors.ttl ? 'error' : ''}
        />
        {errors.ttl && <small className="error-text">{errors.ttl}</small>}
      </div>
      <div className="form-group">
        <label>Record Type:</label>
        <select
          value={formData.recordType}
          onChange={(e) => handleChange('recordType', e.target.value)}
        >
          <option value="A">A</option>
          <option value="AAAA">AAAA</option>
          <option value="CNAME">CNAME</option>
          <option value="MX">MX</option>
          <option value="TXT">TXT</option>
        </select>
      </div>
      <div className="form-actions">
        <button type="submit" className="save-btn">Save</button>
        <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};