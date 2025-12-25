import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function DeviceManager() {
  const { testbedId } = useParams();
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [command, setCommand] = useState('');
  const [commandOutput, setCommandOutput] = useState(null);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, [testbedId]);

  const fetchDevices = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`/api/devices/testbed/${testbedId}/devices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDevices(response.data);
      if (response.data.length > 0) {
        setSelectedDevice(response.data[0].name);
      }
    } catch (err) {
      alert('Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnectivity = async () => {
    setTesting(true);
    setTestResults([]);
    const token = localStorage.getItem('token');

    try {
      const response = await axios.post(
        `/api/devices/testbed/${testbedId}/test-connectivity`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTestResults(response.data.results);
    } catch (err) {
      alert('Connectivity test failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setTesting(false);
    }
  };

  const handleExecuteCommand = async (e) => {
    e.preventDefault();
    if (!command.trim()) return;

    setExecuting(true);
    setCommandOutput(null);
    const token = localStorage.getItem('token');

    try {
      const response = await axios.post(
        `/api/devices/testbed/${testbedId}/device/${selectedDevice}/execute?command=${encodeURIComponent(command)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCommandOutput(response.data);
    } catch (err) {
      setCommandOutput({
        status: 'failed',
        error: err.response?.data?.detail || err.message
      });
    } finally {
      setExecuting(false);
    }
  };

  if (loading) return <div className="loading">Loading devices...</div>;

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <h1>Device Manager</h1>
        <div>
          <button 
            className="btn btn-success" 
            onClick={() => navigate(`/learn/${testbedId}`)}
            style={{marginRight: '1rem'}}
          >
            Learn & Diff
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/testbeds')}>
            Back to Testbeds
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Devices ({devices.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Hostname</th>
              <th>Platform</th>
              <th>OS</th>
            </tr>
          </thead>
          <tbody>
            {devices.map(device => (
              <tr key={device.name}>
                <td><strong>{device.name}</strong></td>
                <td>{device.hostname}</td>
                <td>{device.platform}</td>
                <td>{device.os}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <button 
          className="btn btn-success mt-2" 
          onClick={handleTestConnectivity}
          disabled={testing}
        >
          {testing ? 'Testing Connectivity...' : 'Test Connectivity'}
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="card mt-2">
          <h3>Connectivity Test Results</h3>
          <table>
            <thead>
              <tr>
                <th>Device</th>
                <th>Status</th>
                <th>Message</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {testResults.map(result => (
                <tr key={result.device}>
                  <td><strong>{result.device}</strong></td>
                  <td>
                    <span className={`status ${result.status === 'success' ? 'status-success' : 'status-error'}`}>
                      {result.status}
                    </span>
                  </td>
                  <td>{result.message}</td>
                  <td>{result.connection_time ? `${result.connection_time.toFixed(2)}s` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card mt-2">
        <h3>Execute Command</h3>
        <form onSubmit={handleExecuteCommand}>
          <div className="form-group">
            <label>Select Device</label>
            <select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)}>
              {devices.map(device => (
                <option key={device.name} value={device.name}>{device.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Command</label>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="e.g., show version"
            />
          </div>

          <button type="submit" className="btn btn-success" disabled={executing || !selectedDevice}>
            {executing ? 'Executing...' : 'Execute Command'}
          </button>
        </form>
      </div>

      {commandOutput && (
        <div className="card mt-2">
          <h3>Command Output</h3>
          <div className={`alert ${commandOutput.status === 'success' ? 'alert-success' : 'alert-error'}`}>
            <strong>Device:</strong> {commandOutput.device}<br/>
            <strong>Command:</strong> {commandOutput.command}<br/>
            <strong>Status:</strong> {commandOutput.status}
          </div>
          {commandOutput.output && (
            <pre style={{
              background: '#1e1e1e',
              color: '#d4d4d4',
              padding: '1rem',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.875rem',
              maxHeight: '500px'
            }}>
              {commandOutput.output}
            </pre>
          )}
          {commandOutput.error && (
            <div className="alert alert-error mt-1">
              <strong>Error:</strong> {commandOutput.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DeviceManager;
