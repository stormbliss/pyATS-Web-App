# PyATS Web Application

A modern, web-based interface for Cisco pyATS network automation framework. Transform complex CLI workflows into an intuitive web experience for network testing, validation, and state management.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.8%2B-blue)](https://www.python.org/)
[![Platform](https://img.shields.io/badge/platform-Ubuntu%2020.04%2B-orange)](https://ubuntu.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org/)

---

## 🎯 Features

### Core Capabilities

- **📁 Testbed Management**: Upload, validate, and generate PyATS testbed files with built-in validation
- **🔌 Device Connectivity Testing**: Test connections to network devices with detailed status reporting and timing metrics
- **⚡ Command Execution**: Run operational commands across devices with real-time output capture
- **📸 Network State Capture (Learn)**: Snapshot network state using Genie Learn - supports 15+ features including config, BGP, OSPF, interfaces, and more
- **🔍 Configuration Diff**: Compare snapshots to detect changes, drift, and validate deployments
- **🎨 Modern Web UI**: Clean, responsive React interface - no more CLI-only workflows

### Genie Learn Features

Capture operational state for comprehensive network analysis:

| Feature | Description |
|---------|-------------|
| `config` | Complete device configuration |
| `interface` | Interface status, stats, and counters |
| `platform` | Hardware and software information |
| `routing` | Routing table and protocols |
| `bgp` | BGP neighbors, prefixes, and attributes |
| `ospf` | OSPF topology and neighbor relationships |
| `vrf` | VRF configurations and route targets |
| `vlan` | VLAN information and assignments |
| `arp` | ARP table entries |
| `mac` | MAC address table |
| `acl` | Access control lists |
| Plus: `static_routing`, `hsrp`, `vxlan`, `lisp`, and more... |

### Diff Capabilities

- **Pre/Post Change Validation**: Capture before and after states to verify changes
- **Configuration Drift Detection**: Identify unauthorized or unexpected changes
- **Visual Comparison**: Color-coded diff output showing added (green), removed (red), and modified (yellow) items
- **Device-by-Device Analysis**: Compare states across individual devices or entire network
- **Detailed Reporting**: Export diff results for documentation and compliance

---

## 🚀 Quick Start

### System Requirements

- **Operating System**: Ubuntu 20.04, 22.04, or 24.04 LTS
- **Memory**: Minimum 2GB RAM (4GB recommended)
- **Storage**: 5GB free disk space
- **Network**: Internet connection for package downloads
- **Access**: Root/sudo privileges

### Installation (One Command)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/pyats-webapp.git
cd pyats-webapp

# Run the automated deployment script
chmod +x deploy.sh
sudo ./deploy.sh
```

**Installation time**: 5-10 minutes (depending on internet speed)

The deployment script automatically:
- ✅ Installs all system dependencies (Python, Node.js, Nginx, SSH client)
- ✅ Creates dedicated application user
- ✅ Sets up Python virtual environment
- ✅ Installs PyATS, Genie, and all Python packages
- ✅ Builds React frontend
- ✅ Configures Nginx reverse proxy
- ✅ Creates systemd service (auto-start on boot)
- ✅ Initializes SQLite database with default user

### First Access

After installation completes:

```
🌐 URL: http://YOUR_SERVER_IP
👤 Username: admin
🔑 Password: admin123
```

**⚠️ IMPORTANT**: Change the default password immediately after first login!

---

## 📖 Usage Guide

### 1. Generate a Testbed Template

Navigate to: **Dashboard → Testbeds → Generate Template**

1. Select your device type (Cisco IOS, IOS-XE, IOS-XR, NX-OS, JunOS, etc.)
2. Enter device details (hostname, IP, username)
3. Choose connection protocol (SSH/Telnet)
4. Download the generated YAML template

### 2. Upload Your Testbed

Navigate to: **Testbeds → Upload Testbed**

1. Select your testbed YAML file
2. System automatically validates structure
3. View validation results and any errors
4. Testbed is stored and ready to use

### 3. Test Device Connectivity

Navigate to: **Testbeds → [Select Testbed] → Devices**

1. Click **Test Connectivity**
2. View real-time connection attempts
3. See success/failure status per device
4. Review connection timing and error messages

### 4. Execute Commands

From the Device Manager:

1. Select a device from your testbed
2. Enter operational command (e.g., `show version`, `show ip bgp summary`)
3. Click **Execute Command**
4. View formatted output in real-time

### 5. Capture Network State (Learn)

Navigate to: **Devices → Learn & Diff**

1. Select feature to learn (config, bgp, ospf, interface, etc.)
2. Click **Learn State**
3. Wait for snapshot to complete
4. Snapshot is stored with timestamp

**Use cases**:
- Daily configuration backups
- Pre-change baseline capture
- Network documentation
- Troubleshooting snapshots

### 6. Compare Snapshots (Diff)

From the Learn & Diff page:

1. View your snapshot history
2. Click **Diff with Prev** to compare with previous snapshot
3. Review detailed comparison:
   - Added items (new configurations/neighbors/routes)
   - Removed items (deleted configurations/neighbors/routes)
   - Modified items (changed values)
4. Analyze per-device differences

**Use cases**:
- Validate deployment success
- Detect configuration drift
- Troubleshoot unexpected changes
- Compliance verification

---

## 💡 Real-World Use Cases

### Scenario 1: Pre-Change Validation

```
1. Learn baseline → Select 'bgp' feature → Snapshot: bgp_baseline
2. Make changes → Add new BGP neighbor
3. Learn new state → Snapshot: bgp_after_change  
4. Compare → View diff to verify only expected changes occurred
5. Document → Export diff for change record
```

### Scenario 2: Configuration Drift Detection

```
1. Weekly baseline → Every Monday, learn 'config' feature
2. Compare snapshots → Diff current week vs. previous week
3. Identify changes → Review what changed and by whom
4. Remediate → Fix unauthorized changes
5. Report → Generate compliance report
```

### Scenario 3: MPLS VPN Troubleshooting

```
1. Customer reports connectivity issue
2. Learn VRF state → Capture current VRF configuration
3. Learn routing → Capture routing table
4. Compare with working snapshot → Identify missing routes/neighbors
5. Fix and verify → Learn again, confirm resolution
```

### Scenario 4: Network Documentation

```
1. Capture all features → config, platform, interface, routing
2. Store snapshots → Maintain historical records
3. Generate reports → Use for runbooks and documentation
4. Onboarding → New engineers review snapshots to understand network
```

---

## 🏗️ Architecture

```
┌─────────────────┐
│  React Frontend │  (Port 80 via Nginx)
└────────┬────────┘
         │ HTTP/REST
┌────────▼────────┐
│  FastAPI Backend│  (Port 8000)
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
┌───▼──┐ ┌───▼──┐  ┌───▼──┐  ┌───▼─────┐
│PyATS │ │Genie │  │SQLite│  │Unicon   │
│Loader│ │Learn │  │  DB  │  │(SSH/Tel)│
└──────┘ └──────┘  └──────┘  └─────────┘
                                   │
                        ┌──────────┴──────────┐
                        │                     │
                  ┌─────▼─────┐        ┌─────▼─────┐
                  │  Cisco    │        │  Juniper  │
                  │  Devices  │        │  Devices  │
                  └───────────┘        └───────────┘
```

### Technology Stack

**Backend**:
- FastAPI - Modern Python web framework
- PyATS/Genie - Network automation and testing
- Unicon - Multi-vendor device connectivity
- SQLAlchemy - Database ORM
- SQLite - Embedded database
- Uvicorn - ASGI server

**Frontend**:
- React 18 - UI library
- React Router - Navigation
- Axios - HTTP client
- Modern CSS3 - Styling

**Infrastructure**:
- Nginx - Reverse proxy and static file serving
- Systemd - Service management
- Ubuntu 20.04+ - Operating system

---

## 📂 Project Structure

```
pyats-webapp/
├── backend/
│   ├── app/
│   │   ├── api/              # REST API endpoints
│   │   │   ├── auth.py       # Authentication
│   │   │   ├── testbed.py    # Testbed management
│   │   │   ├── devices.py    # Device operations
│   │   │   ├── jobs.py       # Job management
│   │   │   └── learn.py      # Learn & Diff features
│   │   ├── core/             # Core configuration
│   │   │   ├── config.py     # App settings
│   │   │   ├── database.py   # DB connection
│   │   │   └── init_db.py    # DB initialization
│   │   ├── models/           # Database models
│   │   │   └── database.py   # SQLAlchemy models
│   │   ├── services/         # Business logic
│   │   │   └── testbed_validator.py
│   │   └── main.py           # FastAPI application
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Testbeds.js
│   │   │   ├── TestbedUpload.js
│   │   │   ├── TestbedGenerator.js
│   │   │   ├── DeviceManager.js
│   │   │   ├── Learn.js
│   │   │   └── Diff.js
│   │   ├── App.js            # Main app component
│   │   ├── App.css           # Styling
│   │   └── index.js          # Entry point
│   └── package.json          # Node dependencies
├── deploy.sh                 # Automated deployment script
├── README.md                 # This file
├── LICENSE                   # MIT License
└── .gitignore               # Git ignore rules
```

---

## 🔐 Security

### Authentication
- JWT-based token authentication
- SHA256 password hashing
- Token expiration (24 hours default)
- Secure session management

### Production Recommendations

1. **Enable HTTPS**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

2. **Change Default Credentials**: Immediately after first login

3. **Update Secret Key**: Generate strong secret in `.env` file
   ```bash
   openssl rand -hex 32
   ```

4. **Configure Firewall**:
   ```bash
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   sudo ufw enable
   ```

5. **Secure Device Credentials**: Use credential vaults (HashiCorp Vault, AWS Secrets Manager) in production

6. **Regular Updates**: Keep system packages and dependencies updated

---

## 📊 Supported Vendors & Platforms

### Full Support ✅
- **Cisco IOS** - Routers and switches
- **Cisco IOS-XE** - ASR, ISR, Catalyst 9000 series
- **Cisco IOS-XR** - CRS, ASR 9000, NCS series
- **Cisco NX-OS** - Nexus switches (all series)
- **Juniper JunOS** - All JunOS devices

### Partial Support ⚠️
- **Arista EOS** - Basic operations supported
- **Cisco ASA** - Firewall operations
- **HP/HPE** - Limited parser coverage

### Extensible 🔧
- Custom Genie parsers can be added
- Multi-vendor support via Unicon
- Community contributions welcome

---

## 🛠️ Service Management

```bash
# Check status
sudo systemctl status pyats-webapp

# Start service
sudo systemctl start pyats-webapp

# Stop service
sudo systemctl stop pyats-webapp

# Restart service
sudo systemctl restart pyats-webapp

# View logs
sudo journalctl -u pyats-webapp -f

# Enable auto-start on boot (already configured)
sudo systemctl enable pyats-webapp
```

---

## 🔧 Troubleshooting

### SSH Command Not Available

**Symptom**: "'ssh' command not available" error during connectivity tests

**Solution**:
```bash
sudo apt install -y openssh-client sshpass
sudo systemctl restart pyats-webapp
```

### Service Won't Start

**Check logs**:
```bash
sudo journalctl -u pyats-webapp -n 50
```

**Common issues**:
- Port 8000 already in use
- Missing Python dependencies
- Database initialization failed

### Database Issues

**Reinitialize database**:
```bash
cd /opt/pyats-webapp/backend
source venv/bin/activate
rm -f data/pyats.db
python -m app.core.init_db
```

### Can't Access Web Interface

**Verify services**:
```bash
systemctl status pyats-webapp
systemctl status nginx
```

**Check ports**:
```bash
sudo netstat -tlnp | grep -E '(80|8000)'
```

---

## 🗺️ Roadmap

### Planned Features

- [ ] **Multi-user Support & RBAC** - Team collaboration with role-based access
- [ ] **Scheduled Jobs** - Automated snapshots and backups
- [ ] **Configuration Backup & Versioning** - Git integration for config tracking
- [ ] **Advanced Dashboards** - Network topology visualization and metrics
- [ ] **MPLS VPN Management** - VRF visualization and PE-CE monitoring
- [ ] **Webhook Integrations** - Slack, Teams, PagerDuty notifications
- [ ] **Custom Parser Upload** - Support for user-defined Genie parsers
- [ ] **Change Management Workflow** - Approval process and validation
- [ ] **Reporting Engine** - PDF/Excel report generation
- [ ] **API Key Management** - External integration support

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

**Backend**:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend**:
```bash
cd frontend
npm install
npm start
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Cisco PyATS](https://developer.cisco.com/pyats/) - Network testing framework
- [Genie](https://developer.cisco.com/docs/genie-docs/) - Network device parsing library
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://reactjs.org/) - Frontend UI library
- The network automation community for inspiration and support

---

## 📧 Contact & Support

**Author**: Kwame - Network Engineer, Ghana

- **LinkedIn**: [Your LinkedIn Profile](https://linkedin.com/in/your-profile)
- **GitHub**: [@YourUsername](https://github.com/YourUsername)
- **Issues**: [Report bugs or request features](https://github.com/YourUsername/pyats-webapp/issues)

---

## ⭐ Show Your Support

If you find this project useful, please consider:
- ⭐ Starring the repository
- 🍴 Forking for your own use
- 📢 Sharing with colleagues
- 🐛 Reporting issues
- 💡 Suggesting features
- 🤝 Contributing code

---

## 📸 Screenshots

*Coming soon - Add screenshots of your application in action*

---

**Built with ❤️ for the network automation community**

*Making network operations simpler, one automation at a time.*
