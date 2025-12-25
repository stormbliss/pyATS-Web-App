import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function TestbedGenerator() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    device_name: 'router1',
    hostname: '192.168.1.1',
    device_type: 'ios',
    username: 'admin',
    protocol: 'ssh'
  });
  const [template, setTemplate] = useState('');
  const [loading, setLoading] = useState(false);

  const deviceTypes = [
    { value: 'ios', label: 'Cisco IOS' },
    { value: 'iosxe', label: 'Cisco IOS-XE' },
    { value: 'iosxr', label: 'Cisco IOS-XR' },
    { value: 'nxos', label: 'Cisco NX-OS' },
    { value: 'junos', label: 'Juniper JunOS' },
    { value: 'asa', label: 'Cisco ASA' },
    { value: 'arista', label: 'Arista EOS' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGenerate = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await axios.post('/api/testbed/generate-template', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplate(response.data.template);
    } catch (err) {
      alert('Failed to generate template');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([template], { type: 'text/yaml' });
    element.href = URL.createObjectURL(file);
    element.download = `testbed_${formData.device_name}.yaml`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(template);
    alert('Template copied to clipboard!');
  };

  return (
    <div>
      <h1 className="mb-2">Generate Testbed Template</h1>

      <div className="card">
        <h3>Device Configuration</h3>
        
        <div className="form-group">
          <label>Device Name</label>
          <input
            type="text"
            name="device_name"
            value={formData.device_name}
            onChange={handleChange}
            placeholder="router1"
          />
        </div>

        <div className="form-group">
          <label>Hostname / IP Address</label>
          <input
            type="text"
            name="hostname"
            value={formData.hostname}
            onChange={handleChange}
            placeholder="192.168.1.1"
          />
        </div>

        <div className="form-group">
          <label>Device Type</label>
          <select name="device_type" value={formData.device_type} onChange={handleChange}>
            {deviceTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="admin"
          />
        </div>

        <div className="form-group">
          <label>Protocol</label>
          <select name="protocol" value={formData.protocol} onChange={handleChange}>
            <option value="ssh">SSH</option>
            <option value="telnet">Telnet</option>
          </select>
        </div>

        <div style={{display: 'flex', gap: '1rem'}}>
          <button className="btn btn-success" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Template'}
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/testbeds')}>
            Back to Testbeds
          </button>
        </div>
      </div>

      {template && (
        <div className="card mt-2">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
            <h3>Generated Template</h3>
            <div>
              <button className="btn btn-secondary" onClick={handleCopy} style={{marginRight: '0.5rem'}}>
                Copy to Clipboard
              </button>
              <button className="btn btn-success" onClick={handleDownload}>
                Download YAML
              </button>
            </div>
          </div>
          <textarea
            value={template}
            readOnly
            style={{
              width: '100%',
              minHeight: '400px',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              padding: '1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f8f9fa'
            }}
          />
        </div>
      )}
    </div>
  );
}

export default TestbedGenerator;
