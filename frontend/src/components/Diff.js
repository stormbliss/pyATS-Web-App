import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Diff() {
  const { snapshot1Id, snapshot2Id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [diffResult, setDiffResult] = useState(null);
  const [error, setError] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');

  useEffect(() => {
    performDiff();
  }, [snapshot1Id, snapshot2Id]);

  const performDiff = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const response = await axios.post(
        '/api/learn/diff',
        {
          snapshot1_id: parseInt(snapshot1Id),
          snapshot2_id: parseInt(snapshot2Id)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setDiffResult(response.data);
      
      // Set first device with differences as selected
      const devicesWithChanges = response.data.common_devices.filter(
        device => response.data.differences[device]?.has_differences
      );
      if (devicesWithChanges.length > 0) {
        setSelectedDevice(devicesWithChanges[0]);
      } else if (response.data.common_devices.length > 0) {
        setSelectedDevice(response.data.common_devices[0]);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to perform diff');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Comparing snapshots...</div>;

  if (error) {
    return (
      <div className="card">
        <div className="alert alert-error">{error}</div>
        <button className="btn mt-2" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  if (!diffResult) return null;

  const deviceDiff = selectedDevice ? diffResult.differences[selectedDevice] : null;

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <h1>Snapshot Comparison</h1>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>

      <div className="card">
        <h3>Comparison Details</h3>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
          <div>
            <h4>Snapshot 1 (Older)</h4>
            <p><strong>Name:</strong> {diffResult.snapshot1.name}</p>
            <p><strong>Date:</strong> {new Date(diffResult.snapshot1.created_at).toLocaleString()}</p>
          </div>
          <div>
            <h4>Snapshot 2 (Newer)</h4>
            <p><strong>Name:</strong> {diffResult.snapshot2.name}</p>
            <p><strong>Date:</strong> {new Date(diffResult.snapshot2.created_at).toLocaleString()}</p>
          </div>
        </div>
        <p className="mt-2"><strong>Feature:</strong> {diffResult.feature}</p>
      </div>

      <div className="card mt-2">
        <h3>Summary</h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
          <div className="card" style={{background: '#f8f9fa', padding: '1rem'}}>
            <p style={{fontSize: '2rem', fontWeight: 'bold', color: '#3498db', margin: 0}}>
              {diffResult.summary.total_devices_compared}
            </p>
            <p style={{color: '#7f8c8d', margin: 0}}>Devices Compared</p>
          </div>
          <div className="card" style={{background: '#f8f9fa', padding: '1rem'}}>
            <p style={{fontSize: '2rem', fontWeight: 'bold', color: '#e74c3c', margin: 0}}>
              {diffResult.summary.devices_with_changes}
            </p>
            <p style={{color: '#7f8c8d', margin: 0}}>Devices with Changes</p>
          </div>
          <div className="card" style={{background: '#f8f9fa', padding: '1rem'}}>
            <p style={{fontSize: '2rem', fontWeight: 'bold', color: '#27ae60', margin: 0}}>
              {diffResult.summary.total_devices_compared - diffResult.summary.devices_with_changes}
            </p>
            <p style={{color: '#7f8c8d', margin: 0}}>Unchanged Devices</p>
          </div>
        </div>

        {diffResult.only_in_snapshot1.length > 0 && (
          <div className="alert alert-error mt-2">
            <strong>Devices only in Snapshot 1:</strong> {diffResult.only_in_snapshot1.join(', ')}
          </div>
        )}

        {diffResult.only_in_snapshot2.length > 0 && (
          <div className="alert alert-error mt-2">
            <strong>Devices only in Snapshot 2:</strong> {diffResult.only_in_snapshot2.join(', ')}
          </div>
        )}
      </div>

      {diffResult.common_devices.length > 0 && (
        <>
          <div className="card mt-2">
            <h3>Device Selection</h3>
            <div className="form-group">
              <label>Select Device to View Differences</label>
              <select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)}>
                {diffResult.common_devices.map(device => (
                  <option key={device} value={device}>
                    {device} {diffResult.differences[device]?.has_differences ? '⚠️ Has Changes' : '✓ No Changes'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {deviceDiff && (
            <div className="card mt-2">
              <h3>Differences for {selectedDevice}</h3>
              
              {!deviceDiff.has_differences ? (
                <div className="alert alert-success">
                  No differences detected for this device.
                </div>
              ) : (
                <>
                  <div className="alert alert-error">
                    Changes detected in this device's {diffResult.feature} state.
                  </div>

                  <div style={{marginTop: '1rem'}}>
                    <h4>Detailed Diff Output</h4>
                    <pre style={{
                      background: '#1e1e1e',
                      color: '#d4d4d4',
                      padding: '1rem',
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontSize: '0.875rem',
                      maxHeight: '600px',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {deviceDiff.diff_output || 'No detailed output available'}
                    </pre>
                  </div>

                  {deviceDiff.added && deviceDiff.added.length > 0 && (
                    <div className="mt-2">
                      <h4 style={{color: '#27ae60'}}>Added Items ({deviceDiff.added.length})</h4>
                      <pre style={{background: '#d4edda', padding: '1rem', borderRadius: '4px', fontSize: '0.875rem'}}>
                        {JSON.stringify(deviceDiff.added, null, 2)}
                      </pre>
                    </div>
                  )}

                  {deviceDiff.removed && deviceDiff.removed.length > 0 && (
                    <div className="mt-2">
                      <h4 style={{color: '#e74c3c'}}>Removed Items ({deviceDiff.removed.length})</h4>
                      <pre style={{background: '#f8d7da', padding: '1rem', borderRadius: '4px', fontSize: '0.875rem'}}>
                        {JSON.stringify(deviceDiff.removed, null, 2)}
                      </pre>
                    </div>
                  )}

                  {deviceDiff.modified && deviceDiff.modified.length > 0 && (
                    <div className="mt-2">
                      <h4 style={{color: '#f39c12'}}>Modified Items ({deviceDiff.modified.length})</h4>
                      <pre style={{background: '#fff3cd', padding: '1rem', borderRadius: '4px', fontSize: '0.875rem'}}>
                        {JSON.stringify(deviceDiff.modified, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      <div className="card mt-2">
        <h3>What am I looking at?</h3>
        <p>
          This diff shows changes in the <strong>{diffResult.feature}</strong> feature between two snapshots.
        </p>
        <ul style={{marginLeft: '1.5rem', lineHeight: '1.8'}}>
          <li><strong style={{color: '#27ae60'}}>Added:</strong> New items present in Snapshot 2 but not in Snapshot 1</li>
          <li><strong style={{color: '#e74c3c'}}>Removed:</strong> Items present in Snapshot 1 but missing in Snapshot 2</li>
          <li><strong style={{color: '#f39c12'}}>Modified:</strong> Items that exist in both but have changed values</li>
        </ul>
        <p className="mt-1">
          Use this information to track configuration changes, verify deployments, or troubleshoot issues.
        </p>
      </div>
    </div>
  );
}

export default Diff;
