import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaUsers, FaBoxOpen, FaCube, FaCheckCircle } from 'react-icons/fa'
import StatCard from '../../components/StatCard'
import { dashboardAPI, blockchainAPI } from '../../utils/api'

const Overview = () => {
  const [stats, setStats] = useState(null)
  const [recentBlocks, setRecentBlocks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, blocksRes] = await Promise.all([
        dashboardAPI.getStats(),
        blockchainAPI.getRecent(5)
      ])
      setStats(statsRes.data)
      setRecentBlocks(blocksRes.data)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats?.total_users || 0}
          icon={FaUsers}
          color="primary"
        />
        <StatCard
          title="Total Evidence"
          value={stats?.total_evidence || 0}
          icon={FaBoxOpen}
          color="green"
        />
        <StatCard
          title="Blockchain Blocks"
          value={stats?.blockchain_length || 0}
          icon={FaCube}
          color="purple"
        />
        <StatCard
          title="Blockchain Status"
          value={stats?.blockchain_valid ? 'Valid' : 'Invalid'}
          icon={FaCheckCircle}
          color={stats?.blockchain_valid ? 'green' : 'red'}
        />
      </div>

      {/* Charts/Info Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Role Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">User Role Distribution</h3>
          <div className="space-y-3">
            {stats?.role_distribution && Object.entries(stats.role_distribution).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <span className="text-gray-600 capitalize">{role.replace('_', ' ')}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${(count / stats.total_users) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Evidence Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Evidence Status</h3>
          <div className="space-y-3">
            {stats?.evidence_status && Object.entries(stats.evidence_status).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-gray-600 capitalize">{status}</span>
                <span className="text-xl font-bold text-gray-800">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Blockchain Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Blockchain Activity</h3>
        <div className="space-y-3">
          {recentBlocks.map((block) => (
            <div key={block.index} className="border-l-4 border-primary-600 bg-gray-50 p-4 rounded">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-gray-800">Block #{block.index}</span>
                <span className="text-xs text-gray-500">
                  {new Date(block.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Action: <span className="font-medium">{block.data.action}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1 font-mono truncate">
                Hash: {block.hash}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default Overview

