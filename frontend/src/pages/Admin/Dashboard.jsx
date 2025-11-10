import React, { useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../../components/Navbar'
import Overview from './Overview'
import UserManagement from './UserManagement'
import BlockchainValidation from './BlockchainValidation'
import ActivityLogs from './ActivityLogs'
import { FaHome, FaUsers, FaCube, FaHistory } from 'react-icons/fa'

const AdminDashboard = () => {
  const location = useLocation()

  const menuItems = [
    { path: '/admin', label: 'Overview', icon: FaHome },
    { path: '/admin/users', label: 'User Management', icon: FaUsers },
    { path: '/admin/blockchain', label: 'Blockchain', icon: FaCube },
    { path: '/admin/logs', label: 'Activity Logs', icon: FaHistory }
  ]

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Admin Dashboard" />

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              
              return (
                <Link key={item.path} to={item.path}>
                  <motion.div
                    whileHover={{ x: 5 }}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                      active
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="text-xl" />
                    <span className="font-medium">{item.label}</span>
                  </motion.div>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/blockchain" element={<BlockchainValidation />} />
            <Route path="/logs" element={<ActivityLogs />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard

