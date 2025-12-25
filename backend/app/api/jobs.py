from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models.database import Job, Testbed, User
from app.api.auth import get_current_user

router = APIRouter()

class JobResponse(BaseModel):
    id: int
    name: str
    job_type: str
    status: str
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class JobCreate(BaseModel):
    name: str
    job_type: str
    testbed_id: int
    command: Optional[str] = None

@router.get("/", response_model=List[JobResponse])
async def list_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all jobs"""
    jobs = db.query(Job).order_by(Job.created_at.desc()).limit(50).all()
    return jobs

@router.post("/", response_model=JobResponse)
async def create_job(
    job: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new job"""
    
    # Verify testbed exists
    testbed = db.query(Testbed).filter(Testbed.id == job.testbed_id).first()
    if not testbed:
        raise HTTPException(status_code=404, detail="Testbed not found")
    
    new_job = Job(
        name=job.name,
        job_type=job.job_type,
        testbed_id=job.testbed_id,
        command=job.command,
        status="pending",
        created_by=current_user.id
    )
    
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    
    return new_job

@router.get("/{job_id}")
async def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get job details"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {
        "id": job.id,
        "name": job.name,
        "job_type": job.job_type,
        "status": job.status,
        "command": job.command,
        "result": job.result,
        "error": job.error,
        "created_at": job.created_at,
        "started_at": job.started_at,
        "completed_at": job.completed_at
    }

@router.delete("/{job_id}")
async def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a job"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    db.delete(job)
    db.commit()
    
    return {"message": "Job deleted successfully"}
