from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import yaml
import os
from datetime import datetime
from app.core.database import get_db
from app.core.config import settings
from app.models.database import Testbed, User
from app.api.auth import get_current_user
from app.services.testbed_validator import validate_testbed

router = APIRouter()

class TestbedResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    filename: str
    is_valid: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class TestbedCreate(BaseModel):
    name: str
    description: Optional[str] = None
    content: str

class TemplateRequest(BaseModel):
    device_name: str = "router1"
    hostname: str = "192.168.1.1"
    device_type: str = "ios"
    username: str = "admin"
    protocol: str = "ssh"

@router.get("/", response_model=List[TestbedResponse])
async def list_testbeds(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all testbeds"""
    testbeds = db.query(Testbed).all()
    return testbeds

@router.post("/upload")
async def upload_testbed(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload and validate a testbed YAML file"""
    
    # Read file content
    content = await file.read()
    content_str = content.decode('utf-8')
    
    # Validate YAML syntax
    try:
        testbed_data = yaml.safe_load(content_str)
    except yaml.YAMLError as e:
        raise HTTPException(status_code=400, detail=f"Invalid YAML syntax: {str(e)}")
    
    # Validate testbed structure
    is_valid, errors = validate_testbed(testbed_data)
    
    # Check if testbed name already exists
    testbed_name = testbed_data.get('testbed', {}).get('name', file.filename.replace('.yaml', ''))
    existing = db.query(Testbed).filter(Testbed.name == testbed_name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Testbed '{testbed_name}' already exists")
    
    # Save testbed to database
    testbed = Testbed(
        name=testbed_name,
        description=testbed_data.get('testbed', {}).get('description', ''),
        filename=file.filename,
        content=content_str,
        is_valid=is_valid,
        created_by=current_user.id
    )
    db.add(testbed)
    db.commit()
    db.refresh(testbed)
    
    # Save file to disk
    filepath = os.path.join(settings.TESTBED_DIR, f"{testbed.id}_{file.filename}")
    with open(filepath, 'w') as f:
        f.write(content_str)
    
    return {
        "id": testbed.id,
        "name": testbed.name,
        "is_valid": is_valid,
        "errors": errors if not is_valid else [],
        "message": "Testbed uploaded successfully" if is_valid else "Testbed uploaded with validation errors"
    }

@router.post("/generate-template")
async def generate_template(
    request: TemplateRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate a testbed template"""
    
    # Device type mapping
    device_types = {
        "ios": "cisco_ios",
        "iosxe": "cisco_iosxe",
        "iosxr": "cisco_iosxr",
        "nxos": "cisco_nxos",
        "junos": "juniper_junos",
        "asa": "cisco_asa",
        "arista": "arista_eos"
    }
    
    platform = device_types.get(request.device_type.lower(), "cisco_ios")
    
    template = {
        "testbed": {
            "name": f"testbed_{request.device_name}",
            "credentials": {
                "default": {
                    "username": request.username,
                    "password": "%ASK{}"
                }
            }
        },
        "devices": {
            request.device_name: {
                "type": request.device_type.upper(),
                "os": request.device_type.lower(),
                "platform": platform,
                "credentials": {
                    "default": {
                        "username": request.username,
                        "password": "%ASK{}"
                    }
                },
                "connections": {
                    "cli": {
                        "protocol": request.protocol,
                        "ip": request.hostname,
                        "port": 22 if request.protocol == "ssh" else 23
                    }
                }
            }
        }
    }
    
    yaml_content = yaml.dump(template, default_flow_style=False, sort_keys=False)
    
    return {
        "template": yaml_content,
        "filename": f"testbed_{request.device_name}.yaml"
    }

@router.get("/{testbed_id}")
async def get_testbed(
    testbed_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get testbed details"""
    testbed = db.query(Testbed).filter(Testbed.id == testbed_id).first()
    if not testbed:
        raise HTTPException(status_code=404, detail="Testbed not found")
    
    return {
        "id": testbed.id,
        "name": testbed.name,
        "description": testbed.description,
        "content": testbed.content,
        "is_valid": testbed.is_valid,
        "created_at": testbed.created_at
    }

@router.delete("/{testbed_id}")
async def delete_testbed(
    testbed_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a testbed"""
    testbed = db.query(Testbed).filter(Testbed.id == testbed_id).first()
    if not testbed:
        raise HTTPException(status_code=404, detail="Testbed not found")
    
    # Delete file from disk
    filepath = os.path.join(settings.TESTBED_DIR, f"{testbed.id}_{testbed.filename}")
    if os.path.exists(filepath):
        os.remove(filepath)
    
    db.delete(testbed)
    db.commit()
    
    return {"message": "Testbed deleted successfully"}
