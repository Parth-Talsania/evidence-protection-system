# Evidence Protection System using Blockchain Technology

A production-grade blockchain-based evidence protection system that ensures **tamper-proof, transparent, and role-based tracking** of forensic evidence in criminal investigations.

## 🌟 Features

- **Custom Blockchain Implementation** - Built from scratch using Python (no third-party blockchain SDKs)
- **Role-Based Access Control** - Four user roles: Admin, Forensic Officer, Evidence Room Staff, and Police
- **Immutable Evidence Tracking** - Every action creates a permanent blockchain record
- **Chain of Custody** - Complete tracking of evidence movement and handling
- **Blockchain Validation** - Real-time integrity checking and tamper detection
- **Modern UI** - Beautiful, responsive interface built with React and TailwindCSS
- **RESTful API** - Clean FastAPI backend with JWT authentication

## 🏗️ Technology Stack

### Backend
- **Python 3.8+**
- **FastAPI** - Modern web framework
- **SQLite** - Database for MVP
- **JWT** - Authentication
- **Custom Blockchain** - hashlib, datetime, json

### Frontend
- **React 18** - UI framework
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **Axios** - HTTP client
- **React Router** - Navigation
- **Vite** - Build tool

## 📁 Project Structure

```
evidence-protection-system/
│
├── backend/
│   ├── main.py              # FastAPI application entry point
│   ├── blockchain.py        # Custom blockchain implementation
│   ├── database.py          # SQLite database operations
│   ├── auth.py              # JWT authentication & authorization
│   ├── requirements.txt     # Python dependencies
│   └── evidence_system.db   # SQLite database (auto-created)
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   └── StatCard.jsx
│   │   ├── context/         # React context
│   │   │   └── AuthContext.jsx
│   │   ├── pages/           # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Admin/       # Admin module
│   │   │   ├── Forensic/    # Forensic module
│   │   │   ├── EvidenceRoom/ # Evidence Room module
│   │   │   └── Police/      # Police module
│   │   ├── utils/
│   │   │   └── api.js       # API integration
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Start the backend server:
```bash
python main.py
```

The API will be running on `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will open automatically at `http://localhost:3000`

## 👥 User Roles & Credentials

### Default Admin Account
- **Username:** `admin`
- **Password:** `admin123`

### Role Capabilities

#### 1️⃣ Admin
- User management (add, update, delete users)
- Assign user roles
- View blockchain integrity dashboard
- Validate blockchain
- View all activity logs
- System overview and statistics

#### 2️⃣ Forensic Officer
- Add new evidence
- Update evidence details
- Delete evidence
- View all evidence records
- Search evidence
- View blockchain history for evidence

#### 3️⃣ Evidence Room Staff
- Search evidence by ID
- Add entry/exit logs
- Track item count, size, and condition
- View movement history

#### 4️⃣ Police Officer
- Search evidence by ID
- Add evidence movement logs
- Track source and destination
- View chain of custody

## 🔗 Blockchain Architecture

### Block Structure
```json
{
  "index": 123,
  "timestamp": "2025-10-13T10:30:00",
  "data": {
    "action": "add_evidence",
    "user_role": "forensic",
    "user_id": 5,
    "details": {
      "evidence_id": "EV-2025-001",
      "description": "...",
      "type": "Physical"
    }
  },
  "prev_hash": "abc123...",
  "hash": "def456..."
}
```

### Blockchain Actions
- `add_evidence` - New evidence added
- `update_evidence` - Evidence modified
- `delete_evidence` - Evidence deleted
- `evidence_entry` - Evidence room entry
- `evidence_exit` - Evidence room exit
- `evidence_movement` - Location transfer
- `create_user` - New user added
- `update_user` - User modified
- `delete_user` - User removed

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-Based Authorization** - Granular access control
- **Password Hashing** - SHA-256 password encryption
- **Blockchain Integrity** - Tamper-proof evidence tracking
- **Activity Logging** - Complete audit trail

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Users (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Evidence
- `GET /api/evidence` - List all evidence
- `GET /api/evidence/{id}` - Get evidence by ID
- `POST /api/evidence` - Create evidence
- `PUT /api/evidence/{id}` - Update evidence
- `DELETE /api/evidence/{id}` - Delete evidence

### Evidence Logs
- `POST /api/evidence-logs` - Create log
- `GET /api/evidence-logs/{evidence_id}` - Get logs

### Blockchain
- `GET /api/blockchain` - Get entire chain
- `GET /api/blockchain/validate` - Validate integrity
- `GET /api/blockchain/recent` - Get recent blocks
- `GET /api/blockchain/evidence/{id}` - Get evidence history

### Dashboard
- `GET /api/dashboard/stats` - Get statistics

## 🎨 UI Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Smooth Animations** - Framer Motion animations
- **Modern Components** - Clean, professional UI
- **Real-time Updates** - Live data refresh
- **Search & Filter** - Quick data access
- **Modal Forms** - Intuitive data entry
- **Color-Coded Roles** - Visual role identification
- **Toast Notifications** - User feedback

## 🧪 Testing the System

1. **Login as Admin**
   - Create additional users (Forensic, Evidence Room, Police)
   
2. **Login as Forensic Officer**
   - Add new evidence items
   - Update and view evidence
   
3. **Login as Evidence Room Staff**
   - Search for evidence
   - Add entry/exit logs
   
4. **Login as Police Officer**
   - Search evidence
   - Add movement logs
   
5. **Return to Admin**
   - Validate blockchain
   - View activity logs
   - Check blockchain integrity

## 📝 Development Notes

### Adding New Users (via Admin)
1. Navigate to Admin → User Management
2. Click "Add User"
3. Fill in user details
4. Select appropriate role
5. Submit to create (automatically added to blockchain)

### Evidence ID Format
Use a consistent format like: `EV-YYYY-XXX`
- Example: `EV-2025-001`, `EV-2025-002`

### Blockchain Validation
The system automatically:
- Calculates hash for each block
- Verifies previous hash linkage
- Detects any tampering or modifications
- Provides detailed validation reports

## 🐛 Troubleshooting

### Backend Issues
- **Port 8000 already in use**: Change port in `main.py`
- **Module not found**: Run `pip install -r requirements.txt`
- **Database locked**: Close other connections to SQLite

### Frontend Issues
- **Port 3000 already in use**: Vite will auto-assign another port
- **Modules not found**: Run `npm install`
- **API connection errors**: Ensure backend is running on port 8000


## 📄 License

This project is created for educational and demonstration purposes.

---

## 🎯 Key Highlights

✅ **Custom Blockchain** - No third-party blockchain libraries  
✅ **Complete CRUD** - Full evidence lifecycle management  
✅ **Role-Based** - Four distinct user roles  
✅ **Immutable Logs** - Tamper-proof blockchain records  
✅ **Modern Stack** - FastAPI + React + TailwindCSS  
✅ **Beautiful UI** - Professional, responsive design  
✅ **Production Ready** - Clean, documented, modular code  

---



