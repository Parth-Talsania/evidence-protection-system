import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FaSearch, FaHistory, FaFile, FaImage, FaDownload } from 'react-icons/fa'
import { evidenceAPI, evidenceLogAPI } from '../../utils/api'

const SearchEvidence = () => {
  const [searchId, setSearchId] = useState('')
  const [evidence, setEvidence] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    setNotFound(false)
    setEvidence(null)
    setLogs([])

    try {
      const evidenceRes = await evidenceAPI.getById(searchId)
      setEvidence(evidenceRes.data)

      // Load logs for this evidence
      const logsRes = await evidenceLogAPI.getByEvidenceId(searchId)
      setLogs(logsRes.data)
    } catch (error) {
      if (error.response?.status === 404) {
        setNotFound(true)
      }
      console.error('Failed to search evidence:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Search Evidence</h2>

      {/* Search Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-6"
      >
        <form onSubmit={handleSearch} className="flex space-x-4">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Enter Evidence ID (e.g., EV-2025-001)"
            className="input-field flex-1"
            required
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            <FaSearch />
            <span>{loading ? 'Searching...' : 'Search'}</span>
          </motion.button>
        </form>
      </motion.div>

      {/* Not Found Message */}
      {notFound && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg"
        >
          Evidence not found. Please check the ID and try again.
        </motion.div>
      )}

      {/* Evidence Details */}
      {evidence && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Main Evidence Info */}
          <div className="card">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Evidence Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Evidence ID</label>
                <p className="text-lg font-semibold text-gray-800">{evidence.evidence_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Type</label>
                <p className="text-lg font-semibold text-gray-800">{evidence.type}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-800">{evidence.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Date Collected</label>
                <p className="text-gray-800">{evidence.date}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Time Collected</label>
                <p className="text-gray-800">{evidence.time}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Investigating Officer ID</label>
                <p className="text-gray-800">{evidence.investigating_officer_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Forensic Officer ID</label>
                <p className="text-gray-800">{evidence.forensic_officer_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  evidence.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {evidence.status}
                </span>
              </div>
              {evidence.file_name && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600">Attached Document</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg flex-1">
                      {evidence.file_type?.startsWith('image/') ? (
                        <FaImage className="text-blue-600" />
                      ) : (
                        <FaFile className="text-blue-600" />
                      )}
                      <span className="text-sm text-blue-800">{evidence.file_name}</span>
                    </div>
                    <a
                      href={`http://localhost:8000/${evidence.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 bg-green-50 hover:bg-green-100 text-green-600 px-4 py-2 rounded-lg transition-colors"
                    >
                      <FaDownload />
                      <span className="text-sm font-medium">Download</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Movement Logs */}
          <div className="card">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FaHistory className="mr-2 text-orange-600" />
              Movement History & Chain of Custody
            </h3>
            
            {logs.length > 0 ? (
              <div className="space-y-3">
                {logs.map((log, index) => (
                  <div key={log.id} className="border-l-4 border-orange-600 bg-gray-50 p-4 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-gray-800 capitalize">
                          {log.log_type} Log
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {log.item_count && (
                        <p><strong>Item Count:</strong> {log.item_count}</p>
                      )}
                      {log.size && (
                        <p><strong>Size:</strong> {log.size}</p>
                      )}
                      {log.source && (
                        <p><strong>From:</strong> {log.source}</p>
                      )}
                      {log.destination && (
                        <p><strong>To:</strong> {log.destination}</p>
                      )}
                      <p className="col-span-2"><strong>Handled by:</strong> {log.officer_name}</p>
                      {log.description && (
                        <p className="col-span-2"><strong>Notes:</strong> {log.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No movement logs recorded yet</p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default SearchEvidence

