"""
Database models and operations for Evidence Protection System
Using SQLite for MVP simplicity
"""
import sqlite3
from datetime import datetime
from typing import List, Dict, Any, Optional
import json
from contextlib import contextmanager


class Database:
    """Database handler for the Evidence Protection System"""
    
    def __init__(self, db_name: str = "evidence_system.db"):
        self.db_name = db_name
        self.init_database()
    
    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = sqlite3.connect(self.db_name)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def init_database(self):
        """Initialize database tables"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL,
                    full_name TEXT NOT NULL,
                    badge_number TEXT,
                    email TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    is_active INTEGER DEFAULT 1
                )
            """)
            
            # Evidence table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS evidence (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    evidence_id TEXT UNIQUE NOT NULL,
                    description TEXT NOT NULL,
                    type TEXT NOT NULL,
                    date TEXT NOT NULL,
                    time TEXT NOT NULL,
                    investigating_officer_id INTEGER,
                    forensic_officer_id INTEGER,
                    status TEXT DEFAULT 'active',
                    file_path TEXT,
                    file_name TEXT,
                    file_type TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (investigating_officer_id) REFERENCES users(id),
                    FOREIGN KEY (forensic_officer_id) REFERENCES users(id)
                )
            """)
            
            # Migration: Add file columns if they don't exist
            # Check if file_path column exists
            cursor.execute("PRAGMA table_info(evidence)")
            columns = [column[1] for column in cursor.fetchall()]
            
            if 'file_path' not in columns:
                cursor.execute("ALTER TABLE evidence ADD COLUMN file_path TEXT")
            if 'file_name' not in columns:
                cursor.execute("ALTER TABLE evidence ADD COLUMN file_name TEXT")
            if 'file_type' not in columns:
                cursor.execute("ALTER TABLE evidence ADD COLUMN file_type TEXT")
            
            # Evidence logs table (for entry/exit and movement)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS evidence_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    evidence_id INTEGER NOT NULL,
                    log_type TEXT NOT NULL,
                    item_count INTEGER,
                    size TEXT,
                    description TEXT,
                    source TEXT,
                    destination TEXT,
                    officer_id INTEGER NOT NULL,
                    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (evidence_id) REFERENCES evidence(id),
                    FOREIGN KEY (officer_id) REFERENCES users(id)
                )
            """)
            
            # Activity logs table (for audit trail)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS activity_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    action TEXT NOT NULL,
                    entity_type TEXT NOT NULL,
                    entity_id INTEGER,
                    details TEXT,
                    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)
            
            # Blockchain storage table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS blockchain_data (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    chain_json TEXT NOT NULL,
                    last_updated TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create default admin user if not exists
            cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
            if cursor.fetchone()['count'] == 0:
                # Password: admin123 (hashed with simple method for MVP)
                import hashlib
                password_hash = hashlib.sha256("admin123".encode()).hexdigest()
                cursor.execute("""
                    INSERT INTO users (username, password, role, full_name, email)
                    VALUES (?, ?, ?, ?, ?)
                """, ("admin", password_hash, "admin", "System Administrator", "admin@evidence.sys"))
    
    # User operations
    def create_user(self, username: str, password: str, role: str, full_name: str, 
                   badge_number: str = None, email: str = None) -> int:
        """Create a new user"""
        import hashlib
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO users (username, password, role, full_name, badge_number, email)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (username, password_hash, role, full_name, badge_number, email))
            return cursor.lastrowid
    
    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user by username"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE username = ? AND is_active = 1", (username,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def get_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def get_all_users(self) -> List[Dict[str, Any]]:
        """Get all users"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users ORDER BY created_at DESC")
            return [dict(row) for row in cursor.fetchall()]
    
    def update_user(self, user_id: int, **kwargs) -> bool:
        """Update user information"""
        allowed_fields = ['full_name', 'badge_number', 'email', 'role', 'is_active']
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields}
        
        if not updates:
            return False
        
        set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
        values = list(updates.values()) + [user_id]
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"UPDATE users SET {set_clause} WHERE id = ?", values)
            return cursor.rowcount > 0
    
    def delete_user(self, user_id: int) -> bool:
        """Soft delete user"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE users SET is_active = 0 WHERE id = ?", (user_id,))
            return cursor.rowcount > 0
    
    # Evidence operations
    def create_evidence(self, evidence_id: str, description: str, evidence_type: str,
                       date: str, time: str, investigating_officer_id: int,
                       forensic_officer_id: int, file_path: str = None, 
                       file_name: str = None, file_type: str = None) -> int:
        """Create new evidence record"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO evidence (evidence_id, description, type, date, time,
                                    investigating_officer_id, forensic_officer_id,
                                    file_path, file_name, file_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (evidence_id, description, evidence_type, date, time,
                  investigating_officer_id, forensic_officer_id, file_path, 
                  file_name, file_type))
            return cursor.lastrowid
    
    def get_evidence_by_id(self, evidence_id: str) -> Optional[Dict[str, Any]]:
        """Get evidence by evidence_id"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM evidence WHERE evidence_id = ?", (evidence_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def get_all_evidence(self) -> List[Dict[str, Any]]:
        """Get all evidence records"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM evidence ORDER BY created_at DESC")
            return [dict(row) for row in cursor.fetchall()]
    
    def update_evidence(self, evidence_id: str, **kwargs) -> bool:
        """Update evidence record"""
        allowed_fields = ['description', 'type', 'date', 'time', 'investigating_officer_id',
                         'forensic_officer_id', 'status', 'file_path', 'file_name', 'file_type']
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields}
        updates['updated_at'] = datetime.now().isoformat()
        
        if not updates:
            return False
        
        set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
        values = list(updates.values()) + [evidence_id]
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"UPDATE evidence SET {set_clause} WHERE evidence_id = ?", values)
            return cursor.rowcount > 0
    
    def delete_evidence(self, evidence_id: str) -> bool:
        """Soft delete evidence"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE evidence SET status = 'deleted' WHERE evidence_id = ?", (evidence_id,))
            return cursor.rowcount > 0
    
    # Evidence log operations
    def create_evidence_log(self, evidence_id: int, log_type: str, officer_id: int,
                           **kwargs) -> int:
        """Create evidence log entry"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO evidence_logs (evidence_id, log_type, item_count, size,
                                         description, source, destination, officer_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (evidence_id, log_type, kwargs.get('item_count'), kwargs.get('size'),
                  kwargs.get('description'), kwargs.get('source'), kwargs.get('destination'),
                  officer_id))
            return cursor.lastrowid
    
    def get_evidence_logs(self, evidence_id: int) -> List[Dict[str, Any]]:
        """Get all logs for specific evidence"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT el.*, u.full_name as officer_name
                FROM evidence_logs el
                JOIN users u ON el.officer_id = u.id
                WHERE el.evidence_id = ?
                ORDER BY el.timestamp DESC
            """, (evidence_id,))
            return [dict(row) for row in cursor.fetchall()]
    
    def get_all_evidence_logs(self) -> List[Dict[str, Any]]:
        """Get ALL evidence logs for validation"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM evidence_logs
                ORDER BY timestamp DESC
            """)
            return [dict(row) for row in cursor.fetchall()]
    
    # Activity log operations
    def create_activity_log(self, user_id: int, action: str, entity_type: str,
                           entity_id: int = None, details: Dict = None):
        """Create activity log"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
                VALUES (?, ?, ?, ?, ?)
            """, (user_id, action, entity_type, entity_id, json.dumps(details) if details else None))
    
    def get_all_activity_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all activity logs"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT al.*, u.username, u.role, u.full_name
                FROM activity_logs al
                JOIN users u ON al.user_id = u.id
                ORDER BY al.timestamp DESC
                LIMIT ?
            """, (limit,))
            return [dict(row) for row in cursor.fetchall()]
    
    # Blockchain storage operations
    def save_blockchain(self, chain_json: str):
        """Save blockchain to database"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO blockchain_data (id, chain_json, last_updated)
                VALUES (1, ?, ?)
            """, (chain_json, datetime.now().isoformat()))
    
    def load_blockchain(self) -> Optional[str]:
        """Load blockchain from database"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT chain_json FROM blockchain_data WHERE id = 1")
            row = cursor.fetchone()
            return row['chain_json'] if row else None

