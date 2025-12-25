from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import yaml
import os
from pyats.topology import loader
from app.core.database import get_db
from app.core.config import settings
from app.models.database import Testbed, User
from app.api.auth import get_current_user

router = APIRouter()

class DeviceInfo(BaseModel):
    name: str
    hostname: str
    platform: str
    os: str
    status: str = "unknown"

class ConnectivityTestResult(BaseModel):
    device: str
    status: str
    message: str
    connection_time: Optional[float] = None

@router.get("/testbed/{testbed_id}/devices", response_model=List[DeviceInfo])
async def list_devices(
    testbed_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all devices in a testbed"""
    testbed = db.query(Testbed).filter(Testbed.id == testbed_id).first()
    if not testbed:
        raise HTTPException(status_code=404, detail="Testbed not found")
    
    testbed_data = yaml.safe_load(testbed.content)
    devices = []
    
    for device_name, device_config in testbed_data.get('devices', {}).items():
        connections = device_config.get('connections', {})
        primary_conn = list(connections.values())[0] if connections else {}
        
        devices.append({
            "name": device_name,
            "hostname": primary_conn.get('ip', 'N/A'),
            "platform": device_config.get('platform', 'unknown'),
            "os": device_config.get('os', 'unknown'),
            "status": "unknown"
        })
    
    return devices

@router.post("/testbed/{testbed_id}/test-connectivity")
async def test_connectivity(
    testbed_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Test connectivity to all devices in testbed"""
    testbed = db.query(Testbed).filter(Testbed.id == testbed_id).first()
    if not testbed:
        raise HTTPException(status_code=404, detail="Testbed not found")
    
    # Save testbed to temporary file
    temp_file = os.path.join(settings.TESTBED_DIR, f"temp_{testbed.id}.yaml")
    with open(temp_file, 'w') as f:
        f.write(testbed.content)
    
    results = []
    
    try:
        # Load testbed
        tb = loader.load(temp_file)
        
        # Test each device
        for device_name, device in tb.devices.items():
            try:
                import time
                start_time = time.time()
                
                # Attempt to connect
                device.connect(log_stdout=False, learn_hostname=True)
                
                connection_time = time.time() - start_time
                
                results.append({
                    "device": device_name,
                    "status": "success",
                    "message": f"Connected successfully in {connection_time:.2f}s",
                    "connection_time": connection_time
                })
                
                # Disconnect
                device.disconnect()
                
            except Exception as e:
                results.append({
                    "device": device_name,
                    "status": "failed",
                    "message": str(e),
                    "connection_time": None
                })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error testing connectivity: {str(e)}")
    
    finally:
        # Clean up temp file
        if os.path.exists(temp_file):
            os.remove(temp_file)
    
    return {"results": results}

@router.post("/testbed/{testbed_id}/device/{device_name}/execute")
async def execute_command(
    testbed_id: int,
    device_name: str,
    command: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Execute a command on a specific device"""
    testbed = db.query(Testbed).filter(Testbed.id == testbed_id).first()
    if not testbed:
        raise HTTPException(status_code=404, detail="Testbed not found")
    
    # Save testbed to temporary file
    temp_file = os.path.join(settings.TESTBED_DIR, f"temp_{testbed.id}.yaml")
    with open(temp_file, 'w') as f:
        f.write(testbed.content)
    
    try:
        # Load testbed
        tb = loader.load(temp_file)
        
        if device_name not in tb.devices:
            raise HTTPException(status_code=404, detail=f"Device '{device_name}' not found in testbed")
        
        device = tb.devices[device_name]
        
        # Connect to device
        device.connect(log_stdout=False)
        
        # Execute command
        output = device.execute(command)
        
        # Disconnect
        device.disconnect()
        
        return {
            "device": device_name,
            "command": command,
            "output": output,
            "status": "success"
        }
    
    except Exception as e:
        return {
            "device": device_name,
            "command": command,
            "output": None,
            "status": "failed",
            "error": str(e)
        }
    
    finally:
        # Clean up temp file
        if os.path.exists(temp_file):
            os.remove(temp_file)
