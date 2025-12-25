import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function TestbedUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState([]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
    setErrors([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file');
      return;
    }

    setUploading(true);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/testbed/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.is_valid) {
        setMessage('Testbed uploaded successfully!');
        setTimeout(() => navigate('/testbeds'), 2000);
      } else {
        setMessage('Testbed uploaded with validation errors');
        setErrors(response.data.errors || []);
      }
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Upload failed');
      setErrors([]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 className="mb-2">Upload Testbed</h1>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Testbed YAML File</label>
            <input
              type="file"
              accept=".yaml,.yml"
              onChange={handleFileChange}
              required
            />
            <small style={{color: '#7f8c8d', display: 'block', marginTop: '0.5rem'}}>
              Upload a PyATS testbed YAML file
            </small>
          </div>

          {message && (
            <div className={`alert ${errors.length > 0 ? 'alert-error' : 'alert-success'}`}>
              {message}
            </div>
          )}

          {errors.length > 0 && (
            <div className="alert alert-error">
              <strong>Validation Errors:</strong>
              <ul style={{marginTop: '0.5rem', marginLeft: '1.5rem'}}>
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{display: 'flex', gap: '1rem'}}>
            <button type="submit" className="btn btn-success" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Testbed'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/testbeds')}>
              Cancel
            </button>
          </div>
        </form>
      </div>

      <div className="card mt-2">
        <h3>Testbed File Format</h3>
        <p>Your testbed YAML file should follow the PyATS testbed format:</p>
        <pre style={{
          background: '#f5f5f5',
          padding: '1rem',
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '0.875rem'
        }}>
{`testbed:
  name: my_testbed
  credentials:
    default:
      username: admin
      password: %ASK{}

devices:
  router1:
    type: router
    os: ios
    platform: cisco_ios
    connections:
      cli:
        protocol: ssh
        ip: 192.168.1.1
        port: 22`}
        </pre>
      </div>
    </div>
  );
}

export default TestbedUpload;
