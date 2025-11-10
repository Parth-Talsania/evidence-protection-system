import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaShieldAlt, FaSignOutAlt, FaUser } from 'react-icons/fa'

const Navbar = ({ title }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      forensic: 'bg-blue-100 text-blue-800',
      evidence_room: 'bg-green-100 text-green-800',
      police: 'bg-orange-100 text-orange-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrator',
      forensic: 'Forensic Officer',
      evidence_room: 'Evidence Room Staff',
      police: 'Police Officer'
    }
    return labels[role] || role
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <FaShieldAlt className="text-3xl text-primary-600" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{title}</h1>
              <p className="text-xs text-gray-500">Evidence Protection System</p>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800 flex items-center">
                  <FaUser className="mr-2 text-gray-500" />
                  {user?.full_name}
                </p>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user?.role)}`}>
                  {getRoleLabel(user?.role)}
                </span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <FaSignOutAlt />
              <span className="font-medium">Logout</span>
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

