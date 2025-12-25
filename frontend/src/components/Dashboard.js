import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard() {
  const [stats, setStats] = useState({
    testbeds: 0,
    jobs: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    try {
      const testbedsRes = await axios.get('/api/testbed/', config);
      const jobsRes = await axios.get('/api/jobs/', config);
      
      setStats({
        testbeds: testbedsRes.data.length,
        jobs: jobsRes.data.length
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  return (
    <div>
      <h1 className="mb-2">Dashboard</h1>
      
      <div className="grid">
        <div className="card">
          <h3>Testbeds</h3>
          <p style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#3498db'}}>
            {stats.testbeds}
          </p>
          <a href="/testbeds" className="btn mt-1">Manage Testbeds</a>
        </div>
        
        <div className="card">
          <h3>Jobs</h3>
          <p style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#27ae60'}}>
            {stats.jobs}
          </p>
          <button className="btn mt-1" disabled>View Jobs (Coming Soon)</button>
        </div>
      </div>

      <div className="card mt-2">
        <h2>Quick Start</h2>
        <ol style={{marginLeft: '1.5rem', lineHeight: '2'}}>
          <li>
            <a href="/testbeds/generate" style={{color: '#3498db'}}>Generate a testbed template</a> or 
            <a href="/testbeds/upload" style={{color: '#3498db', marginLeft: '0.5rem'}}>upload an existing testbed</a>
          </li>
          <li>Validate testbed connectivity</li>
          <li>Execute commands on your devices</li>
        </ol>
      </div>

      <div className="card mt-2">
        <h2>About</h2>
        <p>
          PyATS Web App provides a user-friendly interface for managing network automation with PyATS.
          You can upload testbed files, validate device connectivity, and execute commands across your network infrastructure.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
