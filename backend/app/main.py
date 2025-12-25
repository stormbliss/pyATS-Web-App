from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import testbed, devices, jobs, auth, learn
from app.core.config import settings

app = FastAPI(
    title="PyATS Web Application",
    description="Web interface for PyATS network automation",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(testbed.router, prefix="/api/testbed", tags=["Testbed"])
app.include_router(devices.router, prefix="/api/devices", tags=["Devices"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(learn.router, prefix="/api/learn", tags=["Learn & Diff"])

@app.get("/")
async def root():
    return {
        "message": "PyATS Web Application API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
