from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import pytz
import jwt
import hashlib
from passlib.context import CryptContext
from io import StringIO
from fastapi.responses import StreamingResponse
from mangum import Mangum
from contextlib import asynccontextmanager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection with optimized settings for Vercel serverless
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')

# Singleton pattern for database connection (2025 best practice)
class DatabaseConnection:
    _instance = None
    _client = None
    _db = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseConnection, cls).__new__(cls)
        return cls._instance
    
    def get_client(self):
        if self._client is None:
            # Optimized connection settings for serverless (2025 best practices)
            self._client = AsyncIOMotorClient(
                mongo_url,
                maxPoolSize=10,  # Optimize for serverless
                minPoolSize=1,   # Keep minimum connections
                serverSelectionTimeoutMS=5000,  # Fast timeout
                connectTimeoutMS=10000,  # Connection timeout
                socketTimeoutMS=30000,   # Socket timeout
                maxIdleTimeMS=45000,     # Close idle connections
                retryWrites=True,        # Retry failed writes
                w='majority'             # Write concern
            )
        return self._client
    
    def get_database(self):
        if self._db is None:
            client = self.get_client()
            self._db = client[os.environ.get('DB_NAME', 'showtime_portal')]
        return self._db

# Initialize database connection
db_connection = DatabaseConnection()
client = db_connection.get_client()
db = db_connection.get_database()

# Department and team data with resource counts
DEPARTMENT_DATA = {
    "Soul Centre": {
        "Soul Central": ["Atia"],
        "Field Team": ["Siddharth Gautam", "Sai Kiran Gurram", "Akhilesh Mishra"]
    },
    "Directors": {
        "Director": ["Anant Tiwari"],
        "Associate Director": ["Alimpan Banerjee"]
    },
    "Directors team": {
        "Directors Team": ["Himani Sehgal", "Pawan Beniwal", "Aditya Pandit", "Sravya", "Eshwar"]
    },
    "Campaign": {
        "Campaign": ["S S Manoharan"]
    },
    "Data": {
        "Data": ["T. Pardhasaradhi"]
    },
    "Media": {
        "Media": ["Aakanksha Tandon"]
    },
    "Research": {
        "Research": ["P. Srinath Rao"]
    },
    "DMC": {
        "HIVE": ["Madhunisha and Apoorva"],
        "Digital Communication": ["Keerthana"],
        "Digital Production": ["Bapan"]
    },
    "HR": {
        "HR": ["Tejaswini"]
    },
    "Admin": {
        "Operations": ["Nikash"]
    }
}

# Manager resource counts (from user's table)
MANAGER_RESOURCES = {
    "Atia": 4,
    "Akhilesh Mishra": 12,
    "Siddharth Gautam": 8,
    "Sai Kiran Gurram": 3,
    "Himani Sehgal": 6,
    "Pawan Beniwal": 3,
    "Aditya Pandit": 3,
    "Sravya": 1,
    "Eshwar": 1,
    "S S Manoharan": 4,
    "T. Pardhasaradhi": 5,
    "Aakanksha Tandon": 6,
    "P. Srinath Rao": 2,
    "Madhunisha and Apoorva": 1,
    "Keerthana": 7,
    "Bapan": 15,
    "Tejaswini": 4,
    "Nikash": 4
}

STATUS_OPTIONS = ["WIP", "Completed", "Yet to Start", "Delayed"]

# Predefined users with actual company data
PREDEFINED_USERS = [
    # Employees
    {"name": "Lokesh Reddy", "email": "lokeshreddy@showtimeconsulting.in", "password": "Welcome@123", "role": "employee", "department": "", "team": ""},
    {"name": "Vinod Kumar P", "email": "vinod.kumar@showtimeconsulting.in", "password": "Welcome@123", "role": "employee", "department": "", "team": ""},
    
    # Managers - Soul Centre
    {"name": "Atia Latif", "email": "atia@showtimeconsulting.in", "password": "Welcome@123", "role": "manager", "department": "Soul Centre", "team": "Soul Central"},
    {"name": "Siddharth Gautam", "email": "siddharthag@showtimeconsulting.in", "password": "Welcome@123", "role": "manager", "department": "Soul Centre", "team": "Field Team"},
    {"name": "Gurram Saikiran", "email": "gurram.saikiran@showtimeconsulting.in", "password": "Welcome@123", "role": "manager", "department": "Soul Centre", "team": "Field Team"},
    {"name": "Akhilesh Mishra", "email": "akhilesh@showtimeconsulting.in", "password": "Welcome@123", "role": "manager", "department": "Soul Centre", "team": "Field Team"},
    
    # Managers - Directors
    {"name": "Anant Tiwari", "email": "at@showtimeconsulting.in", "password": "Welcome@123", "role": "manager", "department": "Directors", "team": "Director"},
    {"name": "Alimpan Banerjee", "email": "alimpan@showtimeconsulting.in", "password": "Welcome@123", "role": "manager", "department": "Directors", "team": "Associate Director"},
    
    # Managers - Directors team
    {"name": "Himani Sehgal", "email": "himani.sehgal@showtimeconsulting.in", "password": "Welcome@123", "role": "manager", "department": "Directors team", "team": "Directors Team"},
    {"name": "Pawan Beniwal", "email": "pawan.beniwal@showtimeconsulting.in", "password": "Welcome@123", "role": "manager", "department": "Directors team", "team": "Directors Team"},
    {"name": "Aditya Pandit", "email": "aditya.pandit@showtimeconsulting.in", "password": "Welcome@123", "role": "manager", "department": "Directors team", "team": "Directors Team"},
    {"name": "Challa Sravya", "email": "challa.sravya@showtimeconsulting.in", "password": "Welcome@123", "role": "manager", "department": "Directors team", "team": "Directors Team"},
    {"name": "Sabavat Eshwar", "email": "sabavat.eshwar@showtimeconsulting.in", "password": "Welcome@123", "role": "manager", "department": "Directors team", "team": "Directors Team"},
    
    # Managers - Campaign
    {"name": "S S Manoharan", "email": "manoharan@showtimeconsulting.in", "password": "Welcome@123", "role": "manager", "department": "Campaign", "team": "Campaign"},
    
    # Managers - Data
    {"name": "T. Pardhasaradhi", "email": "pardhasaradhi@showtimeconsulting.in", "password": "Welcome@123", "role": "manager", "department": "Data", "team": "Data"},
    
    # Managers - Media
    {"name": "Aakanksha Tandon", "email": "aakanksha.tandon@showtimeconsulting.in", "password": "Welcome@123", "role": "manager", "department": "Media", "team": "Media"},
    
    # Managers - Research
    {"name": "P. Srinath Rao", "email": "srinath@showtimeconsulting.in", "password": "Welcome@123", "role": "manager", "department": "Research", "team": "Research"},
    
    # Managers - DMC
    {"name": "Madhunisha", "email": "madhunisha@showtimeconsulting.in", "password": "Welcome@123", "role": "manager", "department": "DMC", "team": "HIVE"},
    {"name": "Apoorva Singh", "email": "apoorva@showtimeconsulting.in", "password": "Welcome@123", "role": "manager", "department": "DMC", "team": "HIVE"},
    {"name": "Keerthana Sampath", "email": "keerthana.sampath@showtimeconsulting.in", "password": "Welcome@123", "role": "manager", "department": "DMC", "team": "Digital Communication"},
    {"name": "Bapan Kumar Chanda", "email": "bapankumarchanda@showtimeconsulting.in", "password": "Welcome@123", "role": "manager", "department": "DMC", "team": "Digital Production"},
    
    # Managers - HR
    {"name": "Tejaswini Ch", "email": "tejaswini@showtimeconsulting.in", "password": "Welcome@123", "role": "manager", "department": "HR", "team": "HR"},
    
    # Managers - Admin
    {"name": "Nikash Kumar", "email": "nikash.kumar@showtimeconsulting.in", "password": "Welcome@123", "role": "manager", "department": "Admin", "team": "Operations"},
    
    # Additional Managers
    {"name": "Robbin Sharma", "email": "rs@showtimeconsulting.in", "password": "Welcome@123", "role": "manager", "department": "", "team": ""},
    
    # Test Employee (for testing purposes)
    {"name": "Test Employee", "email": "test@showtimeconsulting.in", "password": "Welcome@123", "role": "employee", "department": "Data", "team": "Data"},
]

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    password_hash: str
    role: str  # "manager" or "employee"
    department: str = ""
    team: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))

class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "employee"  # Default to employee
    department: str = ""
    team: str = ""

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    department: str = ""
    team: str = ""

class PasswordResetToken(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    token: str = Field(default_factory=lambda: str(uuid.uuid4()))
    expires_at: datetime
    used: bool = False

class RequestPasswordReset(BaseModel):
    email: str

class ResetPassword(BaseModel):
    token: str
    new_password: str

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    details: str
    status: str

class WorkReport(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_name: str
    employee_email: str
    department: str
    team: str
    reporting_manager: str
    date: str
    tasks: List[Task]
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    last_modified_at: datetime = Field(default_factory=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    last_modified_by: str = ""

class WorkReportCreate(BaseModel):
    employee_name: str
    department: str
    team: str
    reporting_manager: str
    date: str
    tasks: List[Task]

class WorkReportUpdate(BaseModel):
    tasks: List[Task]

class GroupedSummaryReportItem(BaseModel):
    department: str
    team: str
    reporting_manager: str
    no_of_resource: int
    tasks_list: List[str]
    statuses_list: List[str]
    reviewer: Optional[str] = None

class GroupedSummaryReportResponse(BaseModel):
    reports: List[GroupedSummaryReportItem]

# Security setup
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"

# IST timezone
IST = pytz.timezone('Asia/Kolkata')

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

# Helper function to convert MongoDB document to dict with proper ObjectId handling
def convert_mongo_doc(doc):
    if doc is None:
        return None
    
    doc_dict = dict(doc)
    
    # Convert ObjectId to string
    if '_id' in doc_dict:
        doc_dict['_id'] = str(doc_dict['_id'])
    
    return doc_dict

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        user = await db.users.find_one({"email": payload.get("sub")})
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Convert MongoDB document to dict with proper ObjectId handling
        user_dict = convert_mongo_doc(user)
        return UserResponse(**user_dict)
    except Exception as e:
        logging.error(f"Error getting current user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service temporarily unavailable"
        )

# Initialize database with predefined users
async def init_database():
    try:
        # Check if users already exist
        user_count = await db.users.count_documents({})
        if user_count == 0:
            # Insert predefined users
            users_to_insert = []
            for user_data in PREDEFINED_USERS:
                user = User(
                    name=user_data["name"],
                    email=user_data["email"],
                    password_hash=hash_password(user_data["password"]),
                    role=user_data["role"],
                    department=user_data.get("department", ""),
                    team=user_data.get("team", "")
                )
                users_to_insert.append(user.dict())
            
            await db.users.insert_many(users_to_insert)
            print("Database initialized with predefined users")
        else:
            # Update existing users with department and team data where missing
            for user_data in PREDEFINED_USERS:
                existing_user = await db.users.find_one({"email": user_data["email"]})
                if existing_user and not existing_user.get("department"):
                    await db.users.update_one(
                        {"email": user_data["email"]},
                        {"$set": {
                            "department": user_data.get("department", ""),
                            "team": user_data.get("team", "")
                        }}
                    )
                    print(f"Updated {user_data['name']} with department and team data")
    except Exception as e:
        print(f"Database initialization error: {str(e)}")

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await init_database()
        print("Application started successfully")
    except Exception as e:
        print(f"Startup error: {str(e)}")
    yield
    # Shutdown
    try:
        client.close()
        print("Database connection closed")
    except Exception as e:
        print(f"Shutdown error: {str(e)}")

# Create the main app with lifespan
app = FastAPI(
    title="Daily Work Reporting Portal API", 
    version="1.0.0",
    lifespan=lifespan
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# CORS configuration
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@api_router.get("/health")
async def health_check():
    try:
        # Test database connection
        count = await db.users.count_documents({})
        return {
            "status": "healthy", 
            "database": "connected",
            "users_count": count,
            "departments_available": len(DEPARTMENT_DATA)
        }
    except Exception as e:
        return {
            "status": "unhealthy", 
            "error": str(e),
            "database": "disconnected"
        }

# Routes
@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    try:
        user = await db.users.find_one({"email": user_data.email})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        if not verify_password(user_data.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password"
            )
        
        # Convert MongoDB document to dict with proper ObjectId handling
        user_dict = convert_mongo_doc(user)
        
        access_token = create_access_token(data={"sub": user["email"]})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserResponse(**user_dict)
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login service temporarily unavailable"
        )

@api_router.post("/auth/signup")
async def signup(user_data: UserCreate):
    try:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user with provided role or default to employee
        user = User(
            name=user_data.name,
            email=user_data.email,
            password_hash=hash_password(user_data.password),
            role=user_data.role,
            department=user_data.department,
            team=user_data.team
        )
        
        await db.users.insert_one(user.dict())
        
        access_token = create_access_token(data={"sub": user.email})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserResponse(**user.dict())
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Signup error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Signup service temporarily unavailable"
        )

@api_router.get("/auth/me")
async def get_current_user_info(current_user: UserResponse = Depends(get_current_user)):
    return current_user

# Placeholder for email sending function
async def send_password_reset_email(email: str, token: str):
    # In a real application, you would use an email library (e.g., fastapi-mail, sendgrid, etc.)
    # For now, we'll just print it to the console for development
    reset_link = f"http://localhost:3000/reset-password?token={token}" # Assuming frontend runs on port 3000
    print(f"Password reset link for {email}: {reset_link}")
    # Simulate email sending delay
    # import asyncio
    # await asyncio.sleep(1) # Uncomment if you want to simulate network latency

@api_router.post("/auth/request-password-reset")
async def request_password_reset(data: RequestPasswordReset):
    user = await db.users.find_one({"email": data.email})
    if user:
        # Invalidate previous tokens for this user
        await db.password_reset_tokens.update_many(
            {"email": data.email, "used": False},
            {"$set": {"used": True, "expires_at": datetime.now(IST) - timedelta(seconds=1)}} # Expire immediately
        )

        # Generate new token
        token_expiry_minutes = 15 # Token valid for 15 minutes
        expires_at = datetime.now(IST) + timedelta(minutes=token_expiry_minutes)

        reset_token_data = PasswordResetToken(
            email=data.email,
            expires_at=expires_at
        )
        await db.password_reset_tokens.insert_one(reset_token_data.dict())

        try:
            await send_password_reset_email(data.email, reset_token_data.token)
        except Exception as e:
            logger.error(f"Failed to send password reset email to {data.email}: {e}")
            # Even if email fails, don't reveal it to the user to prevent enumeration
            # Log the error and proceed as if successful to the client

    # Always return a generic message to prevent email enumeration attacks
    return {"message": "If an account with that email exists, a password reset link has been sent."}

@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPassword):
    from datetime import timedelta # Moved import here to avoid conflict if not used elsewhere initially

    token_data = await db.password_reset_tokens.find_one(
        {"token": data.token, "used": False, "expires_at": {"$gt": datetime.now(IST)}}
    )

    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token."
        )

    user = await db.users.find_one({"email": token_data["email"]})
    if not user:
        # This case should ideally not happen if token is valid, but good for robustness
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User associated with token not found."
        )

    # Update user's password
    new_password_hash = hash_password(data.new_password)
    await db.users.update_one(
        {"email": token_data["email"]},
        {"$set": {"password_hash": new_password_hash}}
    )

    # Mark token as used
    await db.password_reset_tokens.update_one(
        {"token": data.token},
        {"$set": {"used": True}}
    )

    return {"message": "Password has been reset successfully."}


@api_router.get("/departments")
async def get_departments():
    try:
        return {"departments": DEPARTMENT_DATA}
    except Exception as e:
        logging.error(f"Departments error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Departments service temporarily unavailable"
        )

@api_router.get("/manager-resources")
async def get_manager_resources():
    try:
        return {"manager_resources": MANAGER_RESOURCES}
    except Exception as e:
        logging.error(f"Manager resources error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Manager resources service temporarily unavailable"
        )

@api_router.get("/status-options")
async def get_status_options():
    try:
        return {"status_options": STATUS_OPTIONS}
    except Exception as e:
        logging.error(f"Status options error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Status options service temporarily unavailable"
        )

@api_router.post("/work-reports")
async def create_work_report(
    report_data: WorkReportCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    try:
        report = WorkReport(
            employee_name=report_data.employee_name,
            employee_email=current_user.email,
            department=report_data.department,
            team=report_data.team,
            reporting_manager=report_data.reporting_manager,
            date=report_data.date,
            tasks=report_data.tasks
        )
        
        await db.work_reports.insert_one(report.dict())
        return {"message": "Work report submitted successfully", "report_id": report.id}
    except Exception as e:
        logging.error(f"Create work report error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Work report service temporarily unavailable"
        )

@api_router.get("/work-reports")
async def get_work_reports(
    current_user: UserResponse = Depends(get_current_user),
    department: Optional[str] = None,
    team: Optional[str] = None,
    manager: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None
):
    try:
        # Build query
        query = {}
        
        # If user is employee, only show their reports
        if current_user.role == "employee":
            query["employee_email"] = current_user.email
        
        # Apply filters
        if department and department != "All Departments":
            query["department"] = department
        if team and team != "All Teams":
            query["team"] = team
        if manager and manager != "All Reporting Managers":
            query["reporting_manager"] = manager
        
        # Date filtering
        if from_date and to_date:
            query["date"] = {"$gte": from_date, "$lte": to_date}
        elif from_date:
            query["date"] = {"$gte": from_date}
        elif to_date:
            query["date"] = {"$lte": to_date}
        
        cursor = db.work_reports.find(query).sort("submitted_at", -1)
        reports = await cursor.to_list(1000)
        
        # Convert MongoDB documents to dict with proper ObjectId handling
        reports_list = [convert_mongo_doc(report) for report in reports]
        
        return {"reports": reports_list}
    except Exception as e:
        logging.error(f"Get work reports error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Work reports service temporarily unavailable"
        )

@api_router.get("/attendance-summary")
async def get_attendance_summary(
    current_user: UserResponse = Depends(get_current_user),
    date: Optional[str] = None
):
    """Get attendance summary for managers on a specific date"""
    try:
        if not date:
            # Default to today
            date = datetime.now(IST).strftime("%Y-%m-%d")
        
        # Get all reports for the specified date
        reports = await db.work_reports.find({"date": date}).to_list(1000)
        
        # Group reports by manager
        manager_attendance = {}
        
        for report in reports:
            manager = report["reporting_manager"]
            if manager not in manager_attendance:
                manager_attendance[manager] = {
                    "present": [],
                    "total_resources": MANAGER_RESOURCES.get(manager, 0)
                }
            manager_attendance[manager]["present"].append(report["employee_name"])
        
        # Calculate absent employees for each manager
        attendance_summary = {}
        for manager, resources in MANAGER_RESOURCES.items():
            present_count = len(manager_attendance.get(manager, {}).get("present", []))
            absent_count = resources - present_count
            
            attendance_summary[manager] = {
                "total_resources": resources,
                "present": present_count,
                "absent": absent_count,
                "present_employees": manager_attendance.get(manager, {}).get("present", [])
            }
        
        return {
            "date": date,
            "attendance_summary": attendance_summary
        }
    except Exception as e:
        logging.error(f"Attendance summary error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Attendance summary service temporarily unavailable"
        )

@api_router.put("/work-reports/{report_id}")
async def update_work_report(
    report_id: str,
    report_data: WorkReportUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    try:
        # Check if user is manager
        if current_user.role != "manager":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only managers can edit reports"
            )
        
        # Find the report
        report = await db.work_reports.find_one({"id": report_id})
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found"
            )
        
        # Update the report
        update_data = {
            "tasks": [task.dict() for task in report_data.tasks],
            "last_modified_at": datetime.now(IST),
            "last_modified_by": current_user.email
        }
        
        await db.work_reports.update_one(
            {"id": report_id},
            {"$set": update_data}
        )
        
        return {"message": "Report updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Update work report error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Work report update service temporarily unavailable"
        )

@api_router.delete("/work-reports/{report_id}")
async def delete_work_report(
    report_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    try:
        # Check if user is manager
        if current_user.role != "manager":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only managers can delete reports"
            )
        
        # Find the report
        report = await db.work_reports.find_one({"id": report_id})
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found"
            )
        
        # Delete the report
        await db.work_reports.delete_one({"id": report_id})
        
        return {"message": "Report deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Delete work report error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Work report delete service temporarily unavailable"
        )

@api_router.get("/work-reports/export/csv")
async def export_csv(
    current_user: UserResponse = Depends(get_current_user),
    department: Optional[str] = None,
    team: Optional[str] = None,
    manager: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None
):
    try:
        # Build query (same as get_work_reports)
        query = {}
        
        if current_user.role == "employee":
            query["employee_email"] = current_user.email
        
        if department and department != "All Departments":
            query["department"] = department
        if team and team != "All Teams":
            query["team"] = team
        if manager and manager != "All Reporting Managers":
            query["reporting_manager"] = manager
        
        if from_date and to_date:
            query["date"] = {"$gte": from_date, "$lte": to_date}
        elif from_date:
            query["date"] = {"$gte": from_date}
        elif to_date:
            query["date"] = {"$lte": to_date}
        
        reports = await db.work_reports.find(query).sort("submitted_at", -1).to_list(1000)
        
        # Create CSV without pandas - lightweight approach
        csv_lines = []
        csv_lines.append("Date,Employee Name,Department,Team,Reporting Manager,Task Details,Status,Submitted At")
        
        for report in reports:
            for task in report["tasks"]:
                details = task["details"].replace('"', '""')
                csv_line = f'"{report["date"]}","{report["employee_name"]}","{report["department"]}","{report["team"]}","{report["reporting_manager"]}","{details}","{task["status"]}","{report["submitted_at"].strftime("%Y-%m-%d %H:%M:%S IST")}"'
                csv_lines.append(csv_line)
        
        csv_content = "\n".join(csv_lines)
        
        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=work_reports.csv"}
        )
    except Exception as e:
        logging.error(f"CSV export error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="CSV export service temporarily unavailable"
        )

@api_router.get("/managers")
async def get_managers():
    try:
        cursor = db.users.find({"role": "manager"})
        managers = await cursor.to_list(1000)
        
        # Convert MongoDB documents to dict with proper ObjectId handling
        managers_list = [convert_mongo_doc(manager) for manager in managers]
        
        return {"managers": [{"name": manager["name"], "email": manager["email"]} for manager in managers_list]}
    except Exception as e:
        logging.error(f"Get managers error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Managers service temporarily unavailable"
        )

@api_router.get("/summary-reports-grouped", response_model=GroupedSummaryReportResponse)
async def get_summary_reports_grouped(
    current_user: UserResponse = Depends(get_current_user),
    department: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None
):
    # Base query for fetching reports
    query: Dict[str, Any] = {}
    if department and department != "All Departments" and department != "":
        query["department"] = department

    date_filter: Dict[str, str] = {}
    if from_date:
        date_filter["$gte"] = from_date
    if to_date:
        date_filter["$lte"] = to_date
    if date_filter:
        query["date"] = date_filter

    # Fetch all relevant reports first
    all_reports_cursor = db.work_reports.find(query)
    all_reports = await all_reports_cursor.to_list(length=None)

    if not all_reports:
        return GroupedSummaryReportResponse(reports=[])

    # Structure for aggregation:
    # Key: tuple (department, team, reporting_manager)
    # Value: Dict { employees: set_of_employee_emails, tasks_list: [], statuses_list: [] }
    grouped_data: Dict[tuple[str, str, str], Dict[str, Any]] = {}

    target_reporting_managers = [
        "Atia Latif", "Siddharth Gautam", "Gurram Saikiran", "Akhilesh Mishra",
        "Anant Tiwari", "Alimpan Banerjee", "Himani Sehgal", "Pawan Beniwal",
        "Aditya Pandit", "Challa Sravya", "Sabavat Eshwar", "S S Manoharan",
        "T. Pardhasaradhi", "Aakanksha Tandon", "P. Srinath Rao", "Madhunisha",
        "Apoorva Singh", "Keerthana Sampath", "Bapan Kumar Chanda", "Tejaswini Ch",
        "Nikash Kumar", "Bhawna Shraddha"
    ]

    # This will store reports submitted BY the managers themselves, to find their reviewer
    reports_by_managers_themselves: Dict[str, Any] = {}


    for report in all_reports:
        report_manager = report.get("reporting_manager")
        employee_email = report.get("employee_email") # Assuming employee_email is stored
        employee_name = report.get("employee_name")

        # Check if the report is submitted BY one of the target managers (for reviewer lookup)
        if employee_name in target_reporting_managers and report_manager in ["Anant Tiwari", "Alimpan Banerjee"]:
            # If this manager submitted multiple reports selecting a reviewer, keep the latest one
            if employee_name not in reports_by_managers_themselves or \
               report["submitted_at"] > reports_by_managers_themselves[employee_name]["submitted_at"]:
                reports_by_managers_themselves[employee_name] = report


        # Only process reports FOR the target reporting managers for the summary
        if report_manager not in target_reporting_managers:
            continue

        group_key = (
            report.get("department", "N/A"),
            report.get("team", "N/A"),
            report_manager # Already checked this is a target manager
        )

        if group_key not in grouped_data:
            grouped_data[group_key] = {
                "employees": set(), # Store employee emails or names for unique count
                "tasks_list": [],
                "statuses_list": [],
                "reviewer": None
            }

        # Add employee to the set for unique count (using email for uniqueness)
        if employee_email: # Make sure employee_email exists
            grouped_data[group_key]["employees"].add(employee_email)

        for task in report.get("tasks", []):
            grouped_data[group_key]["tasks_list"].append(task.get("details", "N/A"))
            grouped_data[group_key]["statuses_list"].append(task.get("status", "N/A"))

    # Assign reviewer to each group
    for group_key_tuple, data_dict in grouped_data.items():
        manager_name_for_group = group_key_tuple[2] # This is the reporting_manager of the group
        if manager_name_for_group in reports_by_managers_themselves:
            # The reviewer is who this manager reported to
            data_dict["reviewer"] = reports_by_managers_themselves[manager_name_for_group].get("reporting_manager")

    result_reports: List[GroupedSummaryReportItem] = []
    for key, data in grouped_data.items():
        result_reports.append(
            GroupedSummaryReportItem(
                department=key[0],
                team=key[1],
                reporting_manager=key[2],
                no_of_resource=len(data["employees"]),
                tasks_list=data["tasks_list"],
                statuses_list=data["statuses_list"],
                reviewer=data.get("reviewer") # Use .get() for safety
            )
        )

    result_reports.sort(key=lambda x: (x.department, x.team, x.reporting_manager))

    return GroupedSummaryReportResponse(reports=result_reports)

# Include the router in the main app
app.include_router(api_router)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Mangum handler for Vercel serverless
handler = Mangum(app)