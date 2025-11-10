import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import AdminDashboard from './pages/Admin/Dashboard'
import ForensicDashboard from './pages/Forensic/Dashboard'
import EvidenceRoomDashboard from './pages/EvidenceRoom/Dashboard'
import PoliceDashboard from './pages/Police/Dashboard'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

// Unauthorized Page
const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access this page.</p>
        <a href="/login" className="btn-primary mt-4 inline-block">Back to Login</a>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Forensic Routes */}
          <Route
            path="/forensic/*"
            element={
              <ProtectedRoute allowedRoles={['forensic']}>
                <ForensicDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Evidence Room Routes */}
          <Route
            path="/evidence-room/*"
            element={
              <ProtectedRoute allowedRoles={['evidence_room']}>
                <EvidenceRoomDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Police Routes */}
          <Route
            path="/police/*"
            element={
              <ProtectedRoute allowedRoles={['police']}>
                <PoliceDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

