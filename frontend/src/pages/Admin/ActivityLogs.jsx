import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaHistory, FaFilter } from 'react-icons/fa'
import { activityLogAPI } from '../../utils/api'

const ActivityLogs = () => {
  const [logs, setLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState('all')
  const [filterRole, setFilterRole] = useState('all')

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filterAction, filterRole, logs])

  const loadLogs = async () => {
    try {
      const response = await activityLogAPI.getAll()
      setLogs(response.data)
      setFilteredLogs(response.data)
    } catch (error) {
      console.error('Failed to load logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = logs

    if (filterAction !== 'all') {
      filtered = filtered.filter(log => log.action === filterAction)
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(log => log.role === filterRole)
    }

    setFilteredLogs(filtered)
  }

  const getActionBadge = (action) => {
    const colors = {
      login: 'bg-blue-100 text-blue-800',
      create_user: 'bg-green-100 text-green-800',
      update_user: 'bg-yellow-100 text-yellow-800',
      delete_user: 'bg-red-100 text-red-800',
      create_evidence: 'bg-purple-100 text-purple-800',
      update_evidence: 'bg-orange-100 text-orange-800',
      delete_evidence: 'bg-red-100 text-red-800'
    }
    return colors[action] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Get unique actions and roles for filters
  const uniqueActions = [...new Set(logs.map(log => log.action))]
  const uniqueRoles = [...new Set(logs.map(log => log.role))]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaHistory className="mr-3" />
          Activity Logs
        </h2>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center space-x-4">
          <FaFilter className="text-gray-600" />
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Action</label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="input-field"
              >
                <option value="all">All Actions</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="input-field"
              >
                <option value="all">All Roles</option>
                {uniqueRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card">
        <p className="text-sm text-gray-600 mb-4">
          Showing {filteredLogs.length} of {logs.length} logs
        </p>
        
        <div className="table-container">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">ID</th>
                <th className="table-header">Timestamp</th>
                <th className="table-header">User</th>
                <th className="table-header">Role</th>
                <th className="table-header">Action</th>
                <th className="table-header">Entity</th>
                <th className="table-header">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log, index) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-gray-50"
                >
                  <td className="table-cell font-medium">{log.id}</td>
                  <td className="table-cell text-sm">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="table-cell">
                    <div>
                      <p className="font-medium">{log.full_name}</p>
                      <p className="text-xs text-gray-500">{log.username}</p>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {log.role}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionBadge(log.action)}`}>
                      {log.action.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm">
                      <p className="font-medium">{log.entity_type}</p>
                      {log.entity_id && (
                        <p className="text-xs text-gray-500">ID: {log.entity_id}</p>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    {log.details ? (
                      <details className="cursor-pointer">
                        <summary className="text-primary-600 hover:text-primary-800">
                          View
                        </summary>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-2 max-w-xs overflow-x-auto">
                          {log.details}
                        </pre>
                      </details>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No logs found matching the filters
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityLogs

