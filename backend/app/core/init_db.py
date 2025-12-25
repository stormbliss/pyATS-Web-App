from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.database import Base, User
from app.core.config import settings
import os
import hashlib

def hash_password(password: str) -> str:
    """Simple SHA256 password hashing as fallback"""
    return hashlib.sha256(password.encode()).hexdigest()

def init_database():
    """Initialize database and create default admin user"""
    
    # Ensure data directory exists
    os.makedirs("./data", exist_ok=True)
    
    # Create engine and tables
    engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    
    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Check if admin user exists
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            # Create default admin user with simple hash
            admin = User(
                username="admin",
                email="admin@localhost",
                hashed_password=hash_password("admin123"),
                is_active=True,
                is_admin=True
            )
            db.add(admin)
            db.commit()
            print("Default admin user created (username: admin, password: admin123)")
        else:
            print("Admin user already exists")
            
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
