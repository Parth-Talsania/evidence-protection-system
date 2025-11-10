import sqlite3
import os

print("\n" + "="*60)
print("  DATABASE STATUS CHECK")
print("="*60 + "\n")

# Check if database file exists
db_file = "evidence_system.db"
if os.path.exists(db_file):
    print(f"[OK] Database file exists: {db_file}")
    
    # Check tables
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    
    print(f"\n[INFO] Tables found: {len(tables)}")
    for table in tables:
        print(f"   - {table}")
    
    # Check if blockchain_data exists
    if 'blockchain_data' in tables:
        print("\n[OK] blockchain_data table exists")
        
        # Check if blockchain exists
        cursor.execute("SELECT chain_json FROM blockchain_data WHERE id = 1")
        result = cursor.fetchone()
        if result:
            import json
            chain = json.loads(result[0])
            print(f"[OK] Blockchain loaded: {len(chain)} blocks")
        else:
            print("[WARN] blockchain_data table exists but no blockchain saved yet")
    else:
        print("\n[ERROR] blockchain_data table DOES NOT exist!")
        print("   This means the backend hasn't been initialized.")
    
    conn.close()
    
else:
    print(f"[ERROR] Database file NOT found: {db_file}")
    print("   The backend needs to be run at least once to create the database.")

print("\n" + "="*60)
print("  SOLUTION")
print("="*60)
print("\nIf database or tables are missing:")
print("1. Run: python main.py")
print("2. Wait for backend to start")
print("3. Add some evidence through the UI")
print("4. Stop backend (Ctrl+C)")
print("5. Run verify_tampering.py again")
