import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Testbeds() {
  const navigate = useNavigate();
  const [testbeds, setTestbeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTestbeds();
  }, []);

  const fetchTestbeds = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get('/api/testbed/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTestbeds(response.data);
    } catch (err) {
      setError('Failed to fetch testbeds');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testbed?')) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`/api/testbed/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTestbeds();
    } catch (err) {
      alert('Failed to delete testbed');
    }
  };

  const handleViewDevices = (testbedId) => {
    navigate(`/devices/${testbedId}`);
  };

  if (loading) return <div className="loading">Loading testbeds...</div>;

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <h1>Testbeds</h1>
        <div>
          <button className="btn" onClick={() => navigate('/testbeds/generate')}>
            Generate Template
          </button>
          <button className="btn btn-success" onClick={() => navigate('/testbeds/upload')} style={{marginLeft: '1rem'}}>
            Upload Testbed
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {testbeds.length === 0 ? (
        <div className="card text-center">
          <h3>No testbeds found</h3>
          <p>Get started by uploading a testbed or generating a template.</p>
        </div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Valid</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {testbeds.map(testbed => (
                <tr key={testbed.id}>
                  <td><strong>{testbed.name}</strong></td>
                  <td>{testbed.description || '-'}</td>
                  <td>
                    <span className={`status ${testbed.is_valid ? 'status-success' : 'status-error'}`}>
                      {testbed.is_valid ? 'Valid' : 'Invalid'}
                    </span>
                  </td>
                  <td>{new Date(testbed.created_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="btn btn-secondary" 
                      style={{marginRight: '0.5rem', padding: '0.5rem 1rem'}}
                      onClick={() => handleViewDevices(testbed.id)}
                    >
                      Devices
                    </button>
                    <button 
                      className="btn btn-danger" 
                      style={{padding: '0.5rem 1rem'}}
                      onClick={() => handleDelete(testbed.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Testbeds;
