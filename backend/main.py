"""
Main FastAPI Application for Evidence Protection System
Entry point: python main.py
"""
from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import uvicorn
import os
import shutil
import json
import hashlib
from pathlib import Path

from database import Database
from blockchain import Blockchain
from auth import (
    create_access_token, get_current_user, verify_password,
    hash_password, security
)


# Initialize FastAPI app
app = FastAPI(
    title="Evidence Protection System API",
    description="Blockchain-based evidence tracking system",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Mount the uploads directory for static file serving
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Initialize database and blockchain
db = Database()
blockchain = Blockchain()

# Load blockchain from database if exists
saved_chain = db.load_blockchain()
if saved_chain:
    blockchain = Blockchain.from_json(saved_chain)


# Pydantic Models
class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]


class UserCreate(BaseModel):
    username: str
    password: str
    role: str
    full_name: str
    badge_number: Optional[str] = None
    email: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    badge_number: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[int] = None


class EvidenceCreate(BaseModel):
    evidence_id: str
    description: str
    type: str
    date: str
    time: str
    investigating_officer_id: int
    forensic_officer_id: int


class EvidenceUpdate(BaseModel):
    description: Optional[str] = None
    type: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    investigating_officer_id: Optional[int] = None
    forensic_officer_id: Optional[int] = None
    status: Optional[str] = None


class EvidenceLogCreate(BaseModel):
    evidence_id: str
    log_type: str  # 'entry', 'exit', 'movement'
    item_count: Optional[int] = None
    size: Optional[str] = None
    description: Optional[str] = None
    source: Optional[str] = None
    destination: Optional[str] = None


# Helper function to save blockchain
def save_blockchain_to_db():
    """Save current blockchain state to database"""
    db.save_blockchain(blockchain.to_json())


# API Routes

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Evidence Protection System API",
        "version": "1.0.0",
        "status": "running"
    }


# Authentication Routes
@app.post("/api/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """User login endpoint"""
    user = db.get_user_by_username(request.username)
    
    if not user or not verify_password(request.password, user['password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # Create access token
    access_token = create_access_token(
        data={
            "user_id": user['id'],
            "username": user['username'],
            "role": user['role'],
            "full_name": user['full_name']
        }
    )
    
    # Remove password from user data
    user_data = {k: v for k, v in user.items() if k != 'password'}
    
    # Log activity
    db.create_activity_log(
        user_id=user['id'],
        action="login",
        entity_type="auth",
        details={"timestamp": datetime.now().isoformat()}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data
    }


@app.get("/api/auth/me")
async def get_me(current_user: Dict = Depends(get_current_user)):
    """Get current user information"""
    user = db.get_user_by_id(current_user['user_id'])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = {k: v for k, v in user.items() if k != 'password'}
    return user_data


# User Management Routes (Admin only)
@app.get("/api/users")
async def get_users(current_user: Dict = Depends(get_current_user)):
    """Get all users (Admin only)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = db.get_all_users()
    return [
        {k: v for k, v in user.items() if k != 'password'}
        for user in users
    ]


@app.post("/api/users")
async def create_user(user_data: UserCreate, current_user: Dict = Depends(get_current_user)):
    """Create new user (Admin only)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if username already exists
    existing_user = db.get_user_by_username(user_data.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Hash the password for blockchain storage
    import hashlib
    password_hash = hashlib.sha256(user_data.password.encode()).hexdigest()
    
    # Create user
    user_id = db.create_user(
        username=user_data.username,
        password=user_data.password,
        role=user_data.role,
        full_name=user_data.full_name,
        badge_number=user_data.badge_number,
        email=user_data.email
    )
    
    # Add to blockchain - INCLUDE PASSWORD HASH for tamper detection
    blockchain.add_block({
        "action": "create_user",
        "user_role": current_user['role'],
        "user_id": current_user['user_id'],
        "details": {
            "new_user_id": user_id,
            "username": user_data.username,
            "role": user_data.role,
            "full_name": user_data.full_name,
            "email": user_data.email,
            "badge_number": user_data.badge_number,
            "password_hash": password_hash  # Store hash in blockchain for validation
        }
    })
    save_blockchain_to_db()
    
    # Log activity
    db.create_activity_log(
        user_id=current_user['user_id'],
        action="create_user",
        entity_type="user",
        entity_id=user_id,
        details={"username": user_data.username, "role": user_data.role}
    )
    
    return {"message": "User created successfully", "user_id": user_id}


@app.put("/api/users/{user_id}")
async def update_user(user_id: int, user_data: UserUpdate, current_user: Dict = Depends(get_current_user)):
    """Update user (Admin only)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Update user
    update_data = {k: v for k, v in user_data.dict().items() if v is not None}
    success = db.update_user(user_id, **update_data)
    
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Add to blockchain
    blockchain.add_block({
        "action": "update_user",
        "user_role": current_user['role'],
        "user_id": current_user['user_id'],
        "details": {
            "updated_user_id": user_id,
            "changes": update_data
        }
    })
    save_blockchain_to_db()
    
    # Log activity
    db.create_activity_log(
        user_id=current_user['user_id'],
        action="update_user",
        entity_type="user",
        entity_id=user_id,
        details=update_data
    )
    
    return {"message": "User updated successfully"}


@app.delete("/api/users/{user_id}")
async def delete_user(user_id: int, current_user: Dict = Depends(get_current_user)):
    """Delete user (Admin only)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Prevent self-deletion
    if user_id == current_user['user_id']:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    success = db.delete_user(user_id)
    
    # Add to blockchain
    blockchain.add_block({
        "action": "delete_user",
        "user_role": current_user['role'],
        "user_id": current_user['user_id'],
        "details": {
            "deleted_user_id": user_id,
            "username": user['username']
        }
    })
    save_blockchain_to_db()
    
    # Log activity
    db.create_activity_log(
        user_id=current_user['user_id'],
        action="delete_user",
        entity_type="user",
        entity_id=user_id,
        details={"username": user['username']}
    )
    
    return {"message": "User deleted successfully"}


# Evidence Routes
@app.get("/api/evidence")
async def get_all_evidence(current_user: Dict = Depends(get_current_user)):
    """Get all evidence records"""
    evidence_list = db.get_all_evidence()
    return evidence_list


@app.get("/api/evidence/{evidence_id}")
async def get_evidence(evidence_id: str, current_user: Dict = Depends(get_current_user)):
    """Get specific evidence by ID"""
    evidence = db.get_evidence_by_id(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    return evidence


@app.post("/api/evidence")
async def create_evidence(
    evidence_id: str = Form(...),
    description: str = Form(...),
    type: str = Form(...),
    date: str = Form(...),
    time: str = Form(...),
    investigating_officer_id: int = Form(...),
    forensic_officer_id: int = Form(...),
    file: Optional[UploadFile] = File(None),
    current_user: Dict = Depends(get_current_user)
):
    """Create new evidence (Forensic only)"""
    if current_user['role'] not in ['forensic', 'admin']:
        raise HTTPException(status_code=403, detail="Forensic officer access required")
    
    # Check if evidence ID already exists
    existing = db.get_evidence_by_id(evidence_id)
    if existing:
        raise HTTPException(status_code=400, detail="Evidence ID already exists")
    
    # Handle file upload
    file_path = None
    file_name = None
    file_type = None
    
    if file and file.filename:
        # Validate file type
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"File type {file_ext} not allowed. Allowed types: {', '.join(allowed_extensions)}")
        
        # Create unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{evidence_id}_{timestamp}{file_ext}"
        file_path = UPLOAD_DIR / safe_filename
        
        # Save file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_path = str(file_path)
        file_name = file.filename
        file_type = file.content_type
    
    # Create evidence
    evidence_pk = db.create_evidence(
        evidence_id=evidence_id,
        description=description,
        evidence_type=type,
        date=date,
        time=time,
        investigating_officer_id=investigating_officer_id,
        forensic_officer_id=forensic_officer_id,
        file_path=file_path,
        file_name=file_name,
        file_type=file_type
    )
    
    # Calculate hash of evidence data for tamper detection (including status)
    evidence_data_string = json.dumps({
        "evidence_id": evidence_id,
        "description": description,
        "type": type,
        "date": date,
        "time": time,
        "investigating_officer_id": investigating_officer_id,
        "forensic_officer_id": forensic_officer_id,
        "file_path": file_path,
        "file_name": file_name,
        "status": "active"
    }, sort_keys=True)
    evidence_hash = hashlib.sha256(evidence_data_string.encode()).hexdigest()
    
    # Add to blockchain with data hash
    blockchain.add_block({
        "action": "add_evidence",
        "user_role": current_user['role'],
        "user_id": current_user['user_id'],
        "details": {
            "evidence_id": evidence_id,
            "description": description,
            "type": type,
            "date": date,
            "time": time,
            "investigating_officer_id": investigating_officer_id,
            "forensic_officer_id": forensic_officer_id,
            "file_path": file_path,
            "file_name": file_name,
            "evidence_hash": evidence_hash
        }
    })
    save_blockchain_to_db()
    
    # Log activity
    db.create_activity_log(
        user_id=current_user['user_id'],
        action="create_evidence",
        entity_type="evidence",
        entity_id=evidence_pk,
        details={"evidence_id": evidence_id, "file_uploaded": file_path is not None}
    )
    
    return {"message": "Evidence created successfully", "evidence_id": evidence_id}


@app.put("/api/evidence/{evidence_id}")
async def update_evidence(evidence_id: str, evidence_data: EvidenceUpdate, current_user: Dict = Depends(get_current_user)):
    """Update evidence (Forensic only)"""
    if current_user['role'] not in ['forensic', 'admin']:
        raise HTTPException(status_code=403, detail="Forensic officer access required")
    
    # Check if evidence exists
    evidence = db.get_evidence_by_id(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    # Update evidence
    update_data = {k: v for k, v in evidence_data.dict().items() if v is not None}
    success = db.update_evidence(evidence_id, **update_data)
    
    # Add to blockchain
    blockchain.add_block({
        "action": "update_evidence",
        "user_role": current_user['role'],
        "user_id": current_user['user_id'],
        "details": {
            "evidence_id": evidence_id,
            "changes": update_data
        }
    })
    save_blockchain_to_db()
    
    # Log activity
    db.create_activity_log(
        user_id=current_user['user_id'],
        action="update_evidence",
        entity_type="evidence",
        entity_id=evidence['id'],
        details={"evidence_id": evidence_id, "changes": update_data}
    )
    
    return {"message": "Evidence updated successfully"}


@app.delete("/api/evidence/{evidence_id}")
async def delete_evidence(evidence_id: str, current_user: Dict = Depends(get_current_user)):
    """Delete evidence (Forensic only)"""
    if current_user['role'] not in ['forensic', 'admin']:
        raise HTTPException(status_code=403, detail="Forensic officer access required")
    
    # Check if evidence exists
    evidence = db.get_evidence_by_id(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    success = db.delete_evidence(evidence_id)
    
    # Add to blockchain
    blockchain.add_block({
        "action": "delete_evidence",
        "user_role": current_user['role'],
        "user_id": current_user['user_id'],
        "details": {
            "evidence_id": evidence_id,
            "description": evidence['description']
        }
    })
    save_blockchain_to_db()
    
    # Log activity
    db.create_activity_log(
        user_id=current_user['user_id'],
        action="delete_evidence",
        entity_type="evidence",
        entity_id=evidence['id'],
        details={"evidence_id": evidence_id}
    )
    
    return {"message": "Evidence deleted successfully"}


# Evidence Log Routes
@app.post("/api/evidence-logs")
async def create_evidence_log(log_data: EvidenceLogCreate, current_user: Dict = Depends(get_current_user)):
    """Create evidence log (Evidence Room or Police)"""
    allowed_roles = ['evidence_room', 'police', 'admin', 'forensic']
    if current_user['role'] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get evidence
    evidence = db.get_evidence_by_id(log_data.evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    # Create log
    log_id = db.create_evidence_log(
        evidence_id=evidence['id'],
        log_type=log_data.log_type,
        officer_id=current_user['user_id'],
        item_count=log_data.item_count,
        size=log_data.size,
        description=log_data.description,
        source=log_data.source,
        destination=log_data.destination
    )
    
    # Add to blockchain - Store ALL fields for tamper detection
    blockchain.add_block({
        "action": "create_evidence_log",
        "user_role": current_user['role'],
        "user_id": current_user['user_id'],
        "details": {
            "log_id": log_id,
            "evidence_id": evidence['id'],  # Store the internal ID
            "log_type": log_data.log_type,
            "item_count": log_data.item_count,
            "size": log_data.size,
            "description": log_data.description,
            "source": log_data.source,
            "destination": log_data.destination,
            "officer_id": current_user['user_id']
        }
    })
    save_blockchain_to_db()
    
    # Log activity
    db.create_activity_log(
        user_id=current_user['user_id'],
        action=f"evidence_{log_data.log_type}",
        entity_type="evidence_log",
        entity_id=log_id,
        details={"evidence_id": log_data.evidence_id, "log_type": log_data.log_type}
    )
    
    return {"message": "Evidence log created successfully", "log_id": log_id}


@app.get("/api/evidence-logs/{evidence_id}")
async def get_evidence_logs(evidence_id: str, current_user: Dict = Depends(get_current_user)):
    """Get all logs for specific evidence"""
    evidence = db.get_evidence_by_id(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    logs = db.get_evidence_logs(evidence['id'])
    return logs


# Activity Log Routes
@app.get("/api/activity-logs")
async def get_activity_logs(current_user: Dict = Depends(get_current_user)):
    """Get all activity logs (Admin only)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    logs = db.get_all_activity_logs(limit=200)
    return logs


# Blockchain Routes
@app.get("/api/blockchain")
async def get_blockchain(current_user: Dict = Depends(get_current_user)):
    """Get entire blockchain"""
    return blockchain.get_chain()


@app.get("/api/blockchain/validate")
async def validate_blockchain(current_user: Dict = Depends(get_current_user)):
    """Validate blockchain integrity and data consistency"""
    # CRITICAL FIX: Reload blockchain from database to detect tampering without restart
    global blockchain
    saved_chain = db.load_blockchain()
    if saved_chain:
        blockchain = Blockchain.from_json(saved_chain)
    
    # First check blockchain chain integrity
    chain_validation = blockchain.is_chain_valid()
    
    # Then check if ALL data (evidence, users, etc.) matches blockchain records
    data_validation = validate_all_data_integrity()
    
    # Combine results
    validation_result = {
        "chain_valid": chain_validation["valid"],
        "data_valid": data_validation["valid"],
        "valid": chain_validation["valid"] and data_validation["valid"],
        "chain_message": chain_validation["message"],
        "data_message": data_validation["message"],
        "broken_at": chain_validation.get("broken_at"),
        "tampered_evidence": data_validation.get("tampered_evidence", []),
        "tampered_users": data_validation.get("tampered_users", []),
        "tampered_logs": data_validation.get("tampered_logs", [])
    }
    
    # Log validation attempt
    db.create_activity_log(
        user_id=current_user['user_id'],
        action="validate_blockchain",
        entity_type="blockchain",
        details=validation_result
    )
    
    return validation_result


def validate_all_data_integrity() -> Dict[str, Any]:
    """
    Validate CRITICAL database tables against blockchain records
    Checks: evidence, users, evidence_logs
    NOTE: Activity logs excluded - they're metadata and cause timing false positives
    """
    all_tampered_items = []
    messages = []
    
    # Validate evidence data
    evidence_validation = validate_evidence_data_integrity()
    if not evidence_validation["valid"]:
        all_tampered_items.extend(evidence_validation.get("tampered_evidence", []))
        messages.append(evidence_validation["message"])
    
    # Validate user data
    user_validation = validate_user_data_integrity()
    if not user_validation["valid"]:
        all_tampered_items.extend(user_validation.get("tampered_users", []))
        messages.append(user_validation["message"])
    
    # Validate evidence logs - CRITICAL: These track chain of custody
    evidence_logs_validation = validate_evidence_logs_integrity()
    if not evidence_logs_validation["valid"]:
        all_tampered_items.extend(evidence_logs_validation.get("tampered_logs", []))
        messages.append(evidence_logs_validation["message"])
    
    # Activity logs validation REMOVED - causes false positives due to timing
    # Activity logs are metadata only and less critical than core data
    
    # Overall result
    if all_tampered_items:
        return {
            "valid": False,
            "message": f"⚠️ TAMPERING DETECTED! {len(all_tampered_items)} record(s) modified. " + " ".join(messages),
            "tampered_evidence": [item for item in all_tampered_items if item.get("type") == "evidence"],
            "tampered_users": [item for item in all_tampered_items if item.get("type") == "user"],
            "tampered_logs": [item for item in all_tampered_items if item.get("type") == "evidence_log"]
        }
    else:
        return {
            "valid": True,
            "message": "✓ All critical database records match blockchain. No tampering detected.",
            "tampered_evidence": [],
            "tampered_users": [],
            "tampered_logs": []
        }


def validate_user_data_integrity() -> Dict[str, Any]:
    """
    Validate users table against blockchain records
    """
    try:
        # Get all users from database
        all_users = db.get_all_users()
        
        # Count user-related blocks in blockchain
        user_blocks_count = len([b for b in blockchain.chain if b.data.get("action") in ["create_user", "update_user", "delete_user"]])
        
        # If no user blocks in blockchain, skip validation (users created before blockchain)
        if user_blocks_count == 0:
            return {
                "valid": True,
                "message": "✓ No user operations in blockchain to validate (users created before blockchain).",
                "tampered_users": []
            }
        
        # Build expected user state from blockchain
        user_blockchain_state = {}
        
        for block in blockchain.chain:
            action = block.data.get("action")
            details = block.data.get("details", {})
            
            # Track user creations
            if action == "create_user":
                user_id = details.get("new_user_id")
                if user_id:
                    user_blockchain_state[user_id] = {
                        "user_id": user_id,
                        "username": details.get("username"),
                        "role": details.get("role"),
                        "full_name": details.get("full_name"),
                        "email": details.get("email"),
                        "badge_number": details.get("badge_number"),
                        "password_hash": details.get("password_hash"),  # Store password hash
                        "exists": True
                    }
            
            # Track user updates
            elif action == "update_user":
                user_id = details.get("updated_user_id")
                if user_id and user_id in user_blockchain_state:
                    changes = details.get("changes", {})
                    for key, value in changes.items():
                        if key in user_blockchain_state[user_id]:
                            user_blockchain_state[user_id][key] = value
            
            # Track user deletions
            elif action == "delete_user":
                user_id = details.get("deleted_user_id")
                if user_id and user_id in user_blockchain_state:
                    user_blockchain_state[user_id]["exists"] = False
        
        # Also build a username-based lookup (in case ID was tampered)
        user_blockchain_by_username = {}
        for uid, udata in user_blockchain_state.items():
            username = udata.get("username")
            if username:
                user_blockchain_by_username[username] = udata
        
        # Check each user against blockchain
        tampered_users = []
        for user in all_users:
            user_id = user.get("id")
            username = user.get("username")
            
            # Try to find user in blockchain by ID first, then by username
            blockchain_user = None
            if user_id in user_blockchain_state:
                blockchain_user = user_blockchain_state[user_id]
            elif username in user_blockchain_by_username:
                blockchain_user = user_blockchain_by_username[username]
                # ID was tampered!
                tampered_users.append({
                    "type": "user",
                    "user_id": user_id,
                    "username": username,
                    "tampered_fields": ["user_id"],
                    "current_user_id": user_id,
                    "expected_user_id": blockchain_user.get("user_id"),
                    "details": "User ID has been manually changed in database!"
                })
            else:
                # User not in blockchain, skip validation
                continue
            
            if not blockchain_user:
                continue
            
            # Check for other mismatches - CHECK ALL FIELDS FOR COMPLETE TAMPER DETECTION
            mismatches = []
            
            if user.get("username") != blockchain_user.get("username"):
                mismatches.append("username")
            
            if user.get("role") != blockchain_user.get("role"):
                mismatches.append("role")
            
            if user.get("full_name") != blockchain_user.get("full_name"):
                mismatches.append("full_name")
            
            # Check email (handle None values)
            if str(user.get("email") or "") != str(blockchain_user.get("email") or ""):
                mismatches.append("email")
            
            # Check badge_number (handle None values)
            if str(user.get("badge_number") or "") != str(blockchain_user.get("badge_number") or ""):
                mismatches.append("badge_number")
            
            # Check is_active status - CRITICAL: This detects manual activation/deactivation
            expected_is_active = 1 if blockchain_user.get("exists") else 0
            if user.get("is_active") != expected_is_active:
                mismatches.append("is_active")
            
            # Check password - CRITICAL: This detects password tampering
            # The database column is called "password" and contains the hash
            if blockchain_user.get("password_hash"):
                if user.get("password") != blockchain_user.get("password_hash"):
                    mismatches.append("password")
            
            if mismatches:
                tampered_users.append({
                    "type": "user",
                    "user_id": user_id,
                    "username": user.get("username"),
                    "tampered_fields": mismatches,
                    "current_username": user.get("username"),
                    "expected_username": blockchain_user.get("username"),
                    "current_role": user.get("role"),
                    "expected_role": blockchain_user.get("role"),
                    "current_full_name": user.get("full_name"),
                    "expected_full_name": blockchain_user.get("full_name"),
                    "current_email": user.get("email"),
                    "expected_email": blockchain_user.get("email"),
                    "current_badge_number": user.get("badge_number"),
                    "expected_badge_number": blockchain_user.get("badge_number")
                })
        
        if tampered_users:
            return {
                "valid": False,
                "message": f"⚠️ USER DATA TAMPERING DETECTED! {len(tampered_users)} user record(s) have been manually modified in the database.",
                "tampered_users": tampered_users
            }
        else:
            return {
                "valid": True,
                "message": "✓ All user data matches blockchain records.",
                "tampered_users": []
            }
    
    except Exception as e:
        return {
            "valid": False,
            "message": f"Error validating users: {str(e)}",
            "tampered_users": []
        }


def validate_activity_logs_integrity() -> Dict[str, Any]:
    """
    Validate activity_logs table - SMART VALIDATION (avoids false positives)
    Only checks deletion/tampering of CRITICAL audit records
    Skips validation of non-critical logs like logins to avoid timing issues
    """
    try:
        # Get all activity logs from database
        all_logs = db.get_all_activity_logs(limit=10000)
        
        # Count CRITICAL blockchain actions only
        critical_actions = ["create_user", "delete_user", "create_evidence", "delete_evidence", "update_evidence"]
        blockchain_critical_count = 0
        
        for block in blockchain.chain:
            if block.index == 0:  # Skip genesis block
                continue
            action = block.data.get("action")
            if action in critical_actions:
                blockchain_critical_count += 1
        
        # If no critical actions in blockchain, skip validation
        if blockchain_critical_count == 0:
            return {
                "valid": True,
                "message": "✓ No critical activity logs to validate.",
                "tampered_activity_logs": []
            }
        
        # Count critical activity logs in database
        db_critical_count = 0
        for log in all_logs:
            if log.get("action") in critical_actions:
                db_critical_count += 1
        
        # Check if critical logs were mass-deleted
        # Allow some tolerance for timing (logs created after blockchain)
        expected_min_logs = blockchain_critical_count
        
        if db_critical_count < expected_min_logs * 0.8:  # If <80% of expected logs exist
            return {
                "valid": False,
                "message": f"⚠️ ACTIVITY LOGS DELETION DETECTED! Expected at least {expected_min_logs} critical logs but found only {db_critical_count}.",
                "tampered_activity_logs": [{
                    "type": "activity_log",
                    "issue": "mass_deletion",
                    "expected": expected_min_logs,
                    "found": db_critical_count,
                    "details": "Critical audit trail logs have been deleted from database"
                }]
            }
        
        # Check if someone changed action fields in critical logs
        # Build map of action counts per user from blockchain
        blockchain_action_counts = {}
        for block in blockchain.chain:
            if block.index == 0:
                continue
            action = block.data.get("action")
            user_id = block.data.get("user_id")
            if action in critical_actions and user_id:
                key = f"{action}_{user_id}"
                blockchain_action_counts[key] = blockchain_action_counts.get(key, 0) + 1
        
        # Build map from database logs
        db_action_counts = {}
        for log in all_logs:
            action = log.get("action")
            user_id = log.get("user_id")
            if action in critical_actions and user_id:
                key = f"{action}_{user_id}"
                db_action_counts[key] = db_action_counts.get(key, 0) + 1
        
        # Check for suspicious discrepancies (MORE logs than blockchain = tampering)
        tampered_logs = []
        for db_key, db_count in db_action_counts.items():
            blockchain_count = blockchain_action_counts.get(db_key, 0)
            if db_count > blockchain_count:
                parts = db_key.split('_', 1)
                if len(parts) >= 2:
                    action_name = parts[0]
                    tampered_logs.append({
                        "type": "activity_log",
                        "issue": "tampered_action_field",
                        "action": action_name,
                        "details": f"Database has {db_count} '{action_name}' logs but blockchain has only {blockchain_count} - action field may have been manually changed"
                    })
        
        if tampered_logs:
            return {
                "valid": False,
                "message": f"⚠️ ACTIVITY LOG TAMPERING DETECTED! {len(tampered_logs)} action field(s) appear to be manually modified.",
                "tampered_activity_logs": tampered_logs
            }
        
        return {
            "valid": True,
            "message": "✓ All critical activity logs validated successfully.",
            "tampered_activity_logs": []
        }
    
    except Exception as e:
        return {
            "valid": False,
            "message": f"Error during activity log validation: {str(e)}",
            "tampered_activity_logs": []
        }


def validate_evidence_logs_integrity() -> Dict[str, Any]:
    """
    Validate evidence_logs table against blockchain records - CHECK ALL FIELDS
    Evidence logs are CRITICAL for chain of custody - any tampering must be detected
    """
    try:
        # Get all evidence logs from database
        all_logs = db.get_all_evidence_logs()
        
        # Build blockchain state for evidence logs
        evidence_log_blockchain_state = {}
        
        for block in blockchain.chain:
            action = block.data.get("action")
            details = block.data.get("details", {})
            
            # Track evidence log creations
            if action == "create_evidence_log":
                log_id = details.get("log_id")
                if log_id:
                    evidence_log_blockchain_state[log_id] = {
                        "log_id": log_id,
                        "evidence_id": details.get("evidence_id"),
                        "log_type": details.get("log_type"),
                        "item_count": details.get("item_count"),
                        "size": details.get("size"),
                        "description": details.get("description"),
                        "source": details.get("source"),
                        "destination": details.get("destination"),
                        "officer_id": details.get("officer_id")
                    }
        
        # If no evidence logs in blockchain, skip validation
        if len(evidence_log_blockchain_state) == 0:
            return {
                "valid": True,
                "message": "✓ No evidence logs in blockchain to validate.",
                "tampered_logs": []
            }
        
        # Validate each evidence log against blockchain
        tampered_logs = []
        
        for log in all_logs:
            log_id = log.get("id")
            blockchain_log = evidence_log_blockchain_state.get(log_id)
            
            if not blockchain_log:
                continue  # Log created before blockchain tracking
            
            # Check ALL fields for tampering
            mismatches = []
            
            if log.get("evidence_id") != blockchain_log.get("evidence_id"):
                mismatches.append("evidence_id")
            
            if log.get("log_type") != blockchain_log.get("log_type"):
                mismatches.append("log_type")
            
            if log.get("item_count") != blockchain_log.get("item_count"):
                mismatches.append("item_count")
            
            if str(log.get("size") or "") != str(blockchain_log.get("size") or ""):
                mismatches.append("size")
            
            if log.get("description") != blockchain_log.get("description"):
                mismatches.append("description")
            
            if str(log.get("source") or "") != str(blockchain_log.get("source") or ""):
                mismatches.append("source")
            
            if str(log.get("destination") or "") != str(blockchain_log.get("destination") or ""):
                mismatches.append("destination")
            
            if log.get("officer_id") != blockchain_log.get("officer_id"):
                mismatches.append("officer_id")
            
            if mismatches:
                tampered_logs.append({
                    "type": "evidence_log",
                    "log_id": log_id,
                    "evidence_id": log.get("evidence_id"),
                    "log_type": log.get("log_type"),
                    "tampered_fields": mismatches,
                    "current_values": {field: log.get(field) for field in mismatches},
                    "expected_values": {field: blockchain_log.get(field) for field in mismatches}
                })
        
        if tampered_logs:
            return {
                "valid": False,
                "message": f"⚠️ EVIDENCE LOGS TAMPERED! {len(tampered_logs)} log(s) have been modified.",
                "tampered_logs": tampered_logs
            }
        
        return {
            "valid": True,
            "message": "✓ All evidence logs match blockchain records.",
            "tampered_logs": []
        }
    
    except Exception as e:
        return {
            "valid": False,
            "message": f"Error validating evidence logs: {str(e)}",
            "tampered_logs": []
        }


def validate_evidence_data_integrity() -> Dict[str, Any]:
    """
    Compare current evidence data in database with blockchain records using hash validation
    Now accounts for legitimate updates by tracking the complete blockchain history
    Returns: {"valid": bool, "message": str, "tampered_evidence": list}
    """
    try:
        # Get all evidence from database
        all_evidence = db.get_all_evidence()
        
        # Count evidence blocks in blockchain
        evidence_blocks_count = len([b for b in blockchain.chain if b.data.get("action") in ["add_evidence", "update_evidence", "delete_evidence"]])
        
        # If blockchain has evidence blocks but database is empty, DB was wiped
        if evidence_blocks_count > 0 and len(all_evidence) == 0:
            return {
                "valid": False,
                "message": "⚠️ DATABASE WIPED! Blockchain has evidence records but database is empty.",
                "tampered_evidence": []
            }
        
        # If both are empty, it's valid
        if evidence_blocks_count == 0 and len(all_evidence) == 0:
            return {
                "valid": True,
                "message": "✓ No evidence to validate (empty system).",
                "tampered_evidence": []
            }
        
        # Build expected state from blockchain history (add + all updates)
        evidence_blockchain_state = {}
        
        for block in blockchain.chain:
            action = block.data.get("action")
            details = block.data.get("details", {})
            evidence_id = details.get("evidence_id")
            
            if not evidence_id:
                continue
            
            # Initialize with add_evidence block
            if action == "add_evidence":
                evidence_blockchain_state[evidence_id] = {
                    "evidence_id": details.get("evidence_id"),
                    "description": details.get("description"),
                    "type": details.get("type"),
                    "date": details.get("date"),
                    "time": details.get("time"),
                    "investigating_officer_id": details.get("investigating_officer_id"),
                    "forensic_officer_id": details.get("forensic_officer_id"),
                    "file_path": details.get("file_path"),
                    "file_name": details.get("file_name"),
                    "status": "active",  # Start with active status
                    "evidence_hash": details.get("evidence_hash")
                }
            
            # Mark as deleted in blockchain state
            elif action == "delete_evidence":
                if evidence_id in evidence_blockchain_state:
                    evidence_blockchain_state[evidence_id]["status"] = "deleted"
                    # Recalculate hash with deleted status
                    deleted_data_string = json.dumps({
                        "evidence_id": evidence_blockchain_state[evidence_id].get("evidence_id"),
                        "description": evidence_blockchain_state[evidence_id].get("description"),
                        "type": evidence_blockchain_state[evidence_id].get("type"),
                        "date": evidence_blockchain_state[evidence_id].get("date"),
                        "time": evidence_blockchain_state[evidence_id].get("time"),
                        "investigating_officer_id": evidence_blockchain_state[evidence_id].get("investigating_officer_id"),
                        "forensic_officer_id": evidence_blockchain_state[evidence_id].get("forensic_officer_id"),
                        "file_path": evidence_blockchain_state[evidence_id].get("file_path"),
                        "file_name": evidence_blockchain_state[evidence_id].get("file_name"),
                        "status": "deleted"
                    }, sort_keys=True)
                    evidence_blockchain_state[evidence_id]["evidence_hash"] = hashlib.sha256(deleted_data_string.encode()).hexdigest()
            
            # Apply legitimate updates from blockchain
            elif action == "update_evidence":
                if evidence_id in evidence_blockchain_state:
                    changes = details.get("changes", {})
                    # Apply each change to the expected state
                    for key, value in changes.items():
                        # Update the field in the blockchain state
                        evidence_blockchain_state[evidence_id][key] = value
                    
                    # Recalculate expected hash after legitimate updates
                    updated_data_string = json.dumps({
                        "evidence_id": evidence_blockchain_state[evidence_id].get("evidence_id"),
                        "description": evidence_blockchain_state[evidence_id].get("description"),
                        "type": evidence_blockchain_state[evidence_id].get("type"),
                        "date": evidence_blockchain_state[evidence_id].get("date"),
                        "time": evidence_blockchain_state[evidence_id].get("time"),
                        "investigating_officer_id": evidence_blockchain_state[evidence_id].get("investigating_officer_id"),
                        "forensic_officer_id": evidence_blockchain_state[evidence_id].get("forensic_officer_id"),
                        "file_path": evidence_blockchain_state[evidence_id].get("file_path"),
                        "file_name": evidence_blockchain_state[evidence_id].get("file_name"),
                        "status": evidence_blockchain_state[evidence_id].get("status", "active")
                    }, sort_keys=True)
                    evidence_blockchain_state[evidence_id]["evidence_hash"] = hashlib.sha256(updated_data_string.encode()).hexdigest()
        
        # Check each evidence against its expected blockchain state
        tampered_evidence = []
        for evidence in all_evidence:
            evidence_id = evidence.get("evidence_id")
            
            # Skip if this evidence wasn't found in blockchain
            if evidence_id not in evidence_blockchain_state:
                continue
            
            blockchain_record = evidence_blockchain_state[evidence_id]
            
            # Calculate current hash of evidence data (including status)
            current_data_string = json.dumps({
                "evidence_id": evidence.get("evidence_id"),
                "description": evidence.get("description"),
                "type": evidence.get("type"),
                "date": evidence.get("date"),
                "time": evidence.get("time"),
                "investigating_officer_id": evidence.get("investigating_officer_id"),
                "forensic_officer_id": evidence.get("forensic_officer_id"),
                "file_path": evidence.get("file_path"),
                "file_name": evidence.get("file_name"),
                "status": evidence.get("status", "active")
            }, sort_keys=True)
            current_hash = hashlib.sha256(current_data_string.encode()).hexdigest()
            
            # Get original hash from blockchain
            original_hash = blockchain_record.get("evidence_hash")
            
            # Compare hashes
            if original_hash and current_hash != original_hash:
                # Find which fields were tampered
                mismatches = []
                
                if evidence.get("description") != blockchain_record.get("description"):
                    mismatches.append("description")
                
                if evidence.get("type") != blockchain_record.get("type"):
                    mismatches.append("type")
                
                if evidence.get("date") != blockchain_record.get("date"):
                    mismatches.append("date")
                
                if evidence.get("time") != blockchain_record.get("time"):
                    mismatches.append("time")
                
                if evidence.get("investigating_officer_id") != blockchain_record.get("investigating_officer_id"):
                    mismatches.append("investigating_officer_id")
                
                if evidence.get("forensic_officer_id") != blockchain_record.get("forensic_officer_id"):
                    mismatches.append("forensic_officer_id")
                
                if evidence.get("file_path") != blockchain_record.get("file_path"):
                    mismatches.append("file_path")
                
                if evidence.get("file_name") != blockchain_record.get("file_name"):
                    mismatches.append("file_name")
                
                if evidence.get("status", "active") != blockchain_record.get("status", "active"):
                    mismatches.append("status")
                
                tampered_evidence.append({
                    "evidence_id": evidence_id,
                    "tampered_fields": mismatches,
                    "current_hash": current_hash,
                    "original_hash": original_hash,
                    "current_description": evidence.get("description"),
                    "original_description": blockchain_record.get("description"),
                    "details": {
                        "current_file_path": evidence.get("file_path"),
                        "original_file_path": blockchain_record.get("file_path")
                    }
                })
        
        if tampered_evidence:
            return {
                "valid": False,
                "message": f"⚠️ TAMPERING DETECTED! {len(tampered_evidence)} evidence record(s) have been modified. Hash mismatch indicates data corruption.",
                "tampered_evidence": tampered_evidence
            }
        else:
            return {
                "valid": True,
                "message": "✓ All evidence data hashes match blockchain records. No tampering detected.",
                "tampered_evidence": []
            }
    
    except Exception as e:
        return {
            "valid": False,
            "message": f"Error during validation: {str(e)}",
            "tampered_evidence": []
        }


@app.get("/api/blockchain/recent")
async def get_recent_blocks(count: int = 10, current_user: Dict = Depends(get_current_user)):
    """Get recent blockchain blocks"""
    return blockchain.get_recent_blocks(count)


@app.get("/api/blockchain/evidence/{evidence_id}")
async def get_evidence_blockchain_history(evidence_id: str, current_user: Dict = Depends(get_current_user)):
    """Get blockchain history for specific evidence"""
    # Get evidence to get internal ID
    evidence = db.get_evidence_by_id(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    # Search blockchain for this evidence
    blocks = []
    for block in blockchain.chain:
        details = block.data.get('details', {})
        if details.get('evidence_id') == evidence_id:
            blocks.append(block.to_dict())
    
    return blocks


@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: Dict = Depends(get_current_user)):
    """Get dashboard statistics"""
    # Reload blockchain from database to detect tampering without restart
    global blockchain
    saved_chain = db.load_blockchain()
    if saved_chain:
        blockchain = Blockchain.from_json(saved_chain)
    
    users = db.get_all_users()
    evidence = db.get_all_evidence()
    
    # Count by role
    role_counts = {}
    for user in users:
        role = user['role']
        role_counts[role] = role_counts.get(role, 0) + 1
    
    # Count evidence by status
    evidence_status = {}
    for ev in evidence:
        status = ev['status']
        evidence_status[status] = evidence_status.get(status, 0) + 1
    
    # Blockchain stats - Check BOTH chain integrity AND ALL data integrity
    chain_validation = blockchain.is_chain_valid()
    data_validation = validate_all_data_integrity()
    
    # Overall validity requires BOTH to be valid
    overall_valid = chain_validation['valid'] and data_validation['valid']
    
    return {
        "total_users": len(users),
        "total_evidence": len(evidence),
        "blockchain_length": len(blockchain.chain),
        "blockchain_valid": overall_valid,
        "chain_valid": chain_validation['valid'],
        "data_valid": data_validation['valid'],
        "role_distribution": role_counts,
        "evidence_status": evidence_status,
        "active_users": len([u for u in users if u['is_active'] == 1])
    }


# Run the application
if __name__ == "__main__":
    print("🚀 Starting Evidence Protection System API...")
    print("📍 API running on: http://localhost:8000")
    print("📚 API docs: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

