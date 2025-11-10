# 🚀 Quick Setup Guide - Evidence Protection System

## Step-by-Step Installation

### ⚡ Quick Start (For Developers)

#### 1. Backend Setup (5 minutes)

```bash
# Navigate to backend folder
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the server
python main.py
```

✅ Backend will start on `http://localhost:8000`  
✅ API Docs available at `http://localhost:8000/docs`

#### 2. Frontend Setup (5 minutes)

Open a **new terminal window**:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start the application
npm start
```

✅ Frontend will open automatically at `http://localhost:3000`

---

## 🎯 First Time Login

1. Navigate to `http://localhost:3000`
2. Login with default admin credentials:
   - **Username:** `admin`
   - **Password:** `admin123`

---

## 📋 Creating Your First Test Users

### As Admin:

1. **Go to:** Admin Dashboard → User Management
2. **Click:** "Add User" button
3. **Create a Forensic Officer:**
   - Username: `forensic1`
   - Password: `forensic123`
   - Full Name: `John Forensic`
   - Role: `Forensic Officer`
   - Email: `forensic@test.com`

4. **Create an Evidence Room Staff:**
   - Username: `evidence1`
   - Password: `evidence123`
   - Full Name: `Sarah Evidence`
   - Role: `Evidence Room Staff`
   - Email: `evidence@test.com`

5. **Create a Police Officer:**
   - Username: `police1`
   - Password: `police123`
   - Full Name: `Mike Police`
   - Role: `Police Officer`
   - Email: `police@test.com`

---

## 🧪 Testing Complete Workflow

### Step 1: Add Evidence (Forensic Officer)

1. **Logout** and login as `forensic1`
2. Go to **"Add Evidence"**
3. Fill in:
   - Evidence ID: `EV-2025-001`
   - Description: `Fingerprint samples from crime scene`
   - Type: `Physical Evidence`
   - Date: Today's date
   - Time: Current time
   - Investigating Officer ID: `1`
   - Forensic Officer ID: `2`
4. **Submit** - This creates a blockchain block!

### Step 2: Log Entry (Evidence Room Staff)

1. **Logout** and login as `evidence1`
2. Go to **"Entry/Exit Logs"**
3. Fill in:
   - Evidence ID: `EV-2025-001`
   - Log Type: `Entry`
   - Item Count: `5`
   - Size: `Small box`
   - Description: `Evidence received from forensic lab`
4. **Submit** - Another blockchain block created!

### Step 3: Log Movement (Police Officer)

1. **Logout** and login as `police1`
2. Go to **"Movement Log"**
3. Fill in:
   - Evidence ID: `EV-2025-001`
   - Source: `Evidence Room A`
   - Destination: `Court Room 5`
   - Description: `Evidence transferred for trial presentation`
4. **Submit** - Blockchain updated!

### Step 4: Validate Blockchain (Admin)

1. **Logout** and login as `admin`
2. Go to **Admin Dashboard → Blockchain**
3. Click **"Validate Blockchain"**
4. See the complete chain and validation result

---

## 🔍 Exploring Features

### Admin Dashboard

- **Overview:** View system statistics
- **User Management:** Create, edit, delete users
- **Blockchain:** Validate integrity, view all blocks
- **Activity Logs:** See all user actions

### Forensic Dashboard

- **Evidence List:** View, edit, delete evidence
- **Add Evidence:** Create new evidence records
- **History:** View blockchain history for each item

### Evidence Room Dashboard

- **Search Evidence:** Find evidence by ID
- **Entry/Exit Logs:** Record evidence in/out

### Police Dashboard

- **Search Evidence:** Find and view evidence
- **Movement Log:** Track evidence transfers

---

## 🎨 UI Features to Try

✅ **Search Functionality** - Quick evidence lookup  
✅ **Modal Forms** - Clean data entry  
✅ **Animations** - Smooth transitions  
✅ **Responsive Design** - Try resizing browser  
✅ **Role-Based UI** - Different views per role  
✅ **Real-time Stats** - Live dashboard updates  

---

## 🐛 Common Issues & Solutions

### Backend Won't Start

**Error:** `Port 8000 already in use`

**Solution:** Kill the process or change port in `main.py`:
```python
uvicorn.run(app, host="0.0.0.0", port=8001)  # Changed to 8001
```

Also update frontend `src/utils/api.js`:
```javascript
const API_BASE_URL = 'http://localhost:8001/api'
```

---

### Frontend Shows Connection Error

**Issue:** Backend not running

**Solution:** 
1. Check if backend is running on `http://localhost:8000`
2. Visit `http://localhost:8000/docs` to verify
3. Check browser console for CORS errors

---

### Login Fails

**Issue:** Invalid credentials

**Solution:**
- Default admin: `admin` / `admin123`
- Password is case-sensitive
- Check for extra spaces

---

## 📦 Database Location

SQLite database is automatically created at:
```
backend/evidence_system.db
```

To reset the database, simply delete this file and restart the backend.

---

## 🔐 API Testing (Optional)

You can test the API directly using the interactive docs:

1. Go to `http://localhost:8000/docs`
2. Click on any endpoint
3. Click "Try it out"
4. Fill in parameters
5. Execute

For authenticated endpoints:
1. Login via `/api/auth/login`
2. Copy the `access_token`
3. Click "Authorize" button at top
4. Enter: `Bearer YOUR_TOKEN`
5. Now you can test protected endpoints

---

## 📊 Viewing Blockchain Data

### Via API Docs:
1. Go to `http://localhost:8000/docs`
2. Use `GET /api/blockchain` endpoint
3. See the entire chain in JSON format

### Via Admin UI:
1. Login as admin
2. Go to Blockchain section
3. View formatted blocks with validation

---

## 🎓 Learning the Code

### Backend Structure:
- `blockchain.py` - Custom blockchain implementation
- `database.py` - SQLite operations
- `auth.py` - JWT authentication
- `main.py` - API routes and business logic

### Frontend Structure:
- `src/pages/` - All page components organized by role
- `src/components/` - Reusable UI components
- `src/context/` - Authentication state management
- `src/utils/` - API integration layer

---

## 🚀 Next Steps

1. ✅ Complete the test workflow above
2. ✅ Explore all four user role dashboards
3. ✅ Try validating the blockchain
4. ✅ Add multiple evidence items
5. ✅ Create entry/exit and movement logs
6. ✅ View activity logs as admin
7. ✅ Experiment with the UI features

---

**Happy Testing! 🎉**

The system is now fully operational and ready to demonstrate blockchain-based evidence protection!

