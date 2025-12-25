from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
class Testbed(Base):
    __tablename__ = "testbeds"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text)
    filename = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    is_valid = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))
    
    jobs = relationship("Job", back_populates="testbed")
    snapshots = relationship("Snapshot", back_populates="testbed")

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    job_type = Column(String, nullable=False)  # connectivity_test, command, config, etc.
    testbed_id = Column(Integer, ForeignKey("testbeds.id"))
    status = Column(String, default="pending")  # pending, running, completed, failed
    command = Column(Text)
    result = Column(Text)
    error = Column(Text)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))
    
    testbed = relationship("Testbed", back_populates="jobs")

class Snapshot(Base):
    __tablename__ = "snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    testbed_id = Column(Integer, ForeignKey("testbeds.id"), nullable=False)
    feature = Column(String, nullable=False)  # config, interface, bgp, ospf, etc.
    filepath = Column(String, nullable=False)  # Path to JSON snapshot file
    device_count = Column(Integer, default=0)
    devices = Column(Text)  # JSON list of device names
    has_errors = Column(Boolean, default=False)
    errors = Column(Text)  # JSON dict of errors by device
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))
    
    testbed = relationship("Testbed", back_populates="snapshots")
