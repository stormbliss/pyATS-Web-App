import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Learn() {
  const { testbedId } = useParams();
  const navigate = useNavigate();
  const [features, setFeatures] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState('');
  const [snapshots, setSnapshots] = useState([]);
  const [learning, setLearning] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatures();
    fetchSnapshots();
  }, [testbedId]);

  const fetchFeatures = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get('/api/learn/features', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeatures(response.data.features);
      if (response.data.features.length > 0) {
        setSelectedFeature(response.data.features[0]);
      }
    } catch (err) {
      console.error('Error fetching features:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSnapshots = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`/api/learn/testbed/${testbedId}/snapshots`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnapshots(response.data);
    } catch (err) {
      console.error('Error fetching snapshots:', err);
    }
  };

  const handleLearn = async () => {
    setLearning(true);
    setResult(null);
    const token = localStorage.getItem('token');

    try {
      const response = await axios.post(
        `/api/learn/testbed/${testbedId}/learn`,
        { feature: selectedFeature },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(response.data);
      fetchSnapshots(); // Refresh snapshots list
    } catch (err) {
      setResult({
        error: err.response?.data?.detail || 'Learn operation failed'
      });
    } finally {
      setLearning(false);
    }
  };

  const handleDeleteSnapshot = async (snapshotId) => {
    if (!window.confirm('Are you sure you want to delete this snapshot?')) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`/api/learn/snapshot/${snapshotId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSnapshots();
    } catch (err) {
      alert('Failed to delete snapshot');
    }
  };

  const handleViewDiff = (snapshot1Id, snapshot2Id) => {
    navigate(`/diff/${snapshot1Id}/${snapshot2Id}`);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <h1>Learn Device State</h1>
        <button className="btn btn-secondary" onClick={() => navigate(`/devices/${testbedId}`)}>
          Back to Devices
        </button>
      </div>

      <div className="card">
        <h3>Capture Network State</h3>
        <p style={{color: '#7f8c8d', marginBottom: '1rem'}}>
          Use Genie learn to capture the current operational state of your network devices.
          Snapshots can be compared later to detect changes.
        </p>

        <div className="form-group">
          <label>Select Feature to Learn</label>
          <select value={selectedFeature} onChange={(e) => setSelectedFeature(e.target.value)}>
            {features.map(feature => (
              <option key={feature} value={feature}>{feature}</option>
            ))}
          </select>
          <small style={{color: '#7f8c8d', display: 'block', marginTop: '0.5rem'}}>
            Feature determines what information is captured (e.g., config, interfaces, routing)
          </small>
        </div>

        <button 
          className="btn btn-success" 
          onClick={handleLearn}
          disabled={learning || !selectedFeature}
        >
          {learning ? 'Learning...' : 'Learn State'}
        </button>
      </div>

      {result && (
        <div className={`card mt-2 ${result.error ? 'alert alert-error' : 'alert alert-success'}`}>
          {result.error ? (
            <>
              <strong>Error:</strong> {result.error}
            </>
          ) : (
            <>
              <h3>Learn Completed</h3>
              <p><strong>Snapshot:</strong> {result.snapshot_name}</p>
              <p><strong>Feature:</strong> {result.feature}</p>
              <p><strong>Devices:</strong> {result.devices_learned.join(', ')}</p>
              <p><strong>Device Count:</strong> {result.device_count}</p>
              {result.errors && Object.keys(result.errors).length > 0 && (
                <div className="mt-1">
                  <strong>Errors:</strong>
                  <ul style={{marginLeft: '1.5rem', marginTop: '0.5rem'}}>
                    {Object.entries(result.errors).map(([device, error]) => (
                      <li key={device}>{device}: {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="card mt-2">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
          <h3>Snapshots ({snapshots.length})</h3>
          <button 
            className="btn btn-secondary"
            onClick={fetchSnapshots}
          >
            Refresh
          </button>
        </div>

        {snapshots.length === 0 ? (
          <p style={{textAlign: 'center', color: '#7f8c8d', padding: '2rem'}}>
            No snapshots yet. Create one by learning device state above.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Feature</th>
                <th>Devices</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((snapshot, index) => (
                <tr key={snapshot.id}>
                  <td><strong>{snapshot.name}</strong></td>
                  <td>{snapshot.feature}</td>
                  <td>{snapshot.device_count}</td>
                  <td>{new Date(snapshot.created_at).toLocaleString()}</td>
                  <td>
                    {index < snapshots.length - 1 && snapshots[index + 1].feature === snapshot.feature && (
                      <button
                        className="btn btn-secondary"
                        style={{padding: '0.5rem 1rem', marginRight: '0.5rem'}}
                        onClick={() => handleViewDiff(snapshots[index + 1].id, snapshot.id)}
                      >
                        Diff with Prev
                      </button>
                    )}
                    <button
                      className="btn btn-danger"
                      style={{padding: '0.5rem 1rem'}}
                      onClick={() => handleDeleteSnapshot(snapshot.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card mt-2">
        <h3>About Learn Features</h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
          <div>
            <strong>config</strong>
            <p style={{fontSize: '0.875rem', color: '#7f8c8d'}}>Complete device configuration</p>
          </div>
          <div>
            <strong>interface</strong>
            <p style={{fontSize: '0.875rem', color: '#7f8c8d'}}>Interface status and stats</p>
          </div>
          <div>
            <strong>routing</strong>
            <p style={{fontSize: '0.875rem', color: '#7f8c8d'}}>Routing table information</p>
          </div>
          <div>
            <strong>bgp</strong>
            <p style={{fontSize: '0.875rem', color: '#7f8c8d'}}>BGP neighbors and prefixes</p>
          </div>
          <div>
            <strong>ospf</strong>
            <p style={{fontSize: '0.875rem', color: '#7f8c8d'}}>OSPF topology and neighbors</p>
          </div>
          <div>
            <strong>platform</strong>
            <p style={{fontSize: '0.875rem', color: '#7f8c8d'}}>Hardware and software info</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Learn;
