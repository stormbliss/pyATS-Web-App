from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import yaml
import os
import json
from datetime import datetime
from pyats.topology import loader
from genie.libs.parser.utils import get_parser
from genie.utils.diff import Diff
from app.core.database import get_db
from app.core.config import settings
from app.models.database import Testbed, User, Snapshot
from app.api.auth import get_current_user

router = APIRouter()

class LearnRequest(BaseModel):
    feature: str  # e.g., 'config', 'interface', 'ospf', 'bgp', 'routing', 'platform'
    devices: Optional[List[str]] = None  # If None, learn from all devices

class SnapshotResponse(BaseModel):
    id: int
    name: str
    testbed_id: int
    feature: str
    device_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class DiffRequest(BaseModel):
    snapshot1_id: int
    snapshot2_id: int

# Commonly used Genie learn features
LEARN_FEATURES = [
    'config',
    'interface',
    'platform',
    'routing',
    'bgp',
    'ospf',
    'vrf',
    'vlan',
    'arp',
    'mac',
    'acl',
    'static_routing',
    'hsrp',
    'vxlan',
    'lisp'
]

@router.get("/features")
async def list_learn_features(current_user: User = Depends(get_current_user)):
    """List available learn features"""
    return {
        "features": LEARN_FEATURES,
        "description": "Genie learn features for network state capture"
    }

@router.post("/testbed/{testbed_id}/learn")
async def learn_device_state(
    testbed_id: int,
    request: LearnRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Learn device state using Genie
    
    This captures the current operational state of specified feature(s)
    across devices and stores it as a snapshot for later comparison.
    """
    testbed = db.query(Testbed).filter(Testbed.id == testbed_id).first()
    if not testbed:
        raise HTTPException(status_code=404, detail="Testbed not found")
    
    # Validate feature
    if request.feature not in LEARN_FEATURES:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid feature. Available: {', '.join(LEARN_FEATURES)}"
        )
    
    # Save testbed to temporary file
    temp_file = os.path.join(settings.TESTBED_DIR, f"temp_{testbed.id}.yaml")
    with open(temp_file, 'w') as f:
        f.write(testbed.content)
    
    learned_data = {}
    errors = {}
    
    try:
        # Load testbed
        tb = loader.load(temp_file)
        
        # Determine which devices to learn from
        devices_to_learn = request.devices if request.devices else list(tb.devices.keys())
        
        for device_name in devices_to_learn:
            if device_name not in tb.devices:
                errors[device_name] = f"Device not found in testbed"
                continue
                
            device = tb.devices[device_name]
            
            try:
                # Connect to device
                device.connect(log_stdout=False, learn_hostname=True)
                
                # Learn the feature
                learned = device.learn(request.feature)
                
                # Convert to dictionary
                learned_data[device_name] = learned.to_dict() if hasattr(learned, 'to_dict') else learned.info
                
                # Disconnect
                device.disconnect()
                
            except Exception as e:
                errors[device_name] = str(e)
                try:
                    device.disconnect()
                except:
                    pass
        
        # Save snapshot to database
        snapshot_name = f"{request.feature}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        snapshot_path = os.path.join(settings.SNAPSHOTS_DIR, f"{testbed.id}_{snapshot_name}.json")
        
        # Ensure directory exists
        os.makedirs(settings.SNAPSHOTS_DIR, exist_ok=True)
        
        # Save learned data to file
        with open(snapshot_path, 'w') as f:
            json.dump(learned_data, f, indent=2, default=str)
        
        # Create database record
        snapshot = Snapshot(
            name=snapshot_name,
            testbed_id=testbed_id,
            feature=request.feature,
            filepath=snapshot_path,
            device_count=len(learned_data),
            devices=json.dumps(list(learned_data.keys())),
            has_errors=len(errors) > 0,
            errors=json.dumps(errors) if errors else None,
            created_by=current_user.id
        )
        
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)
        
        return {
            "snapshot_id": snapshot.id,
            "snapshot_name": snapshot_name,
            "feature": request.feature,
            "devices_learned": list(learned_data.keys()),
            "device_count": len(learned_data),
            "errors": errors if errors else None,
            "message": "Learning completed successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during learn: {str(e)}")
    
    finally:
        # Clean up temp file
        if os.path.exists(temp_file):
            os.remove(temp_file)

@router.get("/testbed/{testbed_id}/snapshots", response_model=List[SnapshotResponse])
async def list_snapshots(
    testbed_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all snapshots for a testbed"""
    snapshots = db.query(Snapshot).filter(Snapshot.testbed_id == testbed_id).order_by(Snapshot.created_at.desc()).all()
    return snapshots

@router.get("/snapshot/{snapshot_id}")
async def get_snapshot(
    snapshot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get snapshot details and data"""
    snapshot = db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    
    # Load snapshot data
    try:
        with open(snapshot.filepath, 'r') as f:
            data = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading snapshot data: {str(e)}")
    
    return {
        "id": snapshot.id,
        "name": snapshot.name,
        "feature": snapshot.feature,
        "device_count": snapshot.device_count,
        "devices": json.loads(snapshot.devices),
        "created_at": snapshot.created_at,
        "has_errors": snapshot.has_errors,
        "errors": json.loads(snapshot.errors) if snapshot.errors else None,
        "data": data
    }

@router.post("/diff")
async def diff_snapshots(
    request: DiffRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Compare two snapshots and show differences
    
    Uses Genie's Diff utility to highlight configuration or state changes
    between two points in time.
    """
    # Get snapshots
    snapshot1 = db.query(Snapshot).filter(Snapshot.id == request.snapshot1_id).first()
    snapshot2 = db.query(Snapshot).filter(Snapshot.id == request.snapshot2_id).first()
    
    if not snapshot1 or not snapshot2:
        raise HTTPException(status_code=404, detail="One or both snapshots not found")
    
    # Validate snapshots are from same testbed and same feature
    if snapshot1.testbed_id != snapshot2.testbed_id:
        raise HTTPException(status_code=400, detail="Snapshots must be from the same testbed")
    
    if snapshot1.feature != snapshot2.feature:
        raise HTTPException(status_code=400, detail="Snapshots must be of the same feature")
    
    try:
        # Load snapshot data
        with open(snapshot1.filepath, 'r') as f:
            data1 = json.load(f)
        
        with open(snapshot2.filepath, 'r') as f:
            data2 = json.load(f)
        
        # Perform diff for each device
        diff_results = {}
        
        # Get common devices
        devices1 = set(data1.keys())
        devices2 = set(data2.keys())
        common_devices = devices1.intersection(devices2)
        
        for device_name in common_devices:
            diff = Diff(data1[device_name], data2[device_name])
            diff.findDiff()
            
            diff_results[device_name] = {
                "has_differences": len(str(diff)) > 0,
                "diff_output": str(diff),
                "added": diff.added() if hasattr(diff, 'added') else [],
                "removed": diff.removed() if hasattr(diff, 'removed') else [],
                "modified": diff.modified() if hasattr(diff, 'modified') else []
            }
        
        # Report devices only in one snapshot
        only_in_snapshot1 = devices1 - devices2
        only_in_snapshot2 = devices2 - devices1
        
        return {
            "snapshot1": {
                "id": snapshot1.id,
                "name": snapshot1.name,
                "created_at": snapshot1.created_at
            },
            "snapshot2": {
                "id": snapshot2.id,
                "name": snapshot2.name,
                "created_at": snapshot2.created_at
            },
            "feature": snapshot1.feature,
            "common_devices": list(common_devices),
            "only_in_snapshot1": list(only_in_snapshot1),
            "only_in_snapshot2": list(only_in_snapshot2),
            "differences": diff_results,
            "summary": {
                "total_devices_compared": len(common_devices),
                "devices_with_changes": sum(1 for d in diff_results.values() if d["has_differences"])
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error performing diff: {str(e)}")

@router.delete("/snapshot/{snapshot_id}")
async def delete_snapshot(
    snapshot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a snapshot"""
    snapshot = db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    
    # Delete file
    if os.path.exists(snapshot.filepath):
        os.remove(snapshot.filepath)
    
    db.delete(snapshot)
    db.commit()
    
    return {"message": "Snapshot deleted successfully"}
