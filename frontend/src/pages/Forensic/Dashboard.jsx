import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../../components/Navbar'
import EvidenceList from './EvidenceList'
import AddEvidence from './AddEvidence'
import { FaBoxOpen, FaPlus } from 'react-icons/fa'

const ForensicDashboard = () => {
  const location = useLocation()

  const menuItems = [
    { path: '/forensic', label: 'Evidence List', icon: FaBoxOpen },
    { path: '/forensic/add', label: 'Add Evidence', icon: FaPlus }
  ]

  const isActive = (path) => {
    if (path === '/forensic') {
      return location.pathname === '/forensic'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Forensic Officer Dashboard" />

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
                        ? 'bg-blue-600 text-white'
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
            <Route path="/" element={<EvidenceList />} />
            <Route path="/add" element={<AddEvidence />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default ForensicDashboard

